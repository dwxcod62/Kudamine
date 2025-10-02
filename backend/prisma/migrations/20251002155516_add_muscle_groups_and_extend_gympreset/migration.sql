-- CreateEnum
CREATE TYPE "public"."MuscleDetailed" AS ENUM ('UpperChest', 'MiddleChest', 'LowerChest', 'Lats', 'UpperBack', 'LowerBack', 'FrontDelts', 'LateralDelts', 'RearDelts', 'Biceps', 'Triceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques', 'FullBody');

-- AlterTable
ALTER TABLE "public"."GymPreset" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "instructions" TEXT;

-- CreateTable
CREATE TABLE "public"."GymPresetTarget" (
    "presetId" TEXT NOT NULL,
    "detail" "public"."MuscleDetailed" NOT NULL,

    CONSTRAINT "GymPresetTarget_pkey" PRIMARY KEY ("presetId","detail")
);

-- CreateIndex
CREATE INDEX "GymPresetTarget_detail_idx" ON "public"."GymPresetTarget"("detail");

-- AddForeignKey
ALTER TABLE "public"."GymPresetTarget" ADD CONSTRAINT "GymPresetTarget_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."GymPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
