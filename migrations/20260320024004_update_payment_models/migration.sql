/*
  Warnings:

  - You are about to drop the column `paymentData` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProvider` on the `Cart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_paymentProvider_fkey";

-- DropIndex
DROP INDEX "Cart_paymentProvider_idx";

-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "paymentData",
DROP COLUMN "paymentProvider";
