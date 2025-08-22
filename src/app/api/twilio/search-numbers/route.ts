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

		const { searchParams } = new URL(request.url);
		const country = (searchParams.get("country") || "AU").toUpperCase();
		const type = searchParams.get("type") || "local"; // local | mobile | tollfree
		const areaCodeStr = searchParams.get("areaCode");
		const areaCode = areaCodeStr ? parseInt(areaCodeStr, 10) : undefined;
		const contains = searchParams.get("contains") || undefined;
		const limitParam = Number(searchParams.get("limit") || 20);
		const limit = Math.max(1, Math.min(50, limitParam));

		let results: any[] = [];
		if (type === "tollfree") {
			results = await client.availablePhoneNumbers(country).tollFree.list({ contains, limit });
		} else if (type === "mobile") {
			results = await client.availablePhoneNumbers(country).mobile.list({ contains, limit });
		} else {
			const params: any = { limit };
			if (!Number.isNaN(areaCode as any) && typeof areaCode === "number") params.areaCode = areaCode;
			if (contains) params.contains = contains;
			results = await client.availablePhoneNumbers(country).local.list(params);
		}

		return NextResponse.json(results, { status: 200 });
	} catch (err: any) {
		console.error("Error searching Twilio numbers:", err);
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
} 