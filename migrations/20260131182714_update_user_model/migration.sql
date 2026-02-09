-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "orderType" TEXT DEFAULT 'pickup',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cart" TEXT,
    "menuItem" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "specialInstructions" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CartItem_modifiers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Cart_user_idx" ON "Cart"("user");

-- CreateIndex
CREATE INDEX "CartItem_cart_idx" ON "CartItem"("cart");

-- CreateIndex
CREATE INDEX "CartItem_menuItem_idx" ON "CartItem"("menuItem");

-- CreateIndex
CREATE UNIQUE INDEX "_CartItem_modifiers_AB_unique" ON "_CartItem_modifiers"("A", "B");

-- CreateIndex
CREATE INDEX "_CartItem_modifiers_B_index" ON "_CartItem_modifiers"("B");

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_fkey" FOREIGN KEY ("cart") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_menuItem_fkey" FOREIGN KEY ("menuItem") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItem_modifiers" ADD CONSTRAINT "_CartItem_modifiers_A_fkey" FOREIGN KEY ("A") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItem_modifiers" ADD CONSTRAINT "_CartItem_modifiers_B_fkey" FOREIGN KEY ("B") REFERENCES "MenuItemModifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
