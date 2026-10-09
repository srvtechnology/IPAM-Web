-- AlterTable job_opening_applications
ALTER TABLE `job_opening_applications`
    ADD COLUMN `cvUrl` LONGTEXT NULL,
    ADD COLUMN `cvFileName` VARCHAR(255) NULL;
