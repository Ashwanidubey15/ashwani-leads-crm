import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { fetchAllCallsScheduler } from "./vapi";
import { processConversation } from "./processConversation";

const prisma = new PrismaClient();

declare global {
  var __vapiCronStarted: boolean | undefined;
}

if (!global.__vapiCronStarted) {
  cron.schedule("*/10 * * * * *", async () => {
    console.log("Running every 10 seconds...");
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
              userId: userNumber.userId,
            },
          });

          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                phoneNumber: call.customer.number,
                name: "",
                userId: userNumber.userId
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
              },
            });
            console.log("👉 newConversation:", newConversation);

            // ✅ Run GPT extraction for new conversation
            await processConversation(
              call.id,
              userNumber.userId
            );
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
            // ✅ Optionally run GPT extraction on update
            await processConversation(
              call.id,
              userNumber.userId
            );
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
