/*
  Warnings:

  - You are about to drop the column `canCreateTodos` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canManageAllTodos` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `canManageOnboarding` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "canCreateTodos",
DROP COLUMN "canManageAllTodos",
DROP COLUMN "canManageOnboarding",
ADD COLUMN     "canManageCart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageDiscounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageGiftCards" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManagePayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageSettings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageTables" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageVendors" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadCart" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadDiscounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadGiftCards" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadInventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadKitchen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadPayments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadRoles" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadStaff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadTables" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canReadVendors" BOOLEAN NOT NULL DEFAULT false;
