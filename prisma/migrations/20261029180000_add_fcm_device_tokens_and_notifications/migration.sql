-- CreateTable
CREATE TABLE `alumni_device_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'android',
    `deviceName` VARCHAR(191) NULL,
    `appVersion` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alumni_device_tokens_token_key`(`token`),
    INDEX `alumni_device_tokens_userId_idx`(`userId`),
    INDEX `alumni_device_tokens_token_idx`(`token`),
    INDEX `alumni_device_tokens_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'NOTIFICATION',
    `priority` ENUM('NORMAL', 'URGENT', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `actionUrl` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `fcmMessageId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `alumni_notifications_userId_idx`(`userId`),
    INDEX `alumni_notifications_isRead_idx`(`isRead`),
    INDEX `alumni_notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alumni_device_tokens` ADD CONSTRAINT `alumni_device_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_notifications` ADD CONSTRAINT `alumni_notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

