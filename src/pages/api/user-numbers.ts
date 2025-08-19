import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

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

  if (req.method === "GET") {
    try {
      // Check if UserNumber model exists
      if (!prisma.userNumber) {
        console.error("UserNumber model not found in Prisma client");
        return res.status(500).json({ message: "Database model not available" });
      }

      const { locationId } = req.query;

      const userNumbers = await prisma.userNumber.findMany({
        where: { 
          userId: user.id,
          ...(locationId ? { assistant: { locationId: String(locationId) } } : {}),
        },
        include: {
          assistant: {
            select: {
              id: true,
              name: true,
              description: true,
              locationId: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return res.status(200).json(userNumbers);
    } catch (error) {
      console.error("Error fetching user numbers:", error);
      return res.status(500).json({ message: "Failed to fetch user numbers" });
    }
  }

  if (req.method === "POST") {
    const { number, label, purpose, areaCode, assistantId } = req.body;
    
    if (!areaCode) {
      return res.status(400).json({ message: "Area code is required" });
    }

    if (!assistantId) {
      return res.status(400).json({ message: "Assistant ID is required" });
    }

    try {
      // Verify the assistant belongs to the current user and get its Vapi ID
      const assistant = await prisma.assistant.findFirst({
        where: { 
          id: assistantId, 
          userId: user.id 
        }
      });

      if (!assistant) {
        return res.status(400).json({ message: "Invalid assistant" });
      }

      if (!assistant.vapiAssistantId) {
        return res.status(400).json({ message: "Assistant is not properly configured in Vapi" });
      }

      // Use only private key for purchasing numbers (as per Vapi docs)
      const privateKey = process.env.VAPI_PRIVATE_KEY;
      
      if (!privateKey) {
        return res.status(500).json({ 
          message: "Vapi private key not configured. Cannot purchase numbers." 
        });
      }

      console.log(`Attempting to purchase number with area code: ${areaCode} and assistant ID: ${assistant.vapiAssistantId}`);
      const vapiRes = await fetch("https://api.vapi.ai/phone-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${privateKey}`,
        },
        body: JSON.stringify({
          provider: "vapi",
          numberDesiredAreaCode: areaCode,
          name: label || "Business Line",
          assistantId: assistant.vapiAssistantId
        }),
      });
      
      if (vapiRes.ok) {
        const responseData = await vapiRes.json();

        console.log("responseData", responseData)
        
        // Save the phone number to our database
        const userNumber = await prisma.userNumber.create({
          data: {
            userId: user.id,
            number: responseData.number,
            label: label || "Business Line",
            purpose: purpose || "inbound",
            assistantId: assistant.id,
            phoneNumberId: responseData.id
          },
        });
        
        return res.status(200).json(userNumber);
      } else {
        const errorData = await vapiRes.json();
        
        // Check if Vapi suggests alternative area codes
        if (errorData.suggestedAreaCodes) {
          return res.status(400).json({ 
            message: "No numbers available in this area code. Try one of these:",
            suggestedAreaCodes: errorData.suggestedAreaCodes 
          });
        }
        
        return res.status(400).json({ 
          message: errorData.message || "Failed to purchase number" 
        });
      }
    } catch (error: any) {
      console.error("Error purchasing number:", error);
      return res.status(500).json({ 
        message: "Failed to purchase number",
        error: error.message 
      });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Number ID is required" });
    }

    try {
      // Verify the number belongs to the current user
      const userNumber = await prisma.userNumber.findFirst({
        where: { 
          id: id,
          userId: user.id 
        }
      });

      if (!userNumber) {
        return res.status(404).json({ message: "Number not found" });
      }

      // Delete from Vapi first
      const privateKey = process.env.VAPI_PRIVATE_KEY;
      
      if (privateKey) {
        try {
          const vapiRes = await fetch(`https://api.vapi.ai/phone-number/${userNumber.number}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${privateKey}`,
            },
          });
          
          if (!vapiRes.ok) {
            console.warn(`Failed to delete number from Vapi: ${vapiRes.status}`);
          }
        } catch (error) {
          console.warn("Error deleting from Vapi:", error);
        }
      }

      // Delete from our database
      await prisma.userNumber.delete({
        where: { id: id }
      });
      
      return res.status(200).json({ message: "Number deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting number:", error);
      return res.status(500).json({ 
        message: "Failed to delete number",
        error: error.message 
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}