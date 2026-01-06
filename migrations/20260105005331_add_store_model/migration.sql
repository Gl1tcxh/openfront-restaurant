-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "hours" JSONB DEFAULT '{"monday":"11:00 AM - 10:00 PM","tuesday":"11:00 AM - 10:00 PM","wednesday":"11:00 AM - 10:00 PM","thursday":"11:00 AM - 10:00 PM","friday":"11:00 AM - 11:00 PM","saturday":"10:00 AM - 11:00 PM","sunday":"10:00 AM - 9:00 PM"}',
    "deliveryFee" DECIMAL(10,2) DEFAULT 4.99,
    "deliveryMinimum" DECIMAL(10,2) DEFAULT 15.00,
    "pickupDiscount" INTEGER DEFAULT 10,
    "estimatedDelivery" TEXT NOT NULL DEFAULT '30-45 min',
    "estimatedPickup" TEXT NOT NULL DEFAULT '15-20 min',
    "heroHeadline" TEXT NOT NULL DEFAULT 'Thoughtfully crafted burgers.',
    "heroSubheadline" TEXT NOT NULL DEFAULT 'Premium ingredients from local farms, bold flavors, and a commitment to quality in every bite.',
    "heroTagline" TEXT NOT NULL DEFAULT 'Locally Sourced · Made Fresh Daily',
    "promoBanner" TEXT NOT NULL DEFAULT 'Free pickup discount · 10% off all pickup orders',
    "rating" DECIMAL(2,1) DEFAULT 4.8,
    "reviewCount" INTEGER DEFAULT 0,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
