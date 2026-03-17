/*
  Warnings:

  - You are about to drop the column `stripeChargeId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripeRefundId` on the `Payment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Payment_stripePaymentIntentId_key";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "customerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "customerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryZip" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "order" TEXT,
ADD COLUMN     "paymentData" JSONB,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "tipPercent" TEXT DEFAULT '18';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripeChargeId",
DROP COLUMN "stripePaymentIntentId",
DROP COLUMN "stripeRefundId",
ADD COLUMN     "data" JSONB;

-- CreateIndex
CREATE INDEX "Cart_paymentProvider_idx" ON "Cart"("paymentProvider");

-- CreateIndex
CREATE INDEX "Cart_order_idx" ON "Cart"("order");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_paymentProvider_fkey" FOREIGN KEY ("paymentProvider") REFERENCES "PaymentProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
