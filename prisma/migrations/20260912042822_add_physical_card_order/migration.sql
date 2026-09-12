-- CreateTable
CREATE TABLE `physical_card_orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `alumniUserId` VARCHAR(191) NOT NULL,
    `cardTier` ENUM('STANDARD_PVC', 'GOLD_RFID_SMART', 'EXECUTIVE_TITANIUM') NOT NULL DEFAULT 'STANDARD_PVC',
    `deliveryAddress` TEXT NOT NULL,
    `status` ENUM('IN_PRINT_PRESS', 'QUALITY_CHECK', 'READY_COURIER', 'DISPATCHED', 'DELIVERED', 'COLLECTED') NOT NULL DEFAULT 'IN_PRINT_PRESS',
    `trackingCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `physical_card_orders_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `physical_card_orders` ADD CONSTRAINT `physical_card_orders_alumniUserId_fkey` FOREIGN KEY (`alumniUserId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
