-- AlterTable
ALTER TABLE `physical_card_orders`
    ADD COLUMN `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    ADD COLUMN `recipientName` VARCHAR(191) NULL,
    ADD COLUMN `recipientPhone` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'COD',
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `paymentRef` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `transactions`
    ADD COLUMN `cardOrderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `transactions_cardOrderId_key` ON `transactions`(`cardOrderId`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_cardOrderId_fkey` FOREIGN KEY (`cardOrderId`) REFERENCES `physical_card_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
