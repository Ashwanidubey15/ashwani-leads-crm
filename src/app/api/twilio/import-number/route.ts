import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Twilio from "twilio";

const prisma = new PrismaClient();
const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting POST /import-number");

    // 🔹 Auth check
    const session = await getServerSession(authOptions);
    console.log("🧑 Session:", session);
    if (!session?.user?.email) {
      console.warn("Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔹 Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    console.log("👤 User found:", user);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🔹
    //
    //
    //  Parse request body

    const {
      phoneNumber,
      twilioSid: requestTwilioSid,
      label,
      purpose = "inbound",
      assistantId,
    } = await request.json();

    // Use SID from request if present, otherwise fallback to env
    const twilioSid = requestTwilioSid || process.env.TWILIO_ACCOUNT_SID;
    console.log("📩 Request body:", {
      phoneNumber,
      twilioSid,
      label,
      purpose,
      assistantId,
    });

    if (!phoneNumber || typeof phoneNumber !== "string") {
      console.warn("Invalid phoneNumber");
      return NextResponse.json(
        { error: "Valid phoneNumber is required" },
        { status: 400 }
      );
    }
    if (!assistantId) {
      console.warn("assistantId missing");
      return NextResponse.json(
        { error: "assistantId is required" },
        { status: 400 }
      );
    }

    // 🔹 Verify assistant
    const assistant = await prisma.assistant.findFirst({
      where: { id: assistantId, userId: user.id },
    });
    console.log("🛠 Assistant:", assistant);
    if (!assistant?.vapiAssistantId) {
      console.warn("Assistant not configured with Vapi");
      return NextResponse.json(
        { error: "Assistant not found or not configured with Vapi" },
        { status: 400 }
      );
    }

    // 🔹 Validate Twilio number
    let incomingNumber;
    if (requestTwilioSid) {
      console.log("Fetching Twilio number by Phone SID:", requestTwilioSid);
      incomingNumber = await twilioClient
        .incomingPhoneNumbers(requestTwilioSid)
        .fetch();
    } else {
      console.log("Searching Twilio account by phone number:", phoneNumber);
      const list = await twilioClient.incomingPhoneNumbers.list({
        phoneNumber,
        limit: 1,
      });
      incomingNumber = list[0];
    }

    // 🔹 Import into Vapi
    const vapiKey = process.env.VAPI_PRIVATE_KEY;
    if (!vapiKey) {
      console.error("VAPI_PRIVATE_KEY not configured");
      return NextResponse.json(
        { error: "VAPI_PRIVATE_KEY is not configured" },
        { status: 500 }
      );
    }

    console.log("📞 Importing into Vapi:", {
      number: incomingNumber.phoneNumber,
      twilioAccountSid: incomingNumber.accountSid, // Use the SID returned by Twilio
      assistantId: assistant.vapiAssistantId,
      label,
    });

    const importRes = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vapiKey}`,
      },
      body: JSON.stringify({
        provider: "twilio",
        number: incomingNumber.phoneNumber, // E.164 format
        twilioAccountSid: incomingNumber.accountSid, // SID from Twilio
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN, // Auth token from env
        name: label || "Business Line",
        assistantId: assistant.vapiAssistantId,
      }),
    });

    if (!importRes.ok) {
      const details = await importRes.json().catch(() => ({}));
      console.error("❌ Vapi import failed:", details);
      return NextResponse.json(
        { error: "Failed to import number into Vapi", details },
        { status: importRes.status }
      );
    }
    console.log("Sending to Vapi:", {
      provider: "twilio",
      twilioAccountSid: incomingNumber.accountSid,
      number: incomingNumber.phoneNumber,
      name: label || "Business Line",
      assistantId: assistant.vapiAssistantId,
    });

    const vapiNumber = await importRes.json();
    console.log("✅ Vapi number created:", vapiNumber);

    const vapiPhoneNumberId = vapiNumber?.id;
    if (!vapiPhoneNumberId) {
      console.error("Vapi did not return phone number id");
      return NextResponse.json(
        { error: "Vapi did not return a phone number id" },
        { status: 502 }
      );
    }

    // 🔹 Save into DB
    console.log("💾 Saving number to database...");
    let saved = await prisma.userNumber.findFirst({
      where: { userId: user.id, number: phoneNumber },
    });
    console.log("Existing DB record:", saved);

    if (saved) {
      saved = await prisma.userNumber.update({
        where: { id: saved.id },
        data: {
          label: label || "Business Line",
          purpose,
          assistantId: assistant.id,
          phoneNumberId: vapiPhoneNumberId,
        },
      });
      console.log("✅ Updated DB record:", saved);
    } else {
      saved = await prisma.userNumber.create({
        data: {
          userId: user.id,
          number: phoneNumber,
          label: label || "Business Line",
          purpose,
          assistantId: assistant.id,
          phoneNumberId: vapiPhoneNumberId,
        },
      });
      console.log("✅ Created DB record:", saved);
    }

    console.log("🎉 Import process completed successfully");
    return NextResponse.json(
      { success: true, number: saved, vapi: vapiNumber },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("🔥 Error importing Twilio number:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
