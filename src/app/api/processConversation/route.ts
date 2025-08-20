import { NextRequest, NextResponse } from "next/server";
import { processConversation } from "@/lib/chatgptContactHandler";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, userId } = body;

    if (!callId || !userId) {
      return NextResponse.json({ error: "callId and userId are required" }, { status: 400 });
    }

    const result = await processConversation(callId, userId);
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
