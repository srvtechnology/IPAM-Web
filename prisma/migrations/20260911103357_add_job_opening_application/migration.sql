-- CreateTable
CREATE TABLE `job_opening_applications` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `alumniUserId` VARCHAR(191) NOT NULL,
    `linkedinUrl` TEXT NULL,
    `coverNote` TEXT NULL,
    `applicationRef` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `job_opening_applications_applicationRef_key`(`applicationRef`),
    UNIQUE INDEX `job_opening_applications_jobId_alumniUserId_key`(`jobId`, `alumniUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `job_opening_applications` ADD CONSTRAINT `job_opening_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_openings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_opening_applications` ADD CONSTRAINT `job_opening_applications_alumniUserId_fkey` FOREIGN KEY (`alumniUserId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
