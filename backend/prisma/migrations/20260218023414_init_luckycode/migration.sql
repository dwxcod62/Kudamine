-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "public"."SpendingStatus" AS ENUM ('Done', 'Process', 'Skip');

-- CreateEnum
CREATE TYPE "public"."MuscleDetailed" AS ENUM ('UpperChest', 'MiddleChest', 'LowerChest', 'Lats', 'UpperBack', 'LowerBack', 'FrontDelts', 'LateralDelts', 'RearDelts', 'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques', 'FullBody');

-- CreateEnum
CREATE TYPE "public"."AssetClass" AS ENUM ('Equity', 'Crypto', 'ETF', 'Forex', 'Other');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'VND', 'EUR', 'JPY', 'GBP', 'Other');

-- CreateEnum
CREATE TYPE "public"."TimetableStatus" AS ENUM ('Planned', 'InProgress', 'Done', 'Canceled');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSettings" (
    "userId" TEXT NOT NULL,
    "unit" "public"."Unit" NOT NULL DEFAULT 'kg',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."GymDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateYmd" DATE NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymDayFocus" (
    "dayId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "GymDayFocus_pkey" PRIMARY KEY ("dayId","tag")
);

-- CreateTable
CREATE TABLE "public"."GymExercise" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DECIMAL(6,1) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymPresetTarget" (
    "presetId" TEXT NOT NULL,
    "detail" "public"."MuscleDetailed" NOT NULL,

    CONSTRAINT "GymPresetTarget_pkey" PRIMARY KEY ("presetId","detail")
);

-- CreateTable
CREATE TABLE "public"."GymPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "instructions" TEXT,

    CONSTRAINT "GymPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "youtubeId" TEXT NOT NULL,
    "coverUrl" TEXT,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "durationS" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpendingTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "defaultAmount" DECIMAL(12,2),
    "defaultDueDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SpendingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."SpendingStatus" NOT NULL DEFAULT 'Process',
    "monthKey" CHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendingEntry_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."TimetableTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimetableEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "public"."TimetableStatus" NOT NULL DEFAULT 'Planned',
    "tagId" TEXT,
    "color" TEXT,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NavItem" (
    "key" VARCHAR(64) NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "iconKey" TEXT,
    "group" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "public"."UserNavItem" (
    "userId" TEXT NOT NULL,
    "navKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserNavItem_pkey" PRIMARY KEY ("userId","navKey")
);

-- CreateTable
CREATE TABLE "public"."LuckyCode" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "LuckyCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "GymDay_userId_dateYmd_idx" ON "public"."GymDay"("userId", "dateYmd");

-- CreateIndex
CREATE UNIQUE INDEX "GymDay_userId_dateYmd_key" ON "public"."GymDay"("userId", "dateYmd");

-- CreateIndex
CREATE INDEX "GymExercise_dayId_idx" ON "public"."GymExercise"("dayId");

-- CreateIndex
CREATE INDEX "GymExercise_presetId_idx" ON "public"."GymExercise"("presetId");

-- CreateIndex
CREATE INDEX "GymPresetTarget_detail_idx" ON "public"."GymPresetTarget"("detail");

-- CreateIndex
CREATE UNIQUE INDEX "GymPreset_name_key" ON "public"."GymPreset"("name");

-- CreateIndex
CREATE INDEX "Track_playlistId_position_idx" ON "public"."Track"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingTemplate_userId_title_key" ON "public"."SpendingTemplate"("userId", "title");

-- CreateIndex
CREATE INDEX "SpendingEntry_userId_monthKey_idx" ON "public"."SpendingEntry"("userId", "monthKey");

-- CreateIndex
CREATE INDEX "SpendingEntry_userId_dueDate_idx" ON "public"."SpendingEntry"("userId", "dueDate");

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
CREATE UNIQUE INDEX "PriceAlert_userId_securityId_key" ON "public"."PriceAlert"("userId", "securityId");

-- CreateIndex
CREATE INDEX "NotificationLog_alertId_firedAt_idx" ON "public"."NotificationLog"("alertId", "firedAt");

-- CreateIndex
CREATE INDEX "PriceSnapshot_securityId_ts_idx" ON "public"."PriceSnapshot"("securityId", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "PriceSnapshot_securityId_ts_key" ON "public"."PriceSnapshot"("securityId", "ts");

-- CreateIndex
CREATE INDEX "TimetableTag_userId_name_idx" ON "public"."TimetableTag"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableTag_userId_name_key" ON "public"."TimetableTag"("userId", "name");

-- CreateIndex
CREATE INDEX "TimetableEvent_userId_weekStart_day_startMin_idx" ON "public"."TimetableEvent"("userId", "weekStart", "day", "startMin");

-- CreateIndex
CREATE INDEX "TimetableEvent_userId_weekStart_idx" ON "public"."TimetableEvent"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "TimetableEvent_userId_endDate_idx" ON "public"."TimetableEvent"("userId", "endDate");

-- CreateIndex
CREATE INDEX "NavItem_group_position_idx" ON "public"."NavItem"("group", "position");

-- CreateIndex
CREATE INDEX "NavItem_isActive_position_idx" ON "public"."NavItem"("isActive", "position");

-- CreateIndex
CREATE INDEX "UserNavItem_userId_position_idx" ON "public"."UserNavItem"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "LuckyCode_code_key" ON "public"."LuckyCode"("code");

-- CreateIndex
CREATE INDEX "LuckyCode_code_idx" ON "public"."LuckyCode"("code");

-- CreateIndex
CREATE INDEX "LuckyCode_used_idx" ON "public"."LuckyCode"("used");

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymDay" ADD CONSTRAINT "GymDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymDayFocus" ADD CONSTRAINT "GymDayFocus_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."GymDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymExercise" ADD CONSTRAINT "GymExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."GymDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymExercise" ADD CONSTRAINT "GymExercise_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."GymPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymPresetTarget" ADD CONSTRAINT "GymPresetTarget_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."GymPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Track" ADD CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "public"."Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpendingTemplate" ADD CONSTRAINT "SpendingTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpendingEntry" ADD CONSTRAINT "SpendingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpendingEntry" ADD CONSTRAINT "SpendingEntry_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."SpendingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "public"."TimetableTag" ADD CONSTRAINT "TimetableTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableEvent" ADD CONSTRAINT "TimetableEvent_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."TimetableTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableEvent" ADD CONSTRAINT "TimetableEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNavItem" ADD CONSTRAINT "UserNavItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNavItem" ADD CONSTRAINT "UserNavItem_navKey_fkey" FOREIGN KEY ("navKey") REFERENCES "public"."NavItem"("key") ON DELETE CASCADE ON UPDATE CASCADE;
