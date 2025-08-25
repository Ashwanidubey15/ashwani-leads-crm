import { PrismaClient } from "@prisma/client";
import * as chrono from "chrono-node";
import OpenAI from "openai";
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processConversation(callId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { callId },
    include: { contact: true },
  });

  if (!conversation || !conversation.transcript) return;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
Extract name, email, company, and schedule date from this transcript.

- Today’s reference date is: 2025-08-25.
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
    ],
  });

  let raw = response.choices[0].message?.content || "{}";
  raw = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let extracted: any = {};
  try {
    extracted = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Failed to parse GPT response as JSON:", e);
    return;
  }

  const customerNumber = conversation.phoneNumber; // Google Voice number

  // ✅ Upsert contact
  await prisma.contact.upsert({
    where: { phoneNumber: customerNumber },
    update: {
      name: extracted.name ?? conversation.contact?.name ?? "Unknown",
      email: extracted.email ?? conversation.contact?.email ?? null,
      company: extracted.company ?? conversation.contact?.company ?? null,
    },
    create: {
      phoneNumber: customerNumber,
      userId,
      name: extracted.name ?? "Unknown",
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
        console.log("📅 New schedule created:", parsedDate);
      } else {
        console.log("ℹ️ Schedule already exists:", parsedDate);
        await prisma.schedule.update({
          where: {
            id: existingSchedule.id,
          },
          data: {
            scheduleDate: parsedDate,
          },
        });
      }
    } else {
      console.warn("⚠️ Could not parse schedule date:", scheduleDateStr);
    }
  }
}
