// lib/startNextCall.ts
import logger from "@/utility/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function startNextCall() {
  // 1. Check if any call is already in progress
  const inProgress = await prisma.lead.findFirst({
    where: { status: "IN_PROGRESS" },
  });

  if (inProgress) {
    console.log("A call is already in progress. Skipping...");
    return;
  }
  const nextLead = await prisma.lead.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { nextCallAt: null }, // never delayed before
        { nextCallAt: { lte: new Date() } }, // eligible again
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!nextLead) {
    console.log("No pending leads found.");
    return;
  }

  console.log(
    process.env.NEXTAUTH_URL,
    "Starting call for:",
    nextLead.phoneNumber
  );

  await fetch(`${process.env.NEXTAUTH_URL}/api/call-customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerNumber: nextLead.phoneNumber,
      assistantId: nextLead?.assistantId,
      leadId: nextLead.id,
    }),
  });
}

export async function startScheduleCall() {
  // Find the first pending or failed schedule whose date is today or past

  const inProgress = await prisma.schedule.findFirst({
    where: { status: "IN_PROGRESS" },
  });

  if (inProgress) {
    logger.info("Call in progress");
    console.log("A call is already in progress. Skipping...");
    return;
  }

  const callSchedule = await prisma.schedule.findFirst({
    where: {
      scheduleDate: { lte: new Date() },
      status: "PENDING",
    },
    orderBy: { scheduleDate: "asc" },
    include: {
      contact: {
        select: {
          id: true,
          assistantId: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!callSchedule) {
    console.log("No pending call schedule for today.");
    return;
  }

  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/call-customer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerNumber: callSchedule.contact.phoneNumber,
          assistantId: callSchedule.contact.assistantId,
        }),
      }
    );

    if (response.ok) {
      // Update status as completed
      console.log("Updating schedule status to COMPLETED...");
      const data = await response.json();
      await prisma.schedule.update({
        where: { id: callSchedule.id },
        data: { callId: data.id, status: "IN_PROGRESS" },
      });
    } else {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      console.log("Next schedule date:", nextDate);

      // Reschedule for next day and mark as FAILED
      console.log("Updating schedule status to FAILED and rescheduling...");
      await prisma.schedule.update({
        where: { id: callSchedule.id },
        data: { scheduleDate: nextDate, status: "PENDING", callId: null },
      });
    }
  } catch (err) {
    console.error("Error while calling customer:", err);
  }
}
