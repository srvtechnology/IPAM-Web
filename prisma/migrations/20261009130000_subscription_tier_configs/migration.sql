-- CreateTable
CREATE TABLE `subscription_tier_configs` (
    `id` VARCHAR(191) NOT NULL,
    `tier` ENUM('STANDARD', 'SILVER_LIFETIME', 'GOLD_PATRON') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `badgeText` VARCHAR(191) NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `annualPrice` DOUBLE NOT NULL DEFAULT 0,
    `lifetimePrice` DOUBLE NOT NULL DEFAULT 0,
    `monthlyPrice` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `perks` JSON NOT NULL,
    `accentColor` VARCHAR(191) NULL DEFAULT 'emerald',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscription_tier_configs_tier_key`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
