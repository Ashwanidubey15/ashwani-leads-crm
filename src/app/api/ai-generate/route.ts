import { NextResponse } from "next/server";
import { aiPromptProcess } from "@/lib/aiProcess";

export async function POST(req: Request) {
  try {
    const { aiPromptMessage } = await req.json();

    if (!aiPromptMessage || !Array.isArray(aiPromptMessage)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const generatedPrompt = await aiPromptProcess(aiPromptMessage);
    return NextResponse.json(generatedPrompt);
  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 