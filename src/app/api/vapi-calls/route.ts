import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { fetchAllCalls, VapiCall } from '@/lib/vapi';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's phone numbers
    const userNumbers = await prisma.userNumber.findMany({
      where: { userId: user.id },
    });

    if (userNumbers.length === 0) {
      return NextResponse.json({ calls: [] });
    }

    // Fetch all calls from VAPI.ai
    const allCalls = await fetchAllCalls();

    // Filter calls to only include those made to/from user's phone numbers
    const userPhoneNumberIds = userNumbers.map(un => un.phoneNumberId);
    console.log("userPhoneNumberIds",userPhoneNumberIds)
    const filteredCalls = allCalls.filter(call => 
      userPhoneNumberIds.includes(call.phoneNumberId)
    );

    // Enrich calls with contact information if available
    const enrichedCalls = await Promise.all(
      filteredCalls.map(async (call) => {
        // Try to find contact by phone number
        const contact = await prisma.contact.findFirst({
          where: { 
            phoneNumber: call.customer.number,
            userId: user.id 
          },
        });

        return {
          ...call,
          contact: contact ? {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            company: contact.company,
          } : null,
        };
      })
    );

    return NextResponse.json({
      calls: enrichedCalls,
      totalCalls: enrichedCalls.length,
      userPhoneNumberIds: userPhoneNumberIds,
    });

  } catch (error: any) {
    console.error('Error fetching VAPI calls:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch VAPI calls',
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 