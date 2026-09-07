-- CreateTable
CREATE TABLE `alumni_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `isVerifiedAlumni` BOOLEAN NOT NULL DEFAULT false,
    `membershipTier` ENUM('STANDARD', 'SILVER_LIFETIME', 'GOLD_PATRON') NOT NULL DEFAULT 'STANDARD',
    `membershipValidUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alumni_users_email_key`(`email`),
    UNIQUE INDEX `alumni_users_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_members` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatar` TEXT NULL,
    `classYear` INTEGER NOT NULL,
    `degree` VARCHAR(191) NOT NULL,
    `major` VARCHAR(191) NOT NULL,
    `currentRole` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NOT NULL,
    `isMentor` BOOLEAN NOT NULL DEFAULT false,
    `bio` TEXT NOT NULL,
    `linkedin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `alumni_members_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_member_skills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alumniId` VARCHAR(191) NOT NULL,
    `skill` VARCHAR(191) NOT NULL,

    INDEX `alumni_member_skills_alumniId_idx`(`alumniId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leadership_members` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `classYear` VARCHAR(191) NOT NULL,
    `image` TEXT NULL,
    `bio` TEXT NOT NULL,
    `quote` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leadership_initiatives` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaderId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,

    INDEX `leadership_initiatives_leaderId_idx`(`leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_openings` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `companyLogo` TEXT NULL,
    `location` VARCHAR(191) NOT NULL,
    `type` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE') NOT NULL,
    `workplaceType` ENUM('REMOTE', 'HYBRID', 'ON_SITE') NULL,
    `salary` VARCHAR(191) NOT NULL,
    `category` ENUM('ENGINEERING', 'DATA_AI', 'FINANCE_BANKING', 'OPERATIONS', 'PRODUCT_DESIGN', 'LEGAL_PUBLIC_POLICY') NOT NULL,
    `description` TEXT NOT NULL,
    `responsibilities` JSON NULL,
    `requirements` JSON NOT NULL,
    `benefits` JSON NULL,
    `aboutCompany` TEXT NULL,
    `postedByAlumniId` VARCHAR(191) NULL,
    `postedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deadline` DATETIME(3) NOT NULL,
    `applyUrl` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `saved_jobs_userId_jobId_key`(`userId`, `jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `displayDate` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `venueDetails` VARCHAR(191) NULL,
    `isVirtual` BOOLEAN NOT NULL DEFAULT false,
    `virtualLink` VARCHAR(191) NULL,
    `category` ENUM('GALA', 'WEBINAR', 'REGIONAL_MEETUP', 'NETWORKING', 'CAREER_WORKSHOP') NOT NULL,
    `icon` VARCHAR(191) NULL,
    `bannerColor` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `agenda` JSON NULL,
    `speakers` JSON NULL,
    `ticketPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `capacity` INTEGER NOT NULL,
    `registeredCount` INTEGER NOT NULL DEFAULT 0,
    `dressCode` VARCHAR(191) NULL,
    `highlights` JSON NULL,
    `faqs` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `event_registrations_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_businesses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `founders` VARCHAR(191) NOT NULL,
    `classYear` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `about` TEXT NULL,
    `services` JSON NULL,
    `keyProducts` JSON NULL,
    `yearFounded` INTEGER NULL,
    `companySize` VARCHAR(191) NULL,
    `website` VARCHAR(191) NOT NULL,
    `image` TEXT NULL,
    `logo` TEXT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `certifications` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donations` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `donorName` VARCHAR(191) NOT NULL,
    `donorEmail` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `fund` VARCHAR(191) NOT NULL,
    `paymentRef` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `donations_paymentRef_key`(`paymentRef`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_bookmarks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ownerId` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `alumni_bookmarks_ownerId_targetId_key`(`ownerId`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `department` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `avatarUrl` TEXT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION') NOT NULL DEFAULT 'PENDING_ACTIVATION',
    `twoFactorEnforced` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorMethod` ENUM('SMS_OTP', 'HARDWARE_FIDO2', 'AUTHENTICATOR_APP') NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `assignedBy` VARCHAR(191) NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customPermissionOverrides` JSON NULL,

    UNIQUE INDEX `admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_role_definitions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `isSystemDefault` BOOLEAN NOT NULL DEFAULT false,
    `badgeColor` ENUM('PRIMARY', 'SECONDARY', 'TERTIARY', 'ERROR', 'OUTLINE') NOT NULL DEFAULT 'PRIMARY',
    `priorityLevel` INTEGER NOT NULL,

    UNIQUE INDEX `admin_role_definitions_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_module_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` VARCHAR(191) NOT NULL,
    `module` ENUM('DIRECTORY', 'ID_CARDS', 'BROADCAST', 'JOBS', 'COMMERCIAL', 'FINANCE', 'SIS_SYNC', 'AUDIT_TRAILS', 'RBAC_GOVERNANCE', 'SYSTEM_SETTINGS') NOT NULL,
    `canRead` BOOLEAN NOT NULL DEFAULT false,
    `canWrite` BOOLEAN NOT NULL DEFAULT false,
    `canApprove` BOOLEAN NOT NULL DEFAULT false,
    `canExport` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `role_module_permissions_roleId_module_key`(`roleId`, `module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alumni_records` (
    `id` VARCHAR(191) NOT NULL,
    `alumniUserId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `avatarUrl` TEXT NULL,
    `initials` VARCHAR(191) NULL,
    `regNo` VARCHAR(191) NOT NULL,
    `degree` VARCHAR(191) NOT NULL,
    `faculty` VARCHAR(191) NOT NULL,
    `gradYear` INTEGER NOT NULL,
    `authStatus` ENUM('OTP_VERIFIED', 'BIOMETRIC_SYNCED', 'PENDING_2FA', 'UNVERIFIED') NOT NULL DEFAULT 'UNVERIFIED',
    `role` ENUM('ALUMNI_MEMBER', 'CORPORATE_RECRUITER', 'DEPT_MODERATOR', 'EXECUTIVE_COUNCIL') NOT NULL DEFAULT 'ALUMNI_MEMBER',
    `status` ENUM('APPROVED', 'PENDING', 'FLAGGED') NOT NULL DEFAULT 'PENDING',
    `phone` VARCHAR(191) NULL,
    `nationalId` VARCHAR(191) NULL,
    `biometricScore` INTEGER NULL,
    `dateRegistered` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `digitalPassIssued` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `alumni_records_alumniUserId_key`(`alumniUserId`),
    UNIQUE INDEX `alumni_records_regNo_key`(`regNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `id_card_orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `alumniRecordId` VARCHAR(191) NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `regNo` VARCHAR(191) NOT NULL,
    `deliveryAddress` VARCHAR(191) NOT NULL,
    `courierType` ENUM('DHL_EXPRESS_RUSH', 'INTL_AIR_CARGO', 'CAMPUS_DESK', 'PROVINCIAL_POST') NOT NULL,
    `status` ENUM('IN_PRINT_PRESS', 'QUALITY_CHECK', 'READY_COURIER', 'DISPATCHED', 'DELIVERED', 'COLLECTED') NOT NULL DEFAULT 'IN_PRINT_PRESS',
    `submittedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `trackingCode` VARCHAR(191) NULL,
    `cardTier` ENUM('STANDARD_PVC', 'GOLD_RFID_SMART', 'EXECUTIVE_TITANIUM') NOT NULL,
    `faculty` VARCHAR(191) NULL,
    `degree` VARCHAR(191) NULL,
    `gradYear` INTEGER NULL,
    `nationalId` VARCHAR(191) NULL,
    `chipUid` VARCHAR(191) NULL,
    `avatarUrl` TEXT NULL,
    `printedDate` DATETIME(3) NULL,
    `dispatchedDate` DATETIME(3) NULL,
    `issueDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `id_card_orders_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcast_message_templates` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('MESSAGE', 'INVITATION', 'NOTIFICATION') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `channels` JSON NOT NULL,
    `category` VARCHAR(191) NULL,
    `isCustom` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventDate` DATETIME(3) NULL,
    `eventVenue` VARCHAR(191) NULL,
    `rsvpDeadline` DATETIME(3) NULL,
    `allowGuests` BOOLEAN NULL,
    `priority` ENUM('NORMAL', 'URGENT', 'CRITICAL') NULL,
    `actionUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `target_audience_groups` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `color` ENUM('PRIMARY', 'SECONDARY', 'TERTIARY', 'ERROR', 'OUTLINE') NULL,
    `isCustom` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `criteria` JSON NOT NULL,
    `estimatedCount` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `broadcast_records` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('MESSAGE', 'INVITATION', 'NOTIFICATION') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `recipientsCount` INTEGER NOT NULL,
    `audienceLabel` VARCHAR(191) NOT NULL,
    `channels` JSON NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveryRate` VARCHAR(191) NULL,
    `cost` VARCHAR(191) NULL,
    `status` ENUM('DELIVERED', 'DELIVERING', 'SCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
    `eventDate` DATETIME(3) NULL,
    `eventVenue` VARCHAR(191) NULL,
    `rsvpDeadline` DATETIME(3) NULL,
    `priority` ENUM('NORMAL', 'URGENT', 'CRITICAL') NULL,
    `actionUrl` VARCHAR(191) NULL,
    `createdByAdminId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sponsor_banners` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slot` VARCHAR(191) NOT NULL,
    `contract` VARCHAR(191) NOT NULL,
    `monthlyFee` DECIMAL(10, 2) NOT NULL,
    `impressions` VARCHAR(191) NOT NULL DEFAULT '0',
    `clicks` VARCHAR(191) NOT NULL DEFAULT '0',
    `ctr` VARCHAR(191) NOT NULL DEFAULT '0%',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `subscriptionCadence` ENUM('MONTHLY', 'HALF_YEARLY', 'YEARLY') NULL,
    `scheduleStatus` ENUM('ACTIVE', 'SCHEDULED', 'EXPIRED', 'PAUSED') NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `bannerImageUrl` TEXT NULL,
    `targetUrl` TEXT NULL,
    `industry` VARCHAR(191) NULL,
    `dimensions` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `contactTitle` VARCHAR(191) NULL,
    `contactAddress` VARCHAR(191) NULL,
    `contactTaxId` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `invoiceDate` DATETIME(3) NULL,
    `invoiceDueDate` DATETIME(3) NULL,
    `invoiceStatus` ENUM('PAID', 'PENDING', 'OVERDUE') NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,

    UNIQUE INDEX `sponsor_banners_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `refId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `methodColor` ENUM('PRIMARY', 'SECONDARY', 'TERTIARY') NOT NULL DEFAULT 'PRIMARY',
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` ENUM('SLE', 'USD') NOT NULL DEFAULT 'USD',
    `tier` VARCHAR(191) NOT NULL,
    `status` ENUM('SETTLED', 'PENDING', 'RECONCILED') NOT NULL DEFAULT 'PENDING',
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alumniName` VARCHAR(191) NOT NULL,
    `donationId` VARCHAR(191) NULL,

    UNIQUE INDEX `transactions_refId_key`(`refId`),
    UNIQUE INDEX `transactions_donationId_key`(`donationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employer_details` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` TEXT NULL,
    `industry` VARCHAR(191) NOT NULL,
    `headquarters` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NOT NULL,
    `companySize` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `verifiedPartner` BOOLEAN NOT NULL DEFAULT false,
    `partnershipTier` ENUM('PLATINUM_CORPORATE', 'GOLD_CAREER_AFFILIATE', 'UNIVERSITY_CORE_PARTNER', 'SILVER_INDUSTRY_ASSOCIATE') NOT NULL,
    `establishedYear` INTEGER NULL,
    `contactName` VARCHAR(191) NOT NULL,
    `contactTitle` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `contactPhone` VARCHAR(191) NOT NULL,
    `contactLinkedIn` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_job_listings` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `employerId` VARCHAR(191) NULL,
    `location` VARCHAR(191) NOT NULL,
    `workMode` ENUM('ON_SITE', 'HYBRID', 'REMOTE') NULL,
    `type` ENUM('FULL_TIME', 'CONTRACT', 'EXECUTIVE', 'INTERNSHIP') NOT NULL,
    `department` VARCHAR(191) NULL,
    `experienceLevel` VARCHAR(191) NULL,
    `salaryRange` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'REVIEWING', 'SHORTLISTING', 'INTERVIEWING', 'OFFER_EXTENDED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `postedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closingDate` DATETIME(3) NOT NULL,
    `applicantsCount` INTEGER NOT NULL DEFAULT 0,
    `verifiedOnly` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NULL,
    `responsibilities` JSON NULL,
    `requirements` JSON NULL,
    `skillsRequired` JSON NULL,
    `benefits` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_applications` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `alumniUserId` VARCHAR(191) NULL,
    `candidateName` VARCHAR(191) NOT NULL,
    `regNo` VARCHAR(191) NULL,
    `degree` VARCHAR(191) NOT NULL,
    `faculty` VARCHAR(191) NOT NULL,
    `gradYear` INTEGER NOT NULL,
    `avatarUrl` TEXT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `gpa` VARCHAR(191) NULL,
    `status` ENUM('APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED') NOT NULL DEFAULT 'APPLIED',
    `matchScore` INTEGER NOT NULL DEFAULT 0,
    `appliedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `coverNote` TEXT NULL,
    `experienceYears` INTEGER NOT NULL DEFAULT 0,
    `skills` JSON NULL,
    `verifiedAlumnus` BOOLEAN NOT NULL DEFAULT false,
    `interviewDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `selectedDate` DATETIME(3) NULL,
    `offerSalary` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `decisionStatus` ENUM('OFFER_EXTENDED', 'OFFER_ACCEPTED', 'PLACEMENT_CONFIRMED') NULL,
    `recruiterRemarks` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sis_sync_logs` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `node` VARCHAR(191) NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `recordsSynced` INTEGER NOT NULL,
    `status` ENUM('SUCCESS', 'WARNING', 'ERROR') NOT NULL,
    `latencyMs` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log_entries` (
    `id` VARCHAR(191) NOT NULL,
    `displayId` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actorAdminId` VARCHAR(191) NULL,
    `actorName` VARCHAR(191) NOT NULL,
    `actorEmail` VARCHAR(191) NOT NULL,
    `actorRole` VARCHAR(191) NOT NULL,
    `actorAvatar` TEXT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actionLabel` VARCHAR(191) NOT NULL,
    `category` ENUM('SECURITY_RBAC', 'ALUMNI_VERIFICATION', 'SMART_ID_BUREAU', 'OMNICHANNEL_BROADCAST', 'COMMERCIAL_FINANCE', 'SYSTEM_CORE') NOT NULL,
    `target` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NULL,
    `status` ENUM('SUCCESS', 'FLAGGED', 'WARNING', 'BLOCKED_RBAC_VIOLATION') NOT NULL,
    `severity` ENUM('INFO', 'NOTICE', 'WARNING', 'CRITICAL') NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `deviceInfo` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `beforeState` JSON NULL,
    `afterState` JSON NULL,
    `tamperHash` VARCHAR(64) NOT NULL,

    UNIQUE INDEX `audit_log_entries_displayId_key`(`displayId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alumni_members` ADD CONSTRAINT `alumni_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_member_skills` ADD CONSTRAINT `alumni_member_skills_alumniId_fkey` FOREIGN KEY (`alumniId`) REFERENCES `alumni_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leadership_initiatives` ADD CONSTRAINT `leadership_initiatives_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `leadership_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_openings` ADD CONSTRAINT `job_openings_postedByAlumniId_fkey` FOREIGN KEY (`postedByAlumniId`) REFERENCES `alumni_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_openings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `alumni_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_bookmarks` ADD CONSTRAINT `alumni_bookmarks_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_bookmarks` ADD CONSTRAINT `alumni_bookmarks_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `alumni_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_users` ADD CONSTRAINT `admin_users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `admin_role_definitions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_module_permissions` ADD CONSTRAINT `role_module_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `admin_role_definitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alumni_records` ADD CONSTRAINT `alumni_records_alumniUserId_fkey` FOREIGN KEY (`alumniUserId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `id_card_orders` ADD CONSTRAINT `id_card_orders_alumniRecordId_fkey` FOREIGN KEY (`alumniRecordId`) REFERENCES `alumni_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_donationId_fkey` FOREIGN KEY (`donationId`) REFERENCES `donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_job_listings` ADD CONSTRAINT `admin_job_listings_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `employer_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `admin_job_listings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_alumniUserId_fkey` FOREIGN KEY (`alumniUserId`) REFERENCES `alumni_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log_entries` ADD CONSTRAINT `audit_log_entries_actorAdminId_fkey` FOREIGN KEY (`actorAdminId`) REFERENCES `admin_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
