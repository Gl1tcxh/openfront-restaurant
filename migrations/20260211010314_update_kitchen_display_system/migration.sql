-- AlterTable
ALTER TABLE "KitchenTicket" ADD COLUMN     "recalledAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "ticketType" TEXT DEFAULT 'prep';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "firedAt" TIMESTAMP(3),
ADD COLUMN     "fulfilledAt" TIMESTAMP(3),
ADD COLUMN     "kitchenReadyAt" TIMESTAMP(3),
ADD COLUMN     "kitchenStartedAt" TIMESTAMP(3),
ADD COLUMN     "kitchenStatus" TEXT DEFAULT 'new',
ADD COLUMN     "recalledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_KitchenTicket_orderItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_KitchenTicket_orderItems_AB_unique" ON "_KitchenTicket_orderItems"("A", "B");

-- CreateIndex
CREATE INDEX "_KitchenTicket_orderItems_B_index" ON "_KitchenTicket_orderItems"("B");

-- AddForeignKey
ALTER TABLE "_KitchenTicket_orderItems" ADD CONSTRAINT "_KitchenTicket_orderItems_A_fkey" FOREIGN KEY ("A") REFERENCES "KitchenTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KitchenTicket_orderItems" ADD CONSTRAINT "_KitchenTicket_orderItems_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
