import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { customerNumber, assistantId, leadId } = await req.json();

    if (!customerNumber) {
      return Response.json(
        { error: "Missing customerNumber in request body" },
        { status: 400 }
      );
    }

    const outBoundAssistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        vapiAssistantId: true,
        phoneNumbers: {
          select: { id: true, number: true, phoneNumberId: true },
        },
      },
    });

    if (!outBoundAssistant || !outBoundAssistant.phoneNumbers.length) {
      return Response.json(
        { error: "Assistant or phone number not found" },
        { status: 404 }
      );
    }

    // call Vapi API
    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: outBoundAssistant?.vapiAssistantId,
        phoneNumberId: outBoundAssistant?.phoneNumbers[0].phoneNumberId,
        customer: { number: customerNumber },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.log("errorText", errorText);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          status: "PENDING",
          callId: null,
          retries: { increment: 1 },
          nextCallAt: nextDate, // retry tomorrow
        },
      });
      return Response.json(
        { error: `Vapi API error: ${errorText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // 4. Mark as in progress
    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          callId: data.id,
          status: "IN_PROGRESS",
        },
      });
    }

    return Response.json(data, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error while creating call:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
