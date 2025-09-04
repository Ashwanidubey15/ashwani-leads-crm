import { PrismaClient } from "@prisma/client";
import * as chrono from "chrono-node";
import { aiPromptProcess } from "./aiProcess";
const prisma = new PrismaClient();

export async function processConversation(
  callId: string,
  userId: string,
  assistantId: string
) {
  const conversation = await prisma.conversation.findUnique({
    where: { callId },
    include: { contact: true },
  });

  if (!conversation || !conversation.transcript) return;
  try {
    const respones = await aiPromptProcess([
      {
        role: "system",
        content: `
          Extract name, email, company, and schedule date from this transcript.

          
          - Handle both relative and absolute dates:
            - Relative examples: "today", "tomorrow", "next week", "next month", "next year".
            - Absolute examples: "2026/12", "12 March 2026", "March 12", "26 September at 10 PM".
          - Always return schedule_date in strict ISO 8601 format (YYYY-MM-DDTHH:MM:SS).
          - If no time is provided, default to 09:00:00.
          - If no year is provided in an absolute date, assume the closest future year relative to today’s date.
          - If no name or email is mentioned, return them as null.
          - Return ONLY valid JSON without markdown, code fences, or explanation.
        `,
      },
      { role: "user", content: conversation.transcript },
    ]);
    const extracted = JSON.parse(respones);

    const customerNumber = conversation.phoneNumber;

    // Upsert contact
    await prisma.contact.upsert({
      where: {
        phoneNumber_assistantId: {
          // 👈 composite unique input
          phoneNumber: customerNumber,
          assistantId: assistantId,
        },
      },
      update: {
        name: extracted.name ?? conversation.contact?.name ?? "",
        email: extracted.email ?? conversation.contact?.email ?? null,
        company: extracted.company ?? conversation.contact?.company ?? null,
      },
      create: {
        phoneNumber: customerNumber,
        userId,
        assistantId,
        name: extracted.name ?? "",
        email: extracted.email ?? null,
        company: extracted.company ?? null,
      },
    });
    const scheduleDateStr = extracted.scheduleDate || extracted.schedule_date;

    if (scheduleDateStr) {
      const parsedDate = chrono.parseDate(scheduleDateStr);
      if (parsedDate) {
        const existingSchedule = await prisma.schedule.findFirst({
          where: {
            contactId: conversation.contactId!,
          },
        });

        if (!existingSchedule) {
          await prisma.schedule.create({
            data: {
              contactId: conversation.contactId!,
              scheduleDate: parsedDate,
            },
          });
          console.log(" New schedule created:");
        } else {
          console.log(" Schedule already exists:");
          await prisma.schedule.update({
            where: {
              id: existingSchedule.id,
            },
            data: {
              scheduleDate: parsedDate,
              status: "PENDING",
            },
          });
        }
      }
    }
  } catch (e) {
    console.error("❌ Failed to parse GPT response as JSON:", e);
    return;
  }
}
