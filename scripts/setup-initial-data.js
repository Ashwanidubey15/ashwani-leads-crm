const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupInitialData() {
  try {
    console.log('Setting up initial data...');

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      },
    });

    console.log('Created test user:', user.email);

    // Create a test assistant
    const assistant = await prisma.assistant.create({
      data: {
        name: 'Sales Assistant',
        description: 'A helpful AI assistant for handling sales inquiries and customer support.',
        firstMessage: 'Hello! I\'m your sales assistant. How can I help you today?',
        userId: user.id,
        vapiAssistantId: 'test-assistant-id',
      },
    });

    console.log('Created test assistant:', assistant.name);

    // Create sample contacts
    const contacts = await Promise.all([
      prisma.contact.create({
        data: {
          name: 'John Smith',
          phoneNumber: '+1234567890',
          email: 'john.smith@example.com',
          company: 'ABC Corp',
          userId: user.id,
        },
      }),
      prisma.contact.create({
        data: {
          name: 'Sarah Johnson',
          phoneNumber: '+1987654321',
          email: 'sarah.johnson@example.com',
          company: 'XYZ Inc',
          userId: user.id,
        },
      }),
      prisma.contact.create({
        data: {
          name: 'Mike Wilson',
          phoneNumber: '+1555123456',
          email: 'mike.wilson@example.com',
          company: 'Tech Solutions',
          userId: user.id,
        },
      }),
    ]);

    console.log('Created sample contacts:', contacts.length);

    // Create sample conversations for each contact
    const conversations = await Promise.all([
      // John Smith conversations
      prisma.conversation.create({
        data: {
          contactId: contacts[0].id,
          phoneNumber: '+1234567890',
          duration: 180,
          status: 'completed',
          transcript: 'Assistant: Hello! I\'m your sales assistant. How can I help you today?\nJohn: Hi, I\'m interested in your product.\nAssistant: Great! I\'d be happy to tell you more about our product. What specific features are you looking for?\nJohn: I need something that can handle customer support.\nAssistant: Perfect! Our solution includes 24/7 customer support with AI-powered responses. Would you like me to schedule a demo?\nJohn: Yes, that would be great.\nAssistant: Excellent! I\'ll have our team contact you within the next hour to set up a demo.',
          recordingUrl: 'https://example.com/recording1.mp3',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      }),
      prisma.conversation.create({
        data: {
          contactId: contacts[0].id,
          phoneNumber: '+1234567890',
          duration: 120,
          status: 'completed',
          transcript: 'Assistant: Hello! I\'m your sales assistant. How can I help you today?\nJohn: Hi, I have a question about pricing.\nAssistant: Of course! Our pricing is very competitive. We offer different tiers based on your needs. What size company are you?\nJohn: We\'re a small business, about 10 employees.\nAssistant: Perfect! For small businesses, we recommend our Starter plan at $99/month. It includes all the features you need.\nJohn: That sounds reasonable. Can I get a trial?\nAssistant: Absolutely! I can set you up with a 14-day free trial right now.',
          recordingUrl: 'https://example.com/recording2.mp3',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      }),
      // Sarah Johnson conversations
      prisma.conversation.create({
        data: {
          contactId: contacts[1].id,
          phoneNumber: '+1987654321',
          duration: 95,
          status: 'completed',
          transcript: 'Assistant: Hello! I\'m your sales assistant. How can I help you today?\nSarah: Hi, I\'m calling about your service.\nAssistant: Hello Sarah! I\'d be happy to help. What specific service are you interested in?\nSarah: I saw your ad about customer support automation.\nAssistant: Great! Our AI-powered customer support can handle 80% of inquiries automatically. What industry are you in?\nSarah: We\'re in e-commerce.\nAssistant: Perfect! E-commerce is one of our specialties. Our system integrates with all major platforms.',
          recordingUrl: 'https://example.com/recording3.mp3',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      }),
      // Mike Wilson conversations
      prisma.conversation.create({
        data: {
          contactId: contacts[2].id,
          phoneNumber: '+1555123456',
          duration: 0,
          status: 'missed',
          transcript: null,
          recordingUrl: null,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      }),
    ]);

    console.log('Created sample conversations:', conversations.length);

    console.log('Initial data setup complete!');
    console.log('You can now log in with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error setting up initial data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupInitialData(); 