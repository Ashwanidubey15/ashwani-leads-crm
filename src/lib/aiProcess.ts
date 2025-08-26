import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AIPromptMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export async function aiPromptProcess(aiPromptMessage: AIPromptMessage[]) {
  try {
    const response = await openai.chat.completions.create({
      // model: "gpt-4.1-mini",
      model: "gpt-5-nano",
      messages: aiPromptMessage,
    });

    const raw = response.choices[0].message?.content ?? "{}";
    return raw;
  } catch (error) {
    console.error("Failed to parse GPT response as JSON:", error);
    throw error;
  }
}
