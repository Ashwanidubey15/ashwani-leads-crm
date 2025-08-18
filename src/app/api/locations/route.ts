import type { NextRequest } from 'next/server';
// app/api/locations/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const locations = await prisma.locations.findMany();
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

    if (!address || address.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Address is required" },
        { status: 400 }
      );
    }

    const newLocation = await prisma.locations.create({
      data: { address },
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
