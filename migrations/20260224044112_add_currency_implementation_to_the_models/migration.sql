-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "RestaurantOrder" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
