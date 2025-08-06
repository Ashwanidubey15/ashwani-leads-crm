-- CreateTable
CREATE TABLE "UserNumber" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNumber_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserNumber" ADD CONSTRAINT "UserNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
