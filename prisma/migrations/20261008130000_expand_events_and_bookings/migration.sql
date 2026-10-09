-- AlterTable alumni_events
ALTER TABLE `alumni_events`
    ADD COLUMN `isPaid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Drop existing unique index & foreign keys on event_registrations
ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_userId_fkey`;
ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_eventId_fkey`;
ALTER TABLE `event_registrations` DROP INDEX `event_registrations_eventId_userId_key`;

-- AlterTable event_registrations
ALTER TABLE `event_registrations`
    ADD COLUMN `bookingReference` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `userId` VARCHAR(191) NULL,
    ADD COLUMN `ticketCount` INT NOT NULL DEFAULT 1,
    ADD COLUMN `unitPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'FREE',
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `paymentRef` VARCHAR(191) NULL,
    ADD COLUMN `bookingStatus` VARCHAR(191) NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN `attendedAt` DATETIME(3) NULL,
    ADD COLUMN `attendeeName` VARCHAR(191) NULL,
    ADD COLUMN `attendeeEmail` VARCHAR(191) NULL,
    ADD COLUMN `attendeePhone` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'SELF_SERVICE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Create indexes on event_registrations
CREATE UNIQUE INDEX `event_registrations_bookingReference_key` ON `event_registrations`(`bookingReference`);
CREATE INDEX `event_registrations_eventId_idx` ON `event_registrations`(`eventId`);
CREATE INDEX `event_registrations_userId_idx` ON `event_registrations`(`userId`);

-- Re-add foreign keys
ALTER TABLE `event_registrations`
    ADD CONSTRAINT `event_registrations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `event_registrations`
    ADD CONSTRAINT `event_registrations_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `alumni_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
