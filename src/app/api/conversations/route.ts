// src/app/api/conversations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("take") ?? "50"), 100);
    const skip = Number(searchParams.get("skip") ?? "0");

    const locationId = searchParams.get("locationId");

    // const conversations = await prisma.contact.findMany({
    //   where: { userId: user.id },
    //   include: {
    //     conversations: {
    //       orderBy: { createdAt: "desc" },
    //       take, // pagination per contact
    //       skip,
    //     },
    //   },
    //   orderBy: { createdAt: "desc" },
    // });
    const conversations = await prisma.contact.findMany({
      where: {
        userId: user.id,
        ...(locationId && {
          assistant: { locationId },
        }),
      },
      include: {
        conversations: {
          orderBy: { createdAt: "desc" },
          take, // pagination per contact
          skip,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch conversations" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
