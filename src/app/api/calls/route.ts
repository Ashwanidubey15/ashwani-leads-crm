import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { initiateCall, CallRequest, fetchAllCalls, VapiCall } from '@/lib/vapi';

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
    const userPhoneNumberIds = userNumbers.map(un => un.id);
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
    console.error('Error fetching calls:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calls',
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { contactId, assistantId } = body;

    if (!contactId || !assistantId) {
      return NextResponse.json({ error: 'Contact ID and Assistant ID are required' }, { status: 400 });
    }

    // Get contact details
    const contact = await prisma.contact.findFirst({
      where: { 
        id: contactId,
        userId: user.id 
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Get assistant details
    const assistant = await prisma.assistant.findFirst({
      where: { 
        id: assistantId,
        userId: user.id 
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (!assistant.vapiAssistantId) {
      return NextResponse.json({ error: 'Assistant not configured with VAPI' }, { status: 400 });
    }

    // Prepare call request
    const callRequest: CallRequest = {
      assistantId: assistant.vapiAssistantId,
      phoneNumber: contact.phoneNumber,
      customerName: contact.name,
      customerEmail: contact.email || undefined,
      metadata: {
        contactId: contact.id,
        assistantId: assistant.id,
        userId: user.id,
      },
    };

    // Initiate the call
    const callResponse = await initiateCall(callRequest);

    // Create a new conversation record
    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        phoneNumber: contact.phoneNumber,
        duration: 0,
        status: 'in-progress',
        transcript: null,
        recordingUrl: null,
        messages: [], // initialize with empty array or appropriate value
      },
    });

    return NextResponse.json({
      success: true,
      call: callResponse,
      conversation: conversation,
    });

  } catch (error: any) {
    console.error('Error initiating call:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate call',
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 