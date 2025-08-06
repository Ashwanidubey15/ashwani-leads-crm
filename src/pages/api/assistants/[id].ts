import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { deleteVapiAssistant } from "../../../lib/vapi";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Assistant ID is required" });
  }

  if (req.method === "DELETE") {
    try {
      // Verify the assistant belongs to the current user
      const assistant = await prisma.assistant.findFirst({
        where: { 
          id: id,
          userId: user.id 
        }
      });

      if (!assistant) {
        return res.status(404).json({ message: "Assistant not found" });
      }

      // Delete from Vapi first
      if (assistant.vapiAssistantId) {
        try {
          await deleteVapiAssistant(assistant.vapiAssistantId);
        } catch (error) {
          console.warn("Error deleting from Vapi:", error);
        }
      }

      // Delete from our database
      await prisma.assistant.delete({
        where: { id: id }
      });
      
      return res.status(200).json({ message: "Assistant deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting assistant:", error);
      return res.status(500).json({ 
        message: "Failed to delete assistant",
        error: error.message 
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
} 