-- AlterTable
ALTER TABLE `donations` ADD COLUMN `dedicationName` VARCHAR(191) NULL,
    ADD COLUMN `frequency` VARCHAR(191) NULL,
    ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isDedication` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `event_proposals` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` ENUM('GALA', 'WEBINAR', 'REGIONAL_MEETUP', 'NETWORKING', 'CAREER_WORKSHOP') NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `targetDate` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `organizerEmail` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
