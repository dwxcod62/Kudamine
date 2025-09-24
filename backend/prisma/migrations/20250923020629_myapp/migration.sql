-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('kg', 'lb');

-- CreateEnum
CREATE TYPE "public"."SpendingStatus" AS ENUM ('Done', 'Process', 'Skip');

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
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weightKg" DECIMAL(6,1) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GymPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "GymDay_userId_dateYmd_idx" ON "public"."GymDay"("userId", "dateYmd");

-- CreateIndex
CREATE UNIQUE INDEX "GymDay_userId_dateYmd_key" ON "public"."GymDay"("userId", "dateYmd");

-- CreateIndex
CREATE INDEX "GymExercise_dayId_idx" ON "public"."GymExercise"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "GymPreset_userId_name_key" ON "public"."GymPreset"("userId", "name");

-- CreateIndex
CREATE INDEX "Track_playlistId_position_idx" ON "public"."Track"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingTemplate_userId_title_key" ON "public"."SpendingTemplate"("userId", "title");

-- CreateIndex
CREATE INDEX "SpendingEntry_userId_monthKey_idx" ON "public"."SpendingEntry"("userId", "monthKey");

-- CreateIndex
CREATE INDEX "SpendingEntry_userId_dueDate_idx" ON "public"."SpendingEntry"("userId", "dueDate");

-- AddForeignKey
ALTER TABLE "public"."UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymDay" ADD CONSTRAINT "GymDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymDayFocus" ADD CONSTRAINT "GymDayFocus_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."GymDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymExercise" ADD CONSTRAINT "GymExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."GymDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GymPreset" ADD CONSTRAINT "GymPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
