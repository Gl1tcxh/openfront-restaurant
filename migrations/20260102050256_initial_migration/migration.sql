-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "role" TEXT,
    "employeeId" TEXT NOT NULL DEFAULT '',
    "staffRole" TEXT,
    "hireDate" TIMESTAMP(3),
    "hourlyRate" DECIMAL(10,2),
    "pin" TEXT NOT NULL DEFAULT '',
    "staffPermissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardingStatus" TEXT DEFAULT 'not_started',
    "photo_id" TEXT,
    "photo_filesize" INTEGER,
    "photo_width" INTEGER,
    "photo_height" INTEGER,
    "photo_extension" TEXT,
    "emergencyContactName" TEXT NOT NULL DEFAULT '',
    "emergencyContactPhone" TEXT NOT NULL DEFAULT '',
    "certifications" JSONB,
    "passwordResetToken" TEXT,
    "passwordResetIssuedAt" TIMESTAMP(3),
    "passwordResetRedeemedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "canCreateTodos" BOOLEAN NOT NULL DEFAULT false,
    "canManageAllTodos" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherPeople" BOOLEAN NOT NULL DEFAULT false,
    "canEditOtherPeople" BOOLEAN NOT NULL DEFAULT false,
    "canManagePeople" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT false,
    "canManageOnboarding" BOOLEAN NOT NULL DEFAULT true,
    "canAccessDashboard" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "tableNumber" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT DEFAULT 'available',
    "shape" TEXT DEFAULT 'rectangle',
    "positionX" DOUBLE PRECISION DEFAULT 0,
    "positionY" DOUBLE PRECISION DEFAULT 0,
    "metadata" JSONB,
    "floor" TEXT,
    "section" TEXT,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '🍽️',
    "description" TEXT NOT NULL DEFAULT '',
    "mealPeriods" JSONB NOT NULL DEFAULT '["all_day"]',
    "sortOrder" INTEGER DEFAULT 0,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "image_id" TEXT,
    "image_filesize" INTEGER,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_extension" TEXT,
    "description" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',
    "price" DECIMAL(10,2) NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "prepTime" INTEGER DEFAULT 15,
    "calories" INTEGER,
    "kitchenStation" TEXT DEFAULT 'grill',
    "allergens" JSONB NOT NULL DEFAULT '[]',
    "dietaryFlags" JSONB NOT NULL DEFAULT '[]',
    "mealPeriods" JSONB NOT NULL DEFAULT '["all_day"]',
    "category" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemModifier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "modifierGroup" TEXT DEFAULT 'addons',
    "modifierGroupLabel" TEXT NOT NULL DEFAULT '',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER DEFAULT 0,
    "maxSelections" INTEGER DEFAULT 1,
    "priceAdjustment" DECIMAL(10,2) DEFAULT 0.00,
    "calories" INTEGER,
    "defaultSelected" BOOLEAN NOT NULL DEFAULT false,
    "menuItem" TEXT,

    CONSTRAINT "MenuItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL DEFAULT '',
    "orderType" TEXT DEFAULT 'dine_in',
    "orderSource" TEXT DEFAULT 'pos',
    "status" TEXT DEFAULT 'open',
    "guestCount" INTEGER DEFAULT 1,
    "specialInstructions" TEXT NOT NULL DEFAULT '',
    "subtotal" DECIMAL(10,2) DEFAULT 0.00,
    "tax" DECIMAL(10,2) DEFAULT 0.00,
    "tip" DECIMAL(10,2) DEFAULT 0.00,
    "discount" DECIMAL(10,2) DEFAULT 0.00,
    "total" DECIMAL(10,2) DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "table" TEXT,
    "server" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "RestaurantOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "specialInstructions" TEXT NOT NULL DEFAULT '',
    "courseNumber" INTEGER DEFAULT 1,
    "seatNumber" INTEGER,
    "sentToKitchen" TIMESTAMP(3),
    "order" TEXT,
    "menuItem" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "customerEmail" TEXT NOT NULL DEFAULT '',
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL DEFAULT 2,
    "duration" INTEGER DEFAULT 90,
    "status" TEXT DEFAULT 'pending',
    "specialRequests" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "assignedTable" TEXT,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT DEFAULT 'credit_card',
    "stripePaymentIntentId" TEXT NOT NULL DEFAULT '',
    "stripeChargeId" TEXT NOT NULL DEFAULT '',
    "stripeRefundId" TEXT NOT NULL DEFAULT '',
    "cardLast4" TEXT NOT NULL DEFAULT '',
    "cardBrand" TEXT NOT NULL DEFAULT '',
    "tipAmount" DECIMAL(10,2) DEFAULT 0.00,
    "isSplitPayment" BOOLEAN NOT NULL DEFAULT false,
    "splitPaymentIndex" INTEGER,
    "splitTotal" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "order" TEXT,
    "processedBy" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "displayOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KitchenStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepStation" (
    "id" TEXT NOT NULL,
    "menuItem" TEXT,
    "station" TEXT,
    "preparationTime" INTEGER DEFAULT 15,

    CONSTRAINT "PrepStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicket" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER DEFAULT 0,
    "items" JSONB,
    "firedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "order" TEXT,
    "station" TEXT,
    "preparedBy" TEXT,

    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "paymentTerms" TEXT NOT NULL DEFAULT '',
    "leadTime" INTEGER,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'lb',
    "category" TEXT,
    "currentStock" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "parLevel" DECIMAL(10,2),
    "reorderPoint" DECIMAL(10,2),
    "reorderQuantity" DECIMAL(10,2),
    "costPerUnit" DECIMAL(10,2),
    "expirationDate" TIMESTAMP(3),
    "sku" TEXT NOT NULL DEFAULT '',
    "vendor" TEXT,
    "location" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ingredient" TEXT,
    "createdBy" TEXT,
    "order" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrderItem_appliedModifiers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_KitchenStation_assignedStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");

-- CreateIndex
CREATE INDEX "Table_tableNumber_idx" ON "Table"("tableNumber");

-- CreateIndex
CREATE INDEX "Table_floor_idx" ON "Table"("floor");

-- CreateIndex
CREATE INDEX "Table_section_idx" ON "Table"("section");

-- CreateIndex
CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");

-- CreateIndex
CREATE INDEX "MenuItemModifier_menuItem_idx" ON "MenuItemModifier"("menuItem");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantOrder_orderNumber_key" ON "RestaurantOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "RestaurantOrder_table_idx" ON "RestaurantOrder"("table");

-- CreateIndex
CREATE INDEX "RestaurantOrder_server_idx" ON "RestaurantOrder"("server");

-- CreateIndex
CREATE INDEX "RestaurantOrder_createdBy_idx" ON "RestaurantOrder"("createdBy");

-- CreateIndex
CREATE INDEX "OrderItem_order_idx" ON "OrderItem"("order");

-- CreateIndex
CREATE INDEX "OrderItem_menuItem_idx" ON "OrderItem"("menuItem");

-- CreateIndex
CREATE INDEX "Reservation_assignedTable_idx" ON "Reservation"("assignedTable");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_order_idx" ON "Payment"("order");

-- CreateIndex
CREATE INDEX "Payment_processedBy_idx" ON "Payment"("processedBy");

-- CreateIndex
CREATE INDEX "PrepStation_menuItem_idx" ON "PrepStation"("menuItem");

-- CreateIndex
CREATE INDEX "PrepStation_station_idx" ON "PrepStation"("station");

-- CreateIndex
CREATE INDEX "KitchenTicket_order_idx" ON "KitchenTicket"("order");

-- CreateIndex
CREATE INDEX "KitchenTicket_station_idx" ON "KitchenTicket"("station");

-- CreateIndex
CREATE INDEX "KitchenTicket_preparedBy_idx" ON "KitchenTicket"("preparedBy");

-- CreateIndex
CREATE INDEX "Ingredient_vendor_idx" ON "Ingredient"("vendor");

-- CreateIndex
CREATE INDEX "Ingredient_location_idx" ON "Ingredient"("location");

-- CreateIndex
CREATE INDEX "StockMovement_ingredient_idx" ON "StockMovement"("ingredient");

-- CreateIndex
CREATE INDEX "StockMovement_createdBy_idx" ON "StockMovement"("createdBy");

-- CreateIndex
CREATE INDEX "StockMovement_order_idx" ON "StockMovement"("order");

-- CreateIndex
CREATE UNIQUE INDEX "_OrderItem_appliedModifiers_AB_unique" ON "_OrderItem_appliedModifiers"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderItem_appliedModifiers_B_index" ON "_OrderItem_appliedModifiers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_KitchenStation_assignedStaff_AB_unique" ON "_KitchenStation_assignedStaff"("A", "B");

-- CreateIndex
CREATE INDEX "_KitchenStation_assignedStaff_B_index" ON "_KitchenStation_assignedStaff"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_floor_fkey" FOREIGN KEY ("floor") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_section_fkey" FOREIGN KEY ("section") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_category_fkey" FOREIGN KEY ("category") REFERENCES "MenuCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemModifier" ADD CONSTRAINT "MenuItemModifier_menuItem_fkey" FOREIGN KEY ("menuItem") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_table_fkey" FOREIGN KEY ("table") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_server_fkey" FOREIGN KEY ("server") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItem_fkey" FOREIGN KEY ("menuItem") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assignedTable_fkey" FOREIGN KEY ("assignedTable") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepStation" ADD CONSTRAINT "PrepStation_menuItem_fkey" FOREIGN KEY ("menuItem") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepStation" ADD CONSTRAINT "PrepStation_station_fkey" FOREIGN KEY ("station") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_station_fkey" FOREIGN KEY ("station") REFERENCES "KitchenStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_vendor_fkey" FOREIGN KEY ("vendor") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_location_fkey" FOREIGN KEY ("location") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_ingredient_fkey" FOREIGN KEY ("ingredient") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_order_fkey" FOREIGN KEY ("order") REFERENCES "RestaurantOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItem_appliedModifiers" ADD CONSTRAINT "_OrderItem_appliedModifiers_A_fkey" FOREIGN KEY ("A") REFERENCES "MenuItemModifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderItem_appliedModifiers" ADD CONSTRAINT "_OrderItem_appliedModifiers_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KitchenStation_assignedStaff" ADD CONSTRAINT "_KitchenStation_assignedStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "KitchenStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KitchenStation_assignedStaff" ADD CONSTRAINT "_KitchenStation_assignedStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
