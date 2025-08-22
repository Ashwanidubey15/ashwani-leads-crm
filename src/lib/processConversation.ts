// import { PrismaClient } from "@prisma/client";
// import OpenAI from "openai";

// const prisma = new PrismaClient();
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function processConversation(callId: string, userId: string) {
//   // console.log(
//   //   "🚀 [processConversation] Start for callId:",
//   //   callId,
//   //   " userId:",
//   //   userId
//   // );

//   const conversation = await prisma.conversation.findUnique({
//     where: { callId },
//     include: { contact: true },
//   });

//   if (!conversation) {
//     // console.log("⚠️ No conversation found for callId:", callId);
//     return;
//   }

//   if (!conversation.transcript) {
//     // console.log("⚠️ No transcript found for callId:", callId);
//     return;
//   }

//   // console.log("📝 Transcript found, length:", conversation.transcript.length);

//   const response = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content:
//           "Extract name, email, company, and schedule date from this transcript. Return ONLY valid JSON. Do not include ```json fences or any explanation.",
//       },
//       { role: "user", content: conversation.transcript },
//     ],
//   });

//   let raw = response.choices[0].message?.content || "{}";
//   // console.log("🤖 GPT raw response:", raw);

//   // 🛠 Clean out markdown code fences if GPT added them
//   raw = raw
//     .replace(/```json/g, "")
//     .replace(/```/g, "")
//     .trim();

//   let extracted: any = {};
//   try {
//     extracted = JSON.parse(raw);
//   } catch (e) {
//     console.error("❌ Failed to parse GPT response as JSON:", e);
//     return;
//   }

//   console.log("🔍 Extracted Data:", extracted);

//   // ✅ Update Contact
//   const updatedContact = await prisma.contact.update({
//     where: { id: conversation.contactId! },
//     data: {
//       name: extracted.name ?? conversation.contact?.name ?? "Unknown",
//       email: extracted.email ?? conversation.contact?.email ?? null,
//       company: extracted.company ?? conversation.contact?.company ?? null,
//     },
//   });
//   // console.log("✅ Contact updated:", updatedContact);

//   // ✅ Add Schedule if available
//   const scheduleDate = extracted.scheduleDate || extracted.schedule_date;
//   if (scheduleDate) {
//     try {
//       const newSchedule = await prisma.schedule.create({
//         data: {
//           contactId: conversation.contactId!,
//           scheduleDate: new Date(scheduleDate),
//         },
//       });
//       // console.log("📅 New Schedule created:", newSchedule);
//     } catch (err) {
//       console.error("❌ Failed to create schedule:", err);
//     }
//   } else {
//     // console.log("ℹ️ No schedule date found in extracted data.");
//   }
//   // console.log("🎉 [processConversation] Finished for callId:", callId);
// }
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
Return the schedule date in **ISO 8601 format** (YYYY-MM-DDTHH:MM:SS), e.g. 2025-08-21T22:00:00.
Return ONLY valid JSON without any markdown, code fences, or explanation.
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

  // ✅ Add Schedule if available
  const scheduleDateStr = extracted.scheduleDate || extracted.schedule_date;

  if (scheduleDateStr) {
    const parsedDate = chrono.parseDate(scheduleDateStr);
    if (parsedDate) {
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          contactId: conversation.contactId!,
          scheduleDate: parsedDate,
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
      }
    } else {
      console.warn("⚠️ Could not parse schedule date:", scheduleDateStr);
    }
  }
}
