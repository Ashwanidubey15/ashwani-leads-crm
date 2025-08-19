import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { createVapiAssistant } from "../../../lib/vapi";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  if (req.method === "GET") {
    try {
      const { locationId } = req.query;
      const assistants = await prisma.assistant.findMany({
        where: {
          userId: user.id,
          ...(locationId ? { locationId: String(locationId) } : {}), // only apply if passed
        },
        include: {
          phoneNumbers: {
            select: {
              id: true,
              number: true,
              label: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Transform the data to match the frontend interface
      const transformedAssistants = assistants.map((assistant) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        firstMessage: assistant.firstMessage,
        phoneNumbers: assistant.phoneNumbers,
        locationId: assistant.locationId,
        createdAt: assistant.createdAt.toISOString(),
        updatedAt: assistant.updatedAt.toISOString(),
      }));

      return res.status(200).json(transformedAssistants);
    } catch (error) {
      console.error("Error fetching assistants:", error);
      return res.status(500).json({ message: "Failed to fetch assistants" });
    }
  }

  if (req.method === "POST") {
    const { name, description, firstMessage, locationId } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    try {
      // Create Vapi assistant first
      const vapiAssistantId = await createVapiAssistant(
        name,
        description,
        firstMessage || "Hello! How can I help you today?"
      );

      // Save to our database
      const assistant = await prisma.assistant.create({
        data: {
          userId: user.id,
          name,
          description,
          firstMessage: firstMessage || "Hello! How can I help you today?",
          vapiAssistantId,
          locationId,
        },
      });

      return res.status(201).json(assistant);
    } catch (error: any) {
      console.error("Error creating assistant:", error);
      return res.status(500).json({
        message: "Failed to create assistant",
        error: error.message,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
