/*
  Warnings:

  - You are about to drop the column `name` on the `GymExercise` table. All the data in the column will be lost.
  - Added the required column `presetId` to the `GymExercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."GymExercise" DROP COLUMN "name",
ADD COLUMN     "presetId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "GymExercise_presetId_idx" ON "public"."GymExercise"("presetId");

-- AddForeignKey
ALTER TABLE "public"."GymExercise" ADD CONSTRAINT "GymExercise_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "public"."GymPreset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
