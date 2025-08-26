import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Twilio from "twilio";

const prisma = new PrismaClient();
const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  const baseUrl = request.headers.get("origin");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const {
      phoneNumber,
      addressSid,
      label,
      purpose = "inbound",
      assistantId,
    } = await request.json();
    if (!phoneNumber)
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    if (!assistantId)
      return NextResponse.json(
        { error: "assistantId is required" },
        { status: 400 }
      );

    const assistant = await prisma.assistant.findFirst({
      where: { id: assistantId, userId: user.id },
    });
    if (!assistant)
      return NextResponse.json({ error: "Invalid assistant" }, { status: 400 });

    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber,
      addressSid,
      friendlyName: label || "Business Line",
    });
    const vapiRes = await fetch(`${baseUrl}/api/twilio/import-number`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        provider: "twilio",
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: purchased.phoneNumber,
        label: label || "Business Line",
        assistantId,
      }),
    });
    return NextResponse.json({ success: true, purchased }, { status: 201 });
  } catch (err: any) {
    console.error("Error purchasing Twilio number:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
