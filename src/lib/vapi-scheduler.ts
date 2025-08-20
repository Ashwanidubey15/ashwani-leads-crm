// import { PrismaClient } from "@prisma/client";
// import cron from "node-cron";
// import { fetchAllCallsScheduler } from "./vapi";

// const prisma = new PrismaClient();

// declare global {
//   var __vapiCronStarted: boolean | undefined;
// }

// if (!global.__vapiCronStarted) {
//   cron.schedule("*/10 * * * * *", async () => {
//     console.log("Running every 10 seconds...");
//     try {
//       const calls = await fetchAllCallsScheduler();
//       console.log("Fetched calls:", calls.length);

//       for (const call of calls) {
//         try {
//           const existing = await prisma.conversation.findFirst({
//             where: { callId: call.id },
//           });
//           const durationSeconds = (() => {
//             try {
//               if (call.startedAt && call.endedAt) {
//                 const started = new Date(call.startedAt).getTime();
//                 const ended = new Date(call.endedAt).getTime();
//                 if (!Number.isNaN(started) && !Number.isNaN(ended) && ended >= started) {
//                   return Math.round((ended - started) / 1000);
//                 }
//               }
//               const lastSeconds = call.messages?.[call.messages.length - 1]?.secondsFromStart;
//               return typeof lastSeconds === "number" && lastSeconds >= 0 ? Math.round(lastSeconds) : 0;
//             } catch {
//               return 0;
//             }
//           })();

//           const transcript = call.transcript ?? call.artifact?.transcript ?? null;
//           const recordingUrl = call.recordingUrl ?? call.artifact?.recordingUrl ?? null;
//           const messages = Array.isArray(call.messages) ? call.messages : call.artifact?.messages ?? [];
//           const summary = call.analysis?.summary ?? null;

//           if (!existing) {
//             const userNumber = await prisma.userNumber.findFirst({
//               where: { phoneNumberId: call.phoneNumberId },
//             });

//             if (!userNumber) {
//               console.warn(
//                 `No matching user number found for phoneNumberId=${call.phoneNumberId}. Skipping call ${call.id}.`
//               );
//               continue;
//             }

//             let contact = await prisma.contact.findFirst({
//               where: {
//                 phoneNumber: call.customer.number,
//                 userId: userNumber.userId,
//               },
//             });

//             if (!contact) {
//               contact = await prisma.contact.create({
//                 data: {
//                   phoneNumber: call.customer.number,
//                   name: "Unknown",
//                   userId: userNumber.userId,
//                 },
//               });
//             }

//             await prisma.conversation.create({
//               data: {
//                 callId: call.id,
//                 phoneNumber: call.customer.number,
//                 duration: durationSeconds,
//                 status: call.status || "unknown",
//                 transcript,
//                 recordingUrl,
//                 messages,
//                 contactId: contact.id,
//                 summary,
//                 phoneNumberId: call.phoneNumberId,
//               },
//             });

//             console.log(`Stored call ID: ${call.id}`);
//           } else {
//             await prisma.conversation.update({
//               where: { id: existing.id },
//               data: {
//                 duration: durationSeconds,
//                 status: call.status || existing.status,
//                 transcript,
//                 recordingUrl,
//                 messages,
//                 summary,
//                 phoneNumberId: call.phoneNumberId ?? existing.phoneNumberId,
//               },
//             });
//             console.log(`Updated call: ${call.id}`);
//           }
//         } catch (innerError) {
//           console.error(`Error processing call ${call.id}:`, innerError);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching calls:", error);
//     }
//   });
//   global.__vapiCronStarted = true;
// }
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { fetchAllCallsScheduler } from "./vapi";

const prisma = new PrismaClient();

declare global {
  var __vapiCronStarted: boolean | undefined;
}

if (!global.__vapiCronStarted) {
  cron.schedule("*/10 * * * * *", async () => {
    console.log("🕒 Running every 10 seconds...");

    try {
      const calls = await fetchAllCallsScheduler();
      // console.log(`📥 Fetched ${calls.length} calls from Vapi`);

      for (const call of calls) {
        try {
          // console.log(`\n🔹 Processing call ID: ${call.id}`);

          const existing = await prisma.conversation.findFirst({
            where: { callId: call.id },
          });
          // console.log(existing ? `✏️ Existing conversation found (ID: ${existing.id})` : "✅ No existing conversation, will create new");

          const durationSeconds = (() => {
            try {
              if (call.startedAt && call.endedAt) {
                const started = new Date(call.startedAt).getTime();
                const ended = new Date(call.endedAt).getTime();
                if (!Number.isNaN(started) && !Number.isNaN(ended) && ended >= started) {
                  return Math.round((ended - started) / 1000);
                }
              }
              const lastSeconds = call.messages?.[call.messages.length - 1]?.secondsFromStart;
              return typeof lastSeconds === "number" && lastSeconds >= 0 ? Math.round(lastSeconds) : 0;
            } catch {
              return 0;
            }
          })();
          // console.log(`⏱ Duration calculated: ${durationSeconds} seconds`);

          const transcript = call.transcript ?? call.artifact?.transcript ?? null;
          const recordingUrl = call.recordingUrl ?? call.artifact?.recordingUrl ?? null;
          const messages = Array.isArray(call.messages) ? call.messages : call.artifact?.messages ?? [];
          const summary = call.analysis?.summary ?? null;
          // console.log(`📝 Transcript length: ${transcript?.length ?? 0}`);
          // console.log(`🎙 Recording URL: ${recordingUrl}`);
          // console.log(`💬 Messages count: ${messages.length}`);
          // console.log(`🗂 Summary: ${summary ?? "None"}`);

          if (!existing) {
            const userNumber = await prisma.userNumber.findFirst({
              where: { phoneNumberId: call.phoneNumberId },
            });

            if (!userNumber) {
              // console.warn(`⚠️ No matching user number for phoneNumberId=${call.phoneNumberId}. Skipping call ${call.id}.`);
              continue;
            }
            // console.log(`👤 Found userNumber ID: ${userNumber.id}, User ID: ${userNumber.userId}`);

            let contact = await prisma.contact.findFirst({
              where: {
                phoneNumber: call.customer.number,
                userId: userNumber.userId,
              },
            });

            if (!contact) {
              contact = await prisma.contact.create({
                data: {
                  phoneNumber: call.customer.number,
                  name: "Unknown",
                  userId: userNumber.userId,
                },
              });
              // console.log(`➕ Created new contact ID: ${contact.id}`);
            } else {
              // console.log(`✏️ Existing contact ID: ${contact.id}`);
            }

            await prisma.conversation.create({
              data: {
                callId: call.id,
                phoneNumber: call.customer.number,
                duration: durationSeconds,
                status: call.status || "unknown",
                transcript,
                recordingUrl,
                messages,
                contactId: contact.id,
                summary,
                phoneNumberId: call.phoneNumberId,
              },
            });

            // console.log(`✅ Stored call ID: ${call.id}`);
          } else {
            await prisma.conversation.update({
              where: { id: existing.id },
              data: {
                duration: durationSeconds,
                status: call.status || existing.status,
                transcript,
                recordingUrl,
                messages,
                summary,
                phoneNumberId: call.phoneNumberId ?? existing.phoneNumberId,
              },
            });
            // console.log(`🔄 Updated call ID: ${call.id}`);
          }
        } catch (innerError) {
          // console.error(`❌ Error processing call ${call.id}:`, innerError);
        }
      }
    } catch (error) {
      // console.error("❌ Error fetching calls:", error);
    }
  });
  global.__vapiCronStarted = true;
  // console.log("✅ VAPI cron job started");
}
