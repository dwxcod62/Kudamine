/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `GymPreset` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."GymPreset" DROP CONSTRAINT "GymPreset_userId_fkey";

-- DropIndex
DROP INDEX "public"."GymPreset_userId_name_key";

-- AlterTable
ALTER TABLE "public"."GymPreset" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GymPreset_name_key" ON "public"."GymPreset"("name");

-- AddForeignKey
ALTER TABLE "public"."GymPreset" ADD CONSTRAINT "GymPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
