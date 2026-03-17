-- DropIndex
DROP INDEX "User_employeeId_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "employeeId" DROP NOT NULL,
ALTER COLUMN "employeeId" DROP DEFAULT;
