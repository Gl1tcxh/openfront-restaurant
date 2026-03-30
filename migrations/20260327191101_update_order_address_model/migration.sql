-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'US',
ALTER COLUMN "country" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "deliveryAddress2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryCountryCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryState" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "RestaurantOrder" ADD COLUMN     "deliveryAddress2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryCountryCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "deliveryState" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deliveryPostalCodes" JSONB DEFAULT '["11201"]';
