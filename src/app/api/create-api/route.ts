import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// POST /api/create-api
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, status, orderIndex } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        phoneNumber,
        status: status || "PENDING",
      },
    });

    return NextResponse.json({ message: "Lead created successfully", lead });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
