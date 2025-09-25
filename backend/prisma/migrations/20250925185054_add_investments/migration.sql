-- CreateEnum
CREATE TYPE "public"."AssetClass" AS ENUM ('Equity', 'Crypto', 'ETF', 'Forex', 'Other');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'VND', 'EUR', 'JPY', 'GBP', 'Other');

-- CreateTable
CREATE TABLE "public"."Security" (
    "id" TEXT NOT NULL,
    "symbol" VARCHAR(32) NOT NULL,
    "name" TEXT,
    "assetClass" "public"."AssetClass" NOT NULL DEFAULT 'Equity',
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "exchange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "qty" DECIMAL(18,6) NOT NULL,
    "avgBuyPrice" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WatchItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "targetUp" DECIMAL(18,6),
    "targetDown" DECIMAL(18,6),
    "bandPct" DECIMAL(8,6) NOT NULL DEFAULT 0.001,
    "cooldownMs" INTEGER NOT NULL DEFAULT 15000,
    "notifyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "side" TEXT NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "message" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PriceSnapshot" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "source" TEXT,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Security_symbol_idx" ON "public"."Security"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Security_symbol_assetClass_key" ON "public"."Security"("symbol", "assetClass");

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "public"."Position"("userId");

-- CreateIndex
CREATE INDEX "Position_securityId_idx" ON "public"."Position"("securityId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_securityId_key" ON "public"."Position"("userId", "securityId");

-- CreateIndex
CREATE INDEX "WatchItem_userId_idx" ON "public"."WatchItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchItem_userId_securityId_key" ON "public"."WatchItem"("userId", "securityId");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_idx" ON "public"."PriceAlert"("userId");

-- CreateIndex
CREATE INDEX "PriceAlert_securityId_idx" ON "public"."PriceAlert"("securityId");

-- CreateIndex
CREATE INDEX "NotificationLog_alertId_firedAt_idx" ON "public"."NotificationLog"("alertId", "firedAt");

-- CreateIndex
CREATE INDEX "PriceSnapshot_securityId_ts_idx" ON "public"."PriceSnapshot"("securityId", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "PriceSnapshot_securityId_ts_key" ON "public"."PriceSnapshot"("securityId", "ts");

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WatchItem" ADD CONSTRAINT "WatchItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WatchItem" ADD CONSTRAINT "WatchItem_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceAlert" ADD CONSTRAINT "PriceAlert_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationLog" ADD CONSTRAINT "NotificationLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."PriceAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "public"."Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;
