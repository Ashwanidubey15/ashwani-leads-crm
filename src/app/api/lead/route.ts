import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parsePhoneNumberFromString } from "libphonenumber-js";
const prisma = new PrismaClient();

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
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

    // get uploaded file (App Router supports formData)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const assistantId = formData.get("assistantId") as string;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // read CSV
    const bytes = await file.arrayBuffer();
    const fileContent = Buffer.from(bytes).toString("utf8");

    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    const { data, errors, meta } = parsed;

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Error parsing CSV", details: errors },
        { status: 400 }
      );
    }

    // header validation (case-insensitive)
    const fields = (meta.fields ?? []).map((f) => f.trim().toLowerCase());
    if (!fields.includes("name") || !fields.includes("contactnumber")) {
      return NextResponse.json(
        { error: 'CSV must contain headers "name" and "contactNumber"' },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const invalidRows: Array<{ row: number; reason: string }> = [];
    const seenInUpload = new Set<string>(); // prevent dupes within the same file

    for (const [index, raw] of (data as any[]).entries()) {
      // normalize row keys (case-insensitive)
      const row = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [
          k.toString().trim().toLowerCase(),
          v,
        ])
      );

      const rawName = (row["name"] ?? "").toString().trim();
      let rawPhone = (row["contactnumber"] ?? "").toString().trim();

      if (!rawPhone.startsWith("+")) {
        rawPhone = "+" + rawPhone;
      }

      // --- NAME VALIDATION ---
      if (!rawName) {
        invalidRows.push({ row: index + 2, reason: "Name is required" });
        continue;
      }
      if (rawName.length < 2 || /[^a-zA-Z\s'.-]/.test(rawName)) {
        invalidRows.push({ row: index + 2, reason: "Invalid name" });
        continue;
      }

      // --- PHONE VALIDATION ---
      if (!rawPhone) {
        invalidRows.push({
          row: index + 2,
          reason: "Phone number is required",
        });
        continue;
      }
      if (!rawPhone.startsWith("+")) {
        invalidRows.push({
          row: index + 2,
          reason: "Phone number must include country code (e.g. +14155552671)",
        });
        continue;
      }
      if (!/^\+\d{7,15}$/.test(rawPhone)) {
        invalidRows.push({
          row: index + 2,
          reason: "Phone number must contain only digits after + (7–15 digits)",
        });
        continue;
      }
      const phoneNumber = parsePhoneNumberFromString(rawPhone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        invalidRows.push({ row: index + 2, reason: "Invalid phone number" });
        continue;
      }
      const formattedPhone = phoneNumber.number; // E.164

      // prevent duplicates in the same upload batch
      if (seenInUpload.has(formattedPhone)) {
        invalidRows.push({
          row: index + 2,
          reason: "Duplicate phone number in file",
        });
        continue;
      }

      try {
        // uniqueness per user
        const existing = await prisma.lead.findFirst({
          where: { phoneNumber: formattedPhone, userId: user.id },
          select: { id: true },
        });
        if (existing) {
          invalidRows.push({
            row: index + 2,
            reason: "Duplicate phone number (already exists)",
          });
          continue;
        }

        await prisma.lead.create({
          data: {
            name: rawName,
            phoneNumber: formattedPhone,
            assistantId,
            userId: user.id,
          },
        });

        seenInUpload.add(formattedPhone);
        insertedCount++;
      } catch (e: any) {
        invalidRows.push({ row: index + 2, reason: e?.message || "DB error" });
      }
    }

    return NextResponse.json({
      message: "Leads processed",
      inserted: insertedCount,
      invalid: invalidRows.length,
      errors: invalidRows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
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

    const leads = await prisma.lead.findMany({
      where: { userId: user.id }, // ✅ only fetch user’s leads
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
