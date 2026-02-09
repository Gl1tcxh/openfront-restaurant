/*
  Warnings:

  - You are about to alter the column `price` on the `MenuItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `priceAdjustment` on the `MenuItemModifier` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the column `table` on the `RestaurantOrder` table. All the data in the column will be lost.
  - You are about to alter the column `subtotal` on the `RestaurantOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `tax` on the `RestaurantOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `tip` on the `RestaurantOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `discount` on the `RestaurantOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `total` on the `RestaurantOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "RestaurantOrder" DROP CONSTRAINT "RestaurantOrder_table_fkey";

-- DropIndex
DROP INDEX "RestaurantOrder_table_idx";

-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "MenuItemModifier" ALTER COLUMN "priceAdjustment" SET DEFAULT 0,
ALTER COLUMN "priceAdjustment" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "course" TEXT,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "RestaurantOrder" DROP COLUMN "table",
ADD COLUMN     "holdReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tableFreedAt" TIMESTAMP(3),
ADD COLUMN     "tableSeatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "subtotal" SET DATA TYPE INTEGER,
ALTER COLUMN "tax" SET DEFAULT 0,
ALTER COLUMN "tax" SET DATA TYPE INTEGER,
ALTER COLUMN "tip" SET DEFAULT 0,
ALTER COLUMN "tip" SET DATA TYPE INTEGER,
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "discount" SET DATA TYPE INTEGER,
ALTER COLUMN "total" SET DEFAULT 0,
ALTER COLUMN "total" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "OrderCourse" (
    "id" TEXT NOT NULL,
    "courseType" TEXT NOT NULL DEFAULT 'mains',
    "status" TEXT DEFAULT 'pending',
    "fireTime" TIMESTAMP(3),
    "autoFireAt" TIMESTAMP(3),
    "onHold" BOOLEAN NOT NULL DEFAULT false,
    "allItemsReady" BOOLEAN NOT NULL DEFAULT false,
    "courseNumber" INTEGER DEFAULT 1,
    "order" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "type" TEXT DEFAULT 'general',
    "fromStation" TEXT DEFAULT 'foh',
    "order" TEXT,
    "sender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "menuItem" TEXT,
    "recipeIngredients" JSONB,
    "yield" INTEGER DEFAULT 1,
    "prepTime" INTEGER,
    "instructions" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "partySize" INTEGER NOT NULL DEFAULT 2,
    "quotedWaitTime" INTEGER DEFAULT 15,
    "status" TEXT DEFAULT 'waiting',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "table" TEXT,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'server',
    "status" TEXT DEFAULT 'scheduled',
    "hourlyRate" DECIMAL(10,2),
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "staff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipPool" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tipPoolType" TEXT DEFAULT 'individual',
    "totalTips" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "cashTips" DECIMAL(10,2) DEFAULT 0.00,
    "creditTips" DECIMAL(10,2) DEFAULT 0.00,
    "distributions" JSONB,
    "status" TEXT DEFAULT 'open',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "role" TEXT DEFAULT 'server',
    "hourlyRate" DECIMAL(10,2),
    "tips" DECIMAL(10,2) DEFAULT 0.00,
    "breakMinutes" DECIMAL(5,0) DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "staff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteLog" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'spoilage',
    "notes" TEXT NOT NULL DEFAULT '',
    "ingredient" TEXT,
    "loggedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL DEFAULT '',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDelivery" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "lineItems" JSONB,
    "notes" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RestaurantOrder_tables" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "OrderCourse_order_idx" ON "OrderCourse"("order");

-- CreateIndex
CREATE INDEX "KitchenMessage_order_idx" ON "KitchenMessage"("order");

-- CreateIndex
CREATE INDEX "KitchenMessage_sender_idx" ON "KitchenMessage"("sender");

-- CreateIndex
CREATE INDEX "Recipe_menuItem_idx" ON "Recipe"("menuItem");

-- CreateIndex
CREATE INDEX "WaitlistEntry_table_idx" ON "WaitlistEntry"("table");

-- CreateIndex
CREATE INDEX "WaitlistEntry_addedBy_idx" ON "WaitlistEntry"("addedBy");

-- CreateIndex
CREATE INDEX "Shift_staff_idx" ON "Shift"("staff");

-- CreateIndex
CREATE INDEX "TipPool_createdBy_idx" ON "TipPool"("createdBy");

-- CreateIndex
CREATE INDEX "TimeEntry_staff_idx" ON "TimeEntry"("staff");

-- CreateIndex
CREATE INDEX "WasteLog_ingredient_idx" ON "WasteLog"("ingredient");

-- CreateIndex
CREATE INDEX "WasteLog_loggedBy_idx" ON "WasteLog"("loggedBy");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendor_idx" ON "PurchaseOrder"("vendor");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdBy_idx" ON "PurchaseOrder"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "_RestaurantOrder_tables_AB_unique" ON "_RestaurantOrder_tables"("A", "B");

-- CreateIndex
CREATE INDEX "_RestaurantOrder_tables_B_index" ON "_RestaurantOrder_tables"("B");

-- CreateIndex
CREATE INDEX "OrderItem_course_idx" ON "OrderItem"("course");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_course_fkey" FOREIGN KEY ("course") REFERENCES "OrderCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCourse" ADD CONSTRAINT "OrderCourse_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenMessage" ADD CONSTRAINT "KitchenMessage_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenMessage" ADD CONSTRAINT "KitchenMessage_sender_fkey" FOREIGN KEY ("sender") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_menuItem_fkey" FOREIGN KEY ("menuItem") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_table_fkey" FOREIGN KEY ("table") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_staff_fkey" FOREIGN KEY ("staff") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipPool" ADD CONSTRAINT "TipPool_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_staff_fkey" FOREIGN KEY ("staff") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteLog" ADD CONSTRAINT "WasteLog_ingredient_fkey" FOREIGN KEY ("ingredient") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteLog" ADD CONSTRAINT "WasteLog_loggedBy_fkey" FOREIGN KEY ("loggedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendor_fkey" FOREIGN KEY ("vendor") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RestaurantOrder_tables" ADD CONSTRAINT "_RestaurantOrder_tables_A_fkey" FOREIGN KEY ("A") REFERENCES "RestaurantOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RestaurantOrder_tables" ADD CONSTRAINT "_RestaurantOrder_tables_B_fkey" FOREIGN KEY ("B") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
