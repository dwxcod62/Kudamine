/*
  Warnings:

  - A unique constraint covering the columns `[userId,securityId]` on the table `PriceAlert` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_userId_securityId_key" ON "public"."PriceAlert"("userId", "securityId");
