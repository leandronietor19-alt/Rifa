/*
  Warnings:

  - You are about to drop the column `totalNumbers` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `reservedUntil` on the `RaffleNumber` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RaffleNumber` table. All the data in the column will be lost.
  - Changed the type of `number` on the `RaffleNumber` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `orderId` on table `RaffleNumber` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RaffleNumber" DROP CONSTRAINT "RaffleNumber_orderId_fkey";

-- DropIndex
DROP INDEX "RaffleNumber_raffleId_status_idx";

-- AlterTable
ALTER TABLE "Raffle" DROP COLUMN "totalNumbers",
ADD COLUMN     "nextNumber" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "digits" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "RaffleNumber" DROP COLUMN "reservedUntil",
DROP COLUMN "status",
DROP COLUMN "number",
ADD COLUMN     "number" INTEGER NOT NULL,
ALTER COLUMN "orderId" SET NOT NULL;

-- DropEnum
DROP TYPE "NumberStatus";

-- CreateIndex
CREATE INDEX "RaffleNumber_raffleId_idx" ON "RaffleNumber"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleNumber_raffleId_number_key" ON "RaffleNumber"("raffleId", "number");

-- AddForeignKey
ALTER TABLE "RaffleNumber" ADD CONSTRAINT "RaffleNumber_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
