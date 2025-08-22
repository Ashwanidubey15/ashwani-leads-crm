import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Twilio from "twilio";

const client = Twilio(
	process.env.TWILIO_ACCOUNT_SID!,
	process.env.TWILIO_AUTH_TOKEN!
);

export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const addresses = await client.addresses.list({ limit: 50 });
		return NextResponse.json(addresses, { status: 200 });
	} catch (err: any) {
		console.error("Error listing Twilio addresses:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			country,
			customerName,
			friendlyName,
			addressLine1,
			addressLine2,
			city,
			state,
			zipCode,
		} = body || {};

		if (!country || !customerName || !friendlyName || !addressLine1 || !city || !state || !zipCode) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const created = await client.addresses.create({
			customerName,
			friendlyName,
			isoCountry: country,
			street: addressLine1,
			streetSecondary: addressLine2,
			city,
			region: state,
			postalCode: zipCode,
		});

		return NextResponse.json(created, { status: 201 });
	} catch (err: any) {
		console.error("Error creating Twilio address:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
} 