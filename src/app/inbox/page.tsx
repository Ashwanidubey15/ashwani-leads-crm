import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import InboxClient, { UserNumber } from './InboxClient';

const prisma = new PrismaClient();

export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your inbox.</p>
        </div>
      </div>
    );
  }

  // Get user by email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">Please try signing in again.</p>
        </div>
      </div>
    );
  }

  // Get user's phone numbers
  const userNumbers = await prisma.userNumber.findMany({
    where: { userId: user.id },
  }) as unknown as UserNumber[];

  await prisma.$disconnect();

  return <InboxClient userNumbers={userNumbers} />;
} 