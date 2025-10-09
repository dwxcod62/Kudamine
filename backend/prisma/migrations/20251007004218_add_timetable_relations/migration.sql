-- CreateEnum
CREATE TYPE "public"."TimetableStatus" AS ENUM ('Planned', 'InProgress', 'Done', 'Canceled');

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

-- AddForeignKey
ALTER TABLE "public"."TimetableTag" ADD CONSTRAINT "TimetableTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableEvent" ADD CONSTRAINT "TimetableEvent_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."TimetableTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimetableEvent" ADD CONSTRAINT "TimetableEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
