// pages/api/locations.ts
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { address } = req.body;

    // Validate
    if (!address || address.trim() === "") {
      return res.status(400).json({ message: "Address is required" });
    }

    try {
      // Check if location already exists
      const existing = await prisma.locations.findFirst({
        where: { address }, // Make sure you have a unique constraint on `address` in Prisma schema
      });

      if (existing) {
        return res.status(400).json({ message: "Location already exists" });
      }

      // Create location
      const newLocation = await prisma.locations.create({
        data: { address },
      });

      return res.status(201).json({ message: "Location created", location: newLocation });
    } catch (error) {
      console.error("Error creating location:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "GET") {
    try {
      const locations = await prisma.locations.findMany();
      return res.status(200).json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
