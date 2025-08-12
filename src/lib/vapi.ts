import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { log } from "console";
import cron from "node-cron";

const VAPI_API_URL = "https://api.vapi.ai";
// Note: Using VAPI_PRIVATE_KEY for all operations (both assistants and phone numbers)
const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
const prisma = new PrismaClient();

export interface VapiAssistant {
  id: string;
  name: string;
  firstMessage?: string;
  model: {
    provider: string;
    model: string;
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  backgroundSound?: string;
}

export interface CallRequest {
  assistantId: string;
  phoneNumber: string;
  customerName?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface CallResponse {
  id: string;
  status: string;
  assistantId: string;
  phoneNumber: string;
  createdAt: string;
}

export interface VapiCall {
  id: string;
  assistantId: string;
  phoneNumberId: string;
  type: string;
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost: number;
  customer: {
    number: string;
    sipUri: string;
  };
  status: string;
  endedReason: string;
  messages: Array<{
    role: string;
    time: number;
    message: string;
    endTime?: number;
    duration?: number;
    secondsFromStart: number;
  }>;
  stereoRecordingUrl: string;
  costBreakdown: {
    stt: number;
    llm: number;
    tts: number;
    vapi: number;
    chat: number;
    total: number;
    llmPromptTokens: number;
    llmCompletionTokens: number;
    ttsCharacters: number;
  };
  phoneCallProvider: string;
  phoneCallProviderId: string;
  phoneCallTransport: string;
  analysis: {
    summary: string;
    successEvaluation: string;
  };
  artifact: {
    recordingUrl: string;
    stereoRecordingUrl: string;
    transcript: string;
    messages: Array<{
      role: string;
      time: number;
      message: string;
      endTime?: number;
      duration?: number;
      secondsFromStart: number;
    }>;
  };
}
async function fetchAllCallsScheduler(): Promise<VapiCall[]> {
  const publicKey = process.env.VAPI_PRIVATE_KEY;

  if (!publicKey) {
    throw new Error("VAPI_PUBLIC_KEY not found in environment variables");
  }

  const response = await fetch("https://api.vapi.ai/call", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch calls: ${errorData.message || response.statusText}`
    );
  }

  const calls: VapiCall[] = await response.json();
  return calls;
}

// Schedule the job to run every 5 minutes
cron.schedule("*/10 * * * * *", async () => {
   console.log("Running every 10 seconds...");
  try {
    console.log("test-----")
    const calls = await fetchAllCallsScheduler();
    console.log("Fetched calls:", calls.length);

    for (const call of calls) {
      const existing = await prisma.conversation.findFirst({
        where: { callId: call.id },
      });
      console.log("call", call);
      if (!existing) {
        await prisma.conversation.create({
          data: {
            callId: call.id,
            phoneNumber: call.customer.number,
            duration: 0,
            status: call.status || "unknown",
            transcript: call.transcript || null,
            recordingUrl: call.recordingUrl || null,
            messages: call.messages || [],
            contactId: "cme10aqz20008cry50z7v0zhg",
            summary:call.analysis.summary,
            phoneNumberId:call.phoneNumberId
          },
        });
        console.log(`Stored call ID: ${call.id}`);
      } else {
        console.log(`Call already exists: ${call.id}`);
      }
    }

    // You can do more processing here if needed
  } catch (error) {
    console.error("Error fetching calls:", error);
  }
});

export async function fetchAllCalls(): Promise<VapiCall[]> {
  const publicKey = process.env.VAPI_PRIVATE_KEY;

  if (!publicKey) {
    throw new Error("VAPI_PUBLIC_KEY not found in environment variables");
  }

  const response = await fetch("https://api.vapi.ai/call", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch calls: ${errorData.message || response.statusText}`
    );
  }

  const calls = await response.json();
  return calls;
}

export async function initiateCall(
  callRequest: CallRequest
): Promise<CallResponse> {
  if (!VAPI_API_KEY) {
    throw new Error("VAPI API key is not configured");
  }

  console.log(
    `Initiating call to ${callRequest.phoneNumber} using assistant ${callRequest.assistantId}`
  );

  try {
    const response = await axios.post(
      `${VAPI_API_URL}/call`,
      {
        assistantId: callRequest.assistantId,
        phoneNumber: callRequest.phoneNumber,
        customer: {
          name: callRequest.customerName,
          email: callRequest.customerEmail,
        },
        metadata: callRequest.metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const callData = response.data;
    console.log(`Successfully initiated call with ID: ${callData.id}`);

    return {
      id: callData.id,
      status: callData.status,
      assistantId: callData.assistantId,
      phoneNumber: callData.phoneNumber,
      createdAt: callData.createdAt,
    };
  } catch (error: any) {
    console.error(
      `Failed to initiate call to ${callRequest.phoneNumber}:`,
      error.message
    );

    if (error.isAxiosError && error.response) {
      console.error(`Error status: ${error.response.status}`);
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
      throw new Error(
        `Vapi API error (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.isAxiosError) {
      console.error(`Network error: ${error.message}`);
      throw new Error(`Vapi network error: ${error.message}`);
    } else {
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }
}

export async function createVapiAssistant(
  assistantName: string,
  description: string,
  firstMessage: string
): Promise<string> {
  if (!VAPI_API_KEY) {
    throw new Error("VAPI API key is not configured");
  }

  console.log(`Creating new Vapi assistant: ${assistantName}`);

  try {
    const response = await axios.post(
      `${VAPI_API_URL}/assistant`,
      {
        name: assistantName,
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              content: description,
              role: "system",
            },
          ],
        },
        voice: {
          provider: "vapi",
          voiceId: "Elliot",
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en",
        },
        firstMessage: firstMessage,
        voicemailMessage: `Hello, this is ${assistantName}. I'm calling to discuss how we might help you. I'll try reaching you again, or feel free to call us back at your convenience.`,
        endCallMessage: `Thank you for taking the time to discuss your needs with me today. Our team will be in touch with more information soon. Have a great day!`,
      },
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const assistantId = response.data.id;
    console.log(`Successfully created Vapi assistant with ID: ${assistantId}`);

    return assistantId;
  } catch (error: any) {
    console.error(
      `Failed to create Vapi assistant ${assistantName}:`,
      error.message
    );

    if (error.isAxiosError && error.response) {
      console.error(`Error status: ${error.response.status}`);
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
      throw new Error(
        `Vapi API error (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.isAxiosError) {
      console.error(`Network error: ${error.message}`);
      throw new Error(`Vapi network error: ${error.message}`);
    } else {
      throw new Error(`Failed to create Vapi assistant: ${error.message}`);
    }
  }
}

export async function deleteVapiAssistant(assistantId: string): Promise<void> {
  if (!VAPI_API_KEY) {
    throw new Error("Vapi API key is not configured");
  }

  try {
    await axios.delete(`${VAPI_API_URL}/assistant/${assistantId}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    console.log(`Successfully deleted Vapi assistant: ${assistantId}`);
  } catch (error: any) {
    console.error(
      `Failed to delete Vapi assistant ${assistantId}:`,
      error.message
    );
    throw new Error(`Failed to delete Vapi assistant: ${error.message}`);
  }
}
