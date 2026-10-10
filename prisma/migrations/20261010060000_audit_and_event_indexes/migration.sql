-- CreateIndex
CREATE INDEX `audit_log_entries_timestamp_idx` ON `audit_log_entries`(`timestamp`);
CREATE INDEX `audit_log_entries_category_idx` ON `audit_log_entries`(`category`);
CREATE INDEX `audit_log_entries_severity_idx` ON `audit_log_entries`(`severity`);
CREATE INDEX `audit_log_entries_status_idx` ON `audit_log_entries`(`status`);

-- CreateIndex
CREATE INDEX `alumni_events_date_idx` ON `alumni_events`(`date`);
CREATE INDEX `alumni_events_featured_idx` ON `alumni_events`(`featured`);
CREATE INDEX `alumni_events_status_idx` ON `alumni_events`(`status`);
