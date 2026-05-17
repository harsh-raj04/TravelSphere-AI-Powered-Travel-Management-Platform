-- CreateTable
CREATE TABLE "ai_chat_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'trip-planner',
    "title" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "leadToBooking" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_chat_conversations_sessionId_key" ON "ai_chat_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "ai_chat_conversations_userId_idx" ON "ai_chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "ai_chat_conversations_sessionId_idx" ON "ai_chat_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "ai_chat_conversations_type_idx" ON "ai_chat_conversations"("type");

-- AddForeignKey
ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
