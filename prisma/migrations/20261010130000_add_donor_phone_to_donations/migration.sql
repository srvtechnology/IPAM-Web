-- AlterTable
ALTER TABLE `donations`
    ADD COLUMN `donorPhone` VARCHAR(191) NULL,
    ADD COLUMN `donorClass` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `donations_donorPhone_idx` ON `donations`(`donorPhone`);
CREATE INDEX `donations_status_idx` ON `donations`(`status`);
CREATE INDEX `donations_createdAt_idx` ON `donations`(`createdAt`);
CREATE INDEX `donations_userId_idx` ON `donations`(`userId`);
