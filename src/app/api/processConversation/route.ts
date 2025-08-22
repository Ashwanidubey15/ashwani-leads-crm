import { NextRequest, NextResponse } from "next/server";
import { processConversation } from "@/lib/processConversation";

export async function POST(req: NextRequest) {
  try {
    const { callId, userId } = await req.json();
    if (!callId || !userId) {
      return NextResponse.json({ error: "callId and userId required" }, { status: 400 });
    }

    await processConversation(callId, userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
