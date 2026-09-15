/*
  Warnings:

  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `raffleId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Raffle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RaffleNumber` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `buyerAddress` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleNumber" DROP CONSTRAINT "RaffleNumber_orderId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleNumber" DROP CONSTRAINT "RaffleNumber_raffleId_fkey";

-- DropIndex
DROP INDEX "Order_raffleId_status_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "quantity",
DROP COLUMN "raffleId",
ADD COLUMN     "buyerAddress" TEXT NOT NULL;

-- DropTable
DROP TABLE "Raffle";

-- DropTable
DROP TABLE "RaffleNumber";

-- DropEnum
DROP TYPE "RaffleStatus";

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bizumPhone" TEXT,
    "bankAccount" TEXT,
    "bankHolder" TEXT,
    "paymentNotes" TEXT,
    "reservationMinutes" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
