-- AlterTable job_openings
ALTER TABLE `job_openings`
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `experienceRequired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `experienceLevel` VARCHAR(191) NULL,
    ADD COLUMN `hiringType` VARCHAR(191) NOT NULL DEFAULT 'TILL_DATE',
    ADD COLUMN `positionsOpen` INT NOT NULL DEFAULT 1,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `postedByType` VARCHAR(191) NOT NULL DEFAULT 'ALUMNI',
    ADD COLUMN `postedByName` VARCHAR(191) NULL,
    ADD COLUMN `postedByTitle` VARCHAR(191) NULL,
    ADD COLUMN `postedByAdminId` VARCHAR(191) NULL,
    ADD COLUMN `employerId` VARCHAR(191) NULL,
    MODIFY COLUMN `deadline` DATETIME(3) NULL;

-- CreateIndex on job_openings
CREATE INDEX `job_openings_postedByAlumniId_idx` ON `job_openings`(`postedByAlumniId`);
CREATE INDEX `job_openings_postedByAdminId_idx` ON `job_openings`(`postedByAdminId`);

-- AddForeignKey to job_openings
ALTER TABLE `job_openings`
    ADD CONSTRAINT `job_openings_postedByAdminId_fkey` FOREIGN KEY (`postedByAdminId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `job_openings`
    ADD CONSTRAINT `job_openings_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `employer_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop existing unique index & foreign key on job_opening_applications
ALTER TABLE `job_opening_applications` DROP FOREIGN KEY `job_opening_applications_alumniUserId_fkey`;
ALTER TABLE `job_opening_applications` DROP INDEX `job_opening_applications_jobId_alumniUserId_key`;

-- AlterTable job_opening_applications
ALTER TABLE `job_opening_applications`
    MODIFY COLUMN `alumniUserId` VARCHAR(191) NULL,
    ADD COLUMN `candidateName` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `degree` VARCHAR(191) NULL,
    ADD COLUMN `faculty` VARCHAR(191) NULL,
    ADD COLUMN `gradYear` INT NULL,
    ADD COLUMN `avatarUrl` TEXT NULL,
    ADD COLUMN `gpa` VARCHAR(191) NULL,
    ADD COLUMN `experienceYears` INT NOT NULL DEFAULT 0,
    ADD COLUMN `skills` JSON NULL,
    ADD COLUMN `matchScore` INT NOT NULL DEFAULT 85,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'APPLIED',
    ADD COLUMN `interviewDate` DATETIME(3) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `selectedDate` DATETIME(3) NULL,
    ADD COLUMN `offerSalary` VARCHAR(191) NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `decisionStatus` VARCHAR(191) NULL,
    ADD COLUMN `recruiterRemarks` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- CreateIndex on job_opening_applications
CREATE INDEX `job_opening_applications_jobId_idx` ON `job_opening_applications`(`jobId`);
CREATE INDEX `job_opening_applications_alumniUserId_idx` ON `job_opening_applications`(`alumniUserId`);

-- Re-add foreign key on job_opening_applications
ALTER TABLE `job_opening_applications`
    ADD CONSTRAINT `job_opening_applications_alumniUserId_fkey` FOREIGN KEY (`alumniUserId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
