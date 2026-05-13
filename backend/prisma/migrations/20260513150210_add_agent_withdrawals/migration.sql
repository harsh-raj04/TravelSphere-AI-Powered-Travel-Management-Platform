-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "agent_withdrawals" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'pending',
    "transactionId" TEXT NOT NULL,
    "methodSnapshot" JSONB,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_withdrawals_transactionId_key" ON "agent_withdrawals"("transactionId");

-- CreateIndex
CREATE INDEX "agent_withdrawals_agentId_idx" ON "agent_withdrawals"("agentId");

-- CreateIndex
CREATE INDEX "agent_withdrawals_agentId_status_idx" ON "agent_withdrawals"("agentId", "status");

-- CreateIndex
CREATE INDEX "agent_withdrawals_status_idx" ON "agent_withdrawals"("status");

-- AddForeignKey
ALTER TABLE "agent_withdrawals" ADD CONSTRAINT "agent_withdrawals_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_withdrawals" ADD CONSTRAINT "agent_withdrawals_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
