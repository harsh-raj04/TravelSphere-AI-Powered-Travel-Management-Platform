-- CreateTable
CREATE TABLE "custom_package_messages" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_package_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_package_messages_requestId_idx" ON "custom_package_messages"("requestId");

-- AddForeignKey
ALTER TABLE "custom_package_messages" ADD CONSTRAINT "custom_package_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "custom_package_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
