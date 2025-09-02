import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

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

    const locations = await prisma.locations.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: locations });
  } catch (error) {
    console.error(" Error fetching locations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body;
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

    if (!address || address.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Address is required" },
        { status: 400 }
      );
    }

    const newLocation = await prisma.locations.create({
      data: { address, userId: user.id },
    });

    return NextResponse.json({ success: true, data: newLocation });
  } catch (error) {
    console.error(" Error creating location:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create location" },
      { status: 500 }
    );
  }
}
