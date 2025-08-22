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
	return /^(\d{4}-\d{2}-\d{2})(T.*)?$/.test(dateStr);
}

export async function processConversation(callId: string, userId: string) {
	// 1️⃣ Fetch the conversation
	const conversation = await prisma.conversation.findUnique({
		where: { callId },
	});
	console.log('conversation===>', conversation?.phoneNumber);
	
	if (!conversation) throw new Error("Conversation not found");

	// 2️⃣ Build text block
	const conversationText = buildConversationText({
		transcript: conversation.transcript ?? undefined,
		messages: conversation.messages ?? undefined,
	});
	console.log('coversation text-----', conversationText);
	
	// 3️⃣ Ask ChatGPT for structured data
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

	const gptResponse = await openai.chat.completions.create({
		model: "gpt-4.1-mini",
		response_format: { type: "json_object" },
		messages: messagesForGPT,
		temperature: 0,
	});

	const messageContent = gptResponse.choices?.[0]?.message?.content ?? "";
	if (!messageContent || typeof messageContent !== "string") {
		console.error("Full GPT Error response:", gptResponse);
		throw new Error("ChatGPT response has no text content");
	}
     console.error("Full GPT response:", gptResponse);
	// 4️⃣ Parse JSON
	let data: ExtractedData;
	try {
		data = JSON.parse(messageContent.trim());
	} catch (err) {
		console.error("Failed to parse GPT JSON:", err);
		console.error("GPT response content:", messageContent);
		throw new Error("ChatGPT did not return valid JSON");
	}

	// 5️⃣ Normalize values
	const name = (data.name ?? "Unknown").toString().trim() || "Unknown";
	const extractedPhone = (data.phoneNumber ?? "").toString().trim();
	const conversationPhone = (conversation.phoneNumber ?? "").toString().trim();
	const phoneNumber = (extractedPhone || conversationPhone || "Unknown");
	const email = data.email ? data.email.toString().trim() : null;
	const company = data.company ? data.company.toString().trim() : null;

	let scheduleDateStr = data.scheduleDate ? data.scheduleDate.toString().trim() : "";
	if (!isValidISODate(scheduleDateStr)) {
		const parsed = new Date(scheduleDateStr);
		if (!Number.isNaN(parsed.getTime())) {
			scheduleDateStr = parsed.toISOString().slice(0, 10);
		} else {
			scheduleDateStr = new Date().toISOString().slice(0, 10);
		}
	}

	// 6️⃣ Find or create the Contact associated with this conversation
	let contact = null as Awaited<ReturnType<typeof prisma.contact.create>> | null;

	if (conversation.contactId) {
		// Update existing linked contact with any newly extracted info
		const existing = await prisma.contact.findUnique({ where: { id: conversation.contactId } });
		if (existing) {
			const updateData: Record<string, any> = {};
			if (name && name !== "Unknown" && name !== existing.name) updateData.name = name;
			if (phoneNumber && phoneNumber !== existing.phoneNumber) updateData.phoneNumber = phoneNumber;
			if (email && email !== existing.email) updateData.email = email;
			if (company && company !== existing.company) updateData.company = company;

			contact = Object.keys(updateData).length
				? await prisma.contact.update({ where: { id: existing.id }, data: updateData })
				: existing;
		} else {
			// Fallback: linked id missing in DB, try to find by userId + phoneNumber or create
			const found = await prisma.contact.findFirst({ where: { userId, phoneNumber } });
			contact = found
				? found
				: await prisma.contact.create({
					data: { userId, name, phoneNumber, email, company },
				});
		}
	} else {
		// No linked contact; try to find by userId + phoneNumber, else create
		const found = await prisma.contact.findFirst({ where: { userId, phoneNumber } });
		contact = found
			? await prisma.contact.update({
				where: { id: found.id },
				data: {
					name: name !== "Unknown" ? name : found.name,
					email: email ?? found.email,
					company: company ?? found.company,
					phoneNumber: phoneNumber || found.phoneNumber,
				},
			})
			: await prisma.contact.create({
				data: { userId, name, phoneNumber, email, company },
			});
	}

	// 7️⃣ Ensure a Schedule exists (dedupe by same date for this contact)
	const scheduleDate = new Date(`${scheduleDateStr}T00:00:00.000Z`);
	const existingSchedule = await prisma.schedule.findFirst({
		where: {
			contactId: contact.id,
			// Compare by date only
			scheduleDate: {
				gte: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()),
				lt: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 1),
			},
		},
	});

	const schedule = existingSchedule
		? existingSchedule
		: await prisma.schedule.create({
			data: { contactId: contact.id, scheduleDate },
		});

	// 8️⃣ Link conversation → contact if not already linked
	if (!conversation.contactId || conversation.contactId !== contact.id) {
		await prisma.conversation.update({
			where: { callId },
			data: { contactId: contact.id },
		});
	}

	return { contact, schedule };
}
