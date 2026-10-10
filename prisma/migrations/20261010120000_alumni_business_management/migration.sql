-- AlterTable
ALTER TABLE `alumni_businesses`
  MODIFY COLUMN `image` LONGTEXT NULL,
  MODIFY COLUMN `logo` LONGTEXT NULL,
  ADD COLUMN `bannerImage` LONGTEXT NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN `submittedByType` VARCHAR(191) NOT NULL DEFAULT 'ALUMNI',
  ADD COLUMN `userId` VARCHAR(191) NULL,
  ADD COLUMN `rejectionReason` TEXT NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `alumni_businesses_status_idx` ON `alumni_businesses`(`status`);

-- CreateIndex
CREATE INDEX `alumni_businesses_userId_idx` ON `alumni_businesses`(`userId`);

-- AddForeignKey
ALTER TABLE `alumni_businesses` ADD CONSTRAINT `alumni_businesses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
