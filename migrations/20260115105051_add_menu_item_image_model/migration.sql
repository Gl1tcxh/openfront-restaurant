/*
  Warnings:

  - You are about to drop the column `image_extension` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `image_filesize` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `image_height` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `image_id` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `image_width` on the `MenuItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "image_extension",
DROP COLUMN "image_filesize",
DROP COLUMN "image_height",
DROP COLUMN "image_id",
DROP COLUMN "image_width";

-- CreateTable
CREATE TABLE "MenuItemImage" (
    "id" TEXT NOT NULL,
    "image_id" TEXT,
    "image_filesize" INTEGER,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_extension" TEXT,
    "imagePath" TEXT NOT NULL DEFAULT '',
    "altText" TEXT NOT NULL DEFAULT '',
    "order" INTEGER DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "MenuItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MenuItem_menuItemImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MenuItem_menuItemImages_AB_unique" ON "_MenuItem_menuItemImages"("A", "B");

-- CreateIndex
CREATE INDEX "_MenuItem_menuItemImages_B_index" ON "_MenuItem_menuItemImages"("B");

-- AddForeignKey
ALTER TABLE "_MenuItem_menuItemImages" ADD CONSTRAINT "_MenuItem_menuItemImages_A_fkey" FOREIGN KEY ("A") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MenuItem_menuItemImages" ADD CONSTRAINT "_MenuItem_menuItemImages_B_fkey" FOREIGN KEY ("B") REFERENCES "MenuItemImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
