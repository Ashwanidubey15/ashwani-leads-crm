import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ExtractedData {
	name: string;
	email?: string;
	phoneNumber: string;
	company?: string;
	scheduleDate: string; // YYYY-MM-DD
}

function buildConversationText(input: { transcript?: string | null; messages?: unknown }): string {
	if (typeof input.transcript === "string" && input.transcript.trim().length > 0) {
		return input.transcript.trim();
	}
	if (input.messages != null) {
		try {
			return typeof input.messages === "string"
				? input.messages
				: JSON.stringify(input.messages);
		} catch {
			// fall through
		}
	}
	return "No transcript available";
}

function isValidISODate(dateStr: string): boolean {
	if (typeof dateStr !== "string") return false;
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return false;
	// Accept YYYY-MM-DD or full ISO strings
	return /^(\d{4}-\d{2}-\d{2})(T.*)?$/.test(dateStr);
}

export async function processConversation(callId: string, userId: string) {
	// 1️⃣ Fetch the conversation by callId
	const conversation = await prisma.conversation.findUnique({
		where: { callId },
	});

	if (!conversation) throw new Error("Conversation not found");

	// Build a single text block for the model
	const conversationText = buildConversationText({
		transcript: conversation.transcript ?? undefined,
		messages: conversation.messages ?? undefined,
	});

	// 2️⃣ Prepare messages for ChatGPT
	const messagesForGPT = [
		{
			role: "system" as const,
			content:
				"You are a helpful assistant that extracts structured contact and scheduling information as JSON only. Do not include Markdown.",
		},
		{
			role: "user" as const,
			content: [
				"Extract these fields from the conversation text:",
				"- name",
				"- email",
				"- phoneNumber",
				"- company (optional)",
				"- scheduleDate (YYYY-MM-DD)",
				"Return a strict JSON object only with keys: name, email, phoneNumber, company, scheduleDate.",
				"If a date isn't explicitly present, infer a reasonable date or default to today's date in YYYY-MM-DD.",
				"\nConversation:\n" + conversationText,
			].join("\n"),
		},
	];

	// 3️⃣ Call ChatGPT (request JSON response for easier parsing)
	const gptResponse = await openai.chat.completions.create({
		model: "gpt-4.1-mini",
		response_format: { type: "json_object" },
		messages: messagesForGPT,
		temperature: 0,
	});

	const messageContent = gptResponse.choices?.[0]?.message?.content ?? "";
	if (!messageContent || typeof messageContent !== "string") {
		console.error("Full GPT response:", gptResponse);
		throw new Error("ChatGPT response has no text content");
	}

	// 4️⃣ Parse GPT JSON safely
	let data: ExtractedData;
	try {
		const raw = messageContent.trim();
		data = JSON.parse(raw);
	} catch (err) {
		console.error("Failed to parse GPT JSON:", err);
		console.error("GPT response content:", messageContent);
		throw new Error("ChatGPT did not return valid JSON");
	}

	// 4.1️⃣ Basic validation and normalization
	const name = (data.name ?? "Unknown").toString().trim() || "Unknown";
	const extractedPhone = (data.phoneNumber ?? "").toString().trim();
	const conversationPhone = (conversation.phoneNumber ?? "").toString().trim();
	const phoneNumber = (extractedPhone || conversationPhone || "Unknown");
	const email = data.email ? data.email.toString().trim() : undefined;
	const company = data.company ? data.company.toString().trim() : undefined;
	let scheduleDateStr = data.scheduleDate ? data.scheduleDate.toString().trim() : "";

	if (!isValidISODate(scheduleDateStr)) {
		// Try native Date parsing first
		const parsed = new Date(scheduleDateStr);
		if (!Number.isNaN(parsed.getTime())) {
			// Use full ISO for safety
			scheduleDateStr = parsed.toISOString();
		} else {
			// Fallback to today (UTC) in YYYY-MM-DD
			const today = new Date();
			scheduleDateStr = today.toISOString().slice(0, 10);
			console.warn("scheduleDate was missing/invalid; defaulted to today in UTC YYYY-MM-DD");
		}
	}

	// 5️⃣ Find or create Contact
	let contact = phoneNumber !== "Unknown"
		? await prisma.contact.findFirst({ where: { userId, phoneNumber } })
		: null;

	if (!contact) {
		contact = await prisma.contact.create({
			data: {
				userId,
				name,
				phoneNumber,
				email: email ?? null,
				company: company ?? null,
			},
		});
	}

	// 6️⃣ Save Schedule linked to Contact
	const schedule = await prisma.schedule.create({
		data: {
			contactId: contact.id,
			scheduleDate: new Date(scheduleDateStr),
		},
	});

	// 7️⃣ Link conversation to the contact
	await prisma.conversation.update({
		where: { callId },
		data: { contactId: contact.id },
	});

	return { contact, schedule };
}
