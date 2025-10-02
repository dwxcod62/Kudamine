/*
  Warnings:

  - You are about to drop the column `userId` on the `GymPreset` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GymPreset" DROP CONSTRAINT "GymPreset_userId_fkey";

-- AlterTable
ALTER TABLE "public"."GymPreset" DROP COLUMN "userId";
