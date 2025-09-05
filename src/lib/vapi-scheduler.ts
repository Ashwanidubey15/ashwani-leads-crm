import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { fetchAllCallsScheduler } from "./vapi";
import { processConversation } from "./processConversation";
import logger from "../utility/logger.js";

const prisma = new PrismaClient();

declare global {
  var __vapiCronStarted: boolean | undefined;
}

if (!global.__vapiCronStarted) {
  cron.schedule("*/10 * * * * *", async () => {
    logger.info("Running every 10 seconds...");
    try {
      const calls = await fetchAllCallsScheduler();

      for (const call of calls) {
        try {
          const existing = await prisma.conversation.findFirst({
            where: { callId: call.id },
          });

          const durationSeconds = (() => {
            try {
              if (call.startedAt && call.endedAt) {
                const started = new Date(call.startedAt).getTime();
                const ended = new Date(call.endedAt).getTime();
                if (
                  !Number.isNaN(started) &&
                  !Number.isNaN(ended) &&
                  ended >= started
                ) {
                  return Math.round((ended - started) / 1000);
                }
              }
              const lastSeconds =
                call.messages?.[call.messages.length - 1]?.secondsFromStart;
              return typeof lastSeconds === "number" && lastSeconds >= 0
                ? Math.round(lastSeconds)
                : 0;
            } catch {
              return 0;
            }
          })();

          const transcript =
            call.transcript ?? call.artifact?.transcript ?? null;
          const recordingUrl =
            call.recordingUrl ?? call.artifact?.recordingUrl ?? null;
          const messages = Array.isArray(call.messages)
            ? call.messages
            : call.artifact?.messages ?? [];
          const summary = call.analysis?.summary ?? null;
          if (!call.phoneNumberId) continue;

          const userNumber = await prisma.userNumber.findFirst({
            where: { phoneNumberId: call.phoneNumberId },
          });
          if (!userNumber) continue;
          if (!call?.customer?.number) continue;

          let contact = await prisma.contact.findFirst({
            where: {
              phoneNumber: call.customer.number,
              assistantId: userNumber.assistantId, // must provide
              userId: userNumber.userId,
            },
          });

          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                phoneNumber: call.customer.number,
                name: "",
                userId: userNumber.userId,
                assistantId: userNumber.assistantId,
              },
            });
          }

          if (!existing) {
            const newConversation = await prisma.conversation.create({
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
                type: call.type,
              },
            });
            console.log(" newConversation added:");

            //  Run GPT extraction for new conversation
            await processConversation(
              call.id,
              userNumber.userId,
              userNumber.assistantId
            );
          } else if (existing.status !== "ended") {
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
                type: call.type,
              },
            });
            //  Optionally run GPT extraction on update
            await processConversation(
              call.id,
              userNumber.userId,
              userNumber.assistantId
            );

            if (call.status === "ended") {
              console.log("call.endedReason11111" , call.endedReason);
              
              try {
                // ---- Lead handling ----
                const lead = await prisma.lead.findUnique({
                  where: { callId: call.id },
                });

                if (!lead) {
                  console.log("Lead not found for call:", call.id);
                } else {
                  if (
                    call.endedReason === "silence-timed-out" ||
                    call.endedReason === "customer-did-not-answer" || 
                    call.endedReason === "customer-busy"
                  ) {
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + 1);

                    await prisma.lead.update({
                      where: { callId: call.id },
                      data: {
                        status: "PENDING",
                        callId: null,
                        retries: { increment: 1 },
                        nextCallAt: nextDate, // retry tomorrow
                      },
                    });
                    console.log("Lead reset to PENDING (retry possible)");
                  } else {
                    await prisma.lead.update({
                      where: { callId: call.id },
                      data: { status: "ENDED", callId: null },
                    });
                    console.log("Lead updated to ENDED");
                  }
                }

                // ---- Schedule handling ----
                const schedule = await prisma.schedule.findUnique({
                  where: { callId: call.id },
                });

                if (!schedule) {
                  console.log("Schedule not found for call:", call.id);
                } else {
                  if (
                    call.endedReason === "silence-timed-out" ||
                    call.endedReason === "customer-did-not-answer"  || 
                    call.endedReason === "customer-busy"
                  ) {
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + 1);

                    await prisma.schedule.update({
                      where: { callId: call.id },
                      data: {
                        status: "PENDING",
                        callId: null,
                        retries: { increment: 1 },
                        scheduleDate: nextDate,
                      },
                    });

                    console.log(
                      `Schedule ${schedule.id} reset to PENDING (retry tomorrow)`
                    );
                  } else {
                    await prisma.schedule.update({
                      where: { callId: call.id },
                      data: {
                        status: "ENDED",
                        callId: null,
                      },
                    });

                    console.log(
                      `Schedule ${schedule.id} marked as COMPLETED/ENDED`
                    );
                  }
                }
              } catch (err: any) {
                console.error("Error updating lead/schedule:", err);
              }
            }
          }
        } catch (innerError) {
          console.error(`Error processing call ${call.id}:`, innerError);
        }
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    }
  });

  global.__vapiCronStarted = true;
}
