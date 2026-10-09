-- AlterTable
ALTER TABLE `alumni_members` MODIFY `avatar` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `job_opening_applications` MODIFY `avatarUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `alumni_users`
  ADD COLUMN `subscriptionBillingCycle` VARCHAR(191) NULL DEFAULT 'ANNUAL',
  ADD COLUMN `subscriptionAutoRenew` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `subscriptionUpdatedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `membership_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tier` ENUM('STANDARD', 'SILVER_LIFETIME', 'GOLD_PATRON') NOT NULL,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'ANNUAL',
    `amountPaid` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'CARD',
    `paymentReference` VARCHAR(191) NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `membership_subscriptions_userId_idx`(`userId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `membership_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
