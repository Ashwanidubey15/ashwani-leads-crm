import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }
  // Hash password
  const hashed = await hash(password, 10);
  // Create user
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
    },
  });
  return res.status(201).json({ message: "User created" });
} 