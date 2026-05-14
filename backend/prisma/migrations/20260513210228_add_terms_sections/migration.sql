-- CreateTable
CREATE TABLE "terms_sections" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_sections_order_idx" ON "terms_sections"("order");
