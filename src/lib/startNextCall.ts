// lib/startNextCall.ts
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
  const callSchedule = await prisma.schedule.findFirst({
    where: {
      scheduleDate: {
        lt: new Date(),
      },
    },
    orderBy: { scheduleDate: "desc" },
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
    console.log("no call schedule...");
    return;
  }

  // await fetch(`${process.env.NEXTAUTH_URL}/api/call-customer`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     customerNumber: callSchedule.contact.phoneNumber,
  //     assistantId: callSchedule.contact.assistantId,
  //   }),
  // });
}
