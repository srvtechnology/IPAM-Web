-- AlterTable
ALTER TABLE `alumni_records`
  MODIFY `status` ENUM('APPROVED', 'PENDING', 'REJECTED', 'FLAGGED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `rejectionReason` TEXT NULL;

-- AlterTable
ALTER TABLE `alumni_users`
  ADD COLUMN `status` ENUM('APPROVED', 'PENDING', 'REJECTED', 'FLAGGED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `rejectionReason` TEXT NULL;

-- Backfill status for existing verified alumni
UPDATE `alumni_users` SET `status` = 'APPROVED' WHERE `isVerifiedAlumni` = 1;
