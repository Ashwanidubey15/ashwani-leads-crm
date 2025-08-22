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
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({ where: { email: session.user.email } });
		if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

		const { phoneNumber, addressSid, label, purpose = "inbound", assistantId } = await request.json();
		if (!phoneNumber) return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
		if (!assistantId) return NextResponse.json({ error: "assistantId is required" }, { status: 400 });

		// Ensure assistant belongs to user
		const assistant = await prisma.assistant.findFirst({ where: { id: assistantId, userId: user.id } });
		if (!assistant) return NextResponse.json({ error: "Invalid assistant" }, { status: 400 });

		// Purchase number from Twilio
		const purchased = await client.incomingPhoneNumbers.create({
			phoneNumber,
			addressSid,
			friendlyName: label || "Business Line",
		});

		// Persist in our DB
		await prisma.userNumber.create({
			data: {
				userId: user.id,
				number: purchased.phoneNumber,
				label: label || "Business Line",
				purpose,
				phoneNumberId: purchased.sid,
				assistantId: assistant.id,
			},
		});

		return NextResponse.json({ success: true, purchased }, { status: 201 });
	} catch (err: any) {
		console.error("Error purchasing Twilio number:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
} 