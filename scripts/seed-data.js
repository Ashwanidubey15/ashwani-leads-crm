const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedData() {
  try {
    // Find the first user (or create one if none exists)
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('No users found. Please create a user first through the signup process.');
      return;
    }

    // Add some sample phone numbers
    const sampleNumbers = [
      {
        number: '+1234567890',
        label: 'Main Sales',
        purpose: 'inbound'
      },
      {
        number: '+1987654321',
        label: 'Support',
        purpose: 'both'
      },
      {
        number: '+1122334455',
        label: 'New Number',
        purpose: 'inbound'
      }
    ];

    for (const numberData of sampleNumbers) {
      await prisma.userNumber.create({
        data: {
          userId: user.id,
          ...numberData
        }
      });
    }

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData(); 