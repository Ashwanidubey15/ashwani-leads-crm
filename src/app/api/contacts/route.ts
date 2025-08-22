import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const contacts = await prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        conversations: {
          orderBy: { createdAt: "desc" },
        },
        schedules: {
          orderBy: { scheduleDate: "desc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return the array directly
    return NextResponse.json(contacts, { status: 200 });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
