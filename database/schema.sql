-- =======================================================
-- Smart Dan Peti (Smart Donation Box & Trust Management)
-- Database: smart_dan_peti
-- Compatible with MySQL 8.0+ / MariaDB 10.4+
-- =======================================================

CREATE DATABASE IF NOT EXISTS `smart_dan_peti` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_dan_peti`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `system_alerts`;
DROP TABLE IF EXISTS `sankalps`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `cash_emptying_logs`;
DROP TABLE IF EXISTS `pending_detections`;
DROP TABLE IF EXISTS `donations`;
DROP TABLE IF EXISTS `causes`;
DROP TABLE IF EXISTS `smart_boxes`;
DROP TABLE IF EXISTS `devices`;
DROP TABLE IF EXISTS `app_settings`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users & Roles (Trustees, Priests, Auditors, Admins, Operators)
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'TRUSTEE', 'PRIEST', 'AUDITOR', 'OPERATOR', 'DONOR') NOT NULL DEFAULT 'ADMIN',
  `phone` VARCHAR(20) DEFAULT NULL,
  `pan_number` VARCHAR(20) DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Smart Dan Peti Physical Boxes / Devices
CREATE TABLE `smart_boxes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `box_uid` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `status` ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ALERT') NOT NULL DEFAULT 'ONLINE',
  `ip_address` VARCHAR(50) DEFAULT '192.168.1.101',
  `battery_pct` INT NOT NULL DEFAULT 98,
  `current_cash_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fill_percentage` INT NOT NULL DEFAULT 0,
  `weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `max_weight_kg` DECIMAL(6,2) NOT NULL DEFAULT 25.00,
  `tamper_alert` BOOLEAN NOT NULL DEFAULT FALSE,
  `lid_status` ENUM('CLOSED', 'OPEN') NOT NULL DEFAULT 'CLOSED',
  `dual_key_locked` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_emptied_at` DATETIME DEFAULT NULL,
  `last_heartbeat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Causes & Trust Funds
CREATE TABLE `causes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `tagline` VARCHAR(200) DEFAULT NULL,
  `description` TEXT NOT NULL,
  `target_amount` DECIMAL(12,2) NOT NULL DEFAULT 500000.00,
  `collected_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'Heart',
  `badge` VARCHAR(50) DEFAULT 'High Priority',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Donations (Cash & Digital Kiosk/UPI/Card)
CREATE TABLE `donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_number` VARCHAR(50) NOT NULL UNIQUE,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `box_id` INT DEFAULT NULL,
  `cause_id` INT NOT NULL,
  `donor_name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous Devotee',
  `donor_phone` VARCHAR(20) DEFAULT NULL,
  `donor_email` VARCHAR(100) DEFAULT NULL,
  `donor_pan` VARCHAR(20) DEFAULT NULL,
  `donor_address` TEXT DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('UPI_QR', 'CARD', 'NET_BANKING', 'CASH_BOX', 'CHEQUE') NOT NULL,
  `payment_status` ENUM('COMPLETED', 'PENDING', 'FAILED') NOT NULL DEFAULT 'COMPLETED',
  `is_80g_claimed` BOOLEAN NOT NULL DEFAULT FALSE,
  `sankalp_text` TEXT DEFAULT NULL,
  `devotee_gotra` VARCHAR(50) DEFAULT NULL,
  `devotee_nakshatra` VARCHAR(50) DEFAULT NULL,
  `is_anonymous` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`cause_id`) REFERENCES `causes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Pending Detection Review (AI Sensor / Bill Validator / Detection Pipeline)
CREATE TABLE `pending_detections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `box_id` INT NOT NULL,
  `detected_denomination` INT NOT NULL,
  `confidence_score` DECIMAL(4,2) NOT NULL DEFAULT 0.90,
  `sensor_type` VARCHAR(50) NOT NULL DEFAULT 'OPTICAL_SPECTRAL',
  `mode` ENUM('DEMO_SIMULATION', 'LIVE_HARDWARE') NOT NULL DEFAULT 'DEMO_SIMULATION',
  `serial_number_snippet` VARCHAR(50) DEFAULT 'N/A',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `cause_id` INT NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `reviewed_by_user_id` INT DEFAULT NULL,
  `reviewed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cause_id`) REFERENCES `causes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Physical Cash Emptying / Audit Logs (Dual Authentication)
CREATE TABLE `cash_emptying_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `box_id` INT NOT NULL,
  `emptied_by_user1_id` INT NOT NULL,
  `emptied_by_user2_id` INT NOT NULL,
  `amount_collected` DECIMAL(12,2) NOT NULL,
  `seal_bag_number` VARCHAR(100) NOT NULL,
  `weight_before_kg` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `verified_by_auditor` BOOLEAN NOT NULL DEFAULT TRUE,
  `notes` TEXT DEFAULT NULL,
  `emptied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`emptied_by_user1_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`emptied_by_user2_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Expenses & Fund Transparency
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cause_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `vendor_name` VARCHAR(150) DEFAULT NULL,
  `invoice_number` VARCHAR(100) DEFAULT NULL,
  `approved_by_user_id` INT DEFAULT NULL,
  `date_incurred` DATE NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cause_id`) REFERENCES `causes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Devotee Sankalps & Special Prayers
CREATE TABLE `sankalps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donation_id` INT DEFAULT NULL,
  `devotee_name` VARCHAR(100) NOT NULL,
  `gotra` VARCHAR(50) DEFAULT NULL,
  `nakshatra` VARCHAR(50) DEFAULT NULL,
  `prayer_intent` TEXT NOT NULL,
  `status` ENUM('RECEIVED', 'OFFERED_IN_POOJA', 'COMPLETED') NOT NULL DEFAULT 'RECEIVED',
  `priest_remarks` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Real-time IoT & System Alerts
CREATE TABLE `system_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `box_id` INT DEFAULT NULL,
  `alert_type` ENUM('TAMPER_DETECTED', 'BOX_FULL', 'WEIGHT_ANOMALY', 'LID_FORCED', 'LOW_BATTERY', 'OFFLINE', 'SYSTEM_INFO') NOT NULL,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `message` TEXT NOT NULL,
  `is_resolved` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`box_id`) REFERENCES `smart_boxes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Audit Logs
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `user_name` VARCHAR(100) NOT NULL DEFAULT 'System Admin',
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(50) DEFAULT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Application & Trust Settings
CREATE TABLE `app_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `trust_name` VARCHAR(150) NOT NULL DEFAULT 'Sri Maha Mandir Trust',
  `tax_80g_number` VARCHAR(100) NOT NULL DEFAULT 'AAATS1234F/80G/2022-23',
  `upi_vpa` VARCHAR(100) NOT NULL DEFAULT 'smartdanpeti@upi',
  `weight_threshold_kg` DECIMAL(6,2) NOT NULL DEFAULT 20.00,
  `fill_alert_pct` INT NOT NULL DEFAULT 85,
  `demo_mode_enabled` BOOLEAN NOT NULL DEFAULT 1,
  `auto_approve_threshold` DECIMAL(4,2) NOT NULL DEFAULT 0.98,
  `currency_symbol` VARCHAR(10) NOT NULL DEFAULT '₹',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- INITIAL SEED DATA
-- =======================================================

-- Users (Demo accounts: password is 'admin123' for all)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `pan_number`) VALUES
(1, 'Srikanth Ramanathan', 'admin@smartdanpeti.org', '$2a$10$tZ2c6k91E5a7qjImsdKqee78F3R1W02cWz96i1z6d3aK3kKx9sX3.', 'ADMIN', '+91 98765 43210', 'ABCDE1234F'),
(2, 'Mahant Aniruddha Das', 'trustee@smartdanpeti.org', '$2a$10$tZ2c6k91E5a7qjImsdKqee78F3R1W02cWz96i1z6d3aK3kKx9sX3.', 'TRUSTEE', '+91 98765 43211', 'TRUST9876G'),
(3, 'Pandit Radheshyam', 'priest@smartdanpeti.org', '$2a$10$tZ2c6k91E5a7qjImsdKqee78F3R1W02cWz96i1z6d3aK3kKx9sX3.', 'PRIEST', '+91 98765 43212', 'PRIEST123H'),
(4, 'Suresh K. Auditor', 'auditor@smartdanpeti.org', '$2a$10$tZ2c6k91E5a7qjImsdKqee78F3R1W02cWz96i1z6d3aK3kKx9sX3.', 'AUDITOR', '+91 98765 43213', 'AUDIT4567J'),
(5, 'Sunil Sharma', 'operator@smartdanpeti.org', '$2a$10$tZ2c6k91E5a7qjImsdKqee78F3R1W02cWz96i1z6d3aK3kKx9sX3.', 'OPERATOR', '+91 98765 43214', 'OPERA1234K');

-- Smart Dan Peti Boxes deployed in temple & campus
INSERT INTO `smart_boxes` (`id`, `box_uid`, `name`, `location`, `status`, `ip_address`, `battery_pct`, `current_cash_amount`, `fill_percentage`, `weight_kg`, `max_weight_kg`, `tamper_alert`, `lid_status`, `dual_key_locked`, `last_emptied_at`, `last_heartbeat`) VALUES
(1, 'SDP-SANCTUM-01', 'Sanctum Sanctorum Dan Peti', 'Main Temple Garbhagriha Inner Sanctum', 'ONLINE', '192.168.1.101', 99, 48500.00, 72, 18.20, 25.00, 0, 'CLOSED', 1, '2026-10-18 20:00:00', NOW()),
(2, 'SDP-EASTGATE-02', 'East Gopuram Entrance Kiosk', 'East Gate Pilgrim Footpath & Queue', 'ONLINE', '192.168.1.102', 94, 26800.00, 48, 11.50, 25.00, 0, 'CLOSED', 1, '2026-10-19 18:30:00', NOW()),
(3, 'SDP-ANNADAN-03', 'Annakshetra Dining Hall Box', 'Annadanam Kitchen & Devotee Prasad Hall', 'ONLINE', '192.168.1.103', 88, 34250.00, 60, 14.80, 25.00, 0, 'CLOSED', 1, '2026-10-19 19:15:00', NOW()),
(4, 'SDP-GOSHALA-04', 'Sri Krishna Goshala Box', 'Goshala Cow Sanctuary & Fodder Gate', 'ONLINE', '192.168.1.104', 92, 19400.00, 35, 8.40, 25.00, 0, 'CLOSED', 1, '2026-10-17 17:00:00', NOW());

-- Causes & Charity Funds
INSERT INTO `causes` (`id`, `name`, `code`, `tagline`, `description`, `target_amount`, `collected_amount`, `icon`, `badge`, `is_active`) VALUES
(1, 'Annadanam - Free Meals for Devotees', 'ANNADANAM', 'Feed 5,000+ hungry devotees & pilgrims daily with sanctified pure sattvic meals', 'Daily community kitchen serving piping hot, nourishing vegetarian prasad to every visitor regardless of caste, creed, or background.', 1000000.00, 684500.00, 'Utensils', 'Highest Devotion', 1),
(2, 'Temple Heritage & Sanctum Renovation', 'RENOVATION', 'Preserving centuries-old stone architecture, sacred carvings, and heritage gopuram', 'Structural reinforcement, traditional lime-mortar restoration, gold gilding of the sacred Kalash, and marble flooring preservation.', 2500000.00, 1890000.00, 'Landmark', 'Heritage Trust', 1),
(3, 'Goshala - Sacred Cow Care & Fodder', 'GOSHALA', 'Shelter, medical veterinary care, and nutritious green fodder for 350+ indigenous cows', 'Protecting native Indian cattle breeds with dedicated shelters, green grazing fields, clean drinking water ponds, and 24x7 vet support.', 750000.00, 492000.00, 'HeartHandshake', 'Sacred Seva', 1),
(4, 'Vidyadhanam - Veda Patashala & Child Education', 'VIDYADHANAM', 'Free gurukul education, Vedic recitation, school uniforms & modern science textbooks', 'Supporting underprivileged children and traditional students with boarding, lodging, computer education, and Vedic scriptures.', 600000.00, 385000.00, 'GraduationCap', 'Bright Future', 1),
(5, 'Daily Deepam & Temple Pooja Seva', 'POOJA_SEVA', 'Daily oil lamps, pure desi ghee, sacred flowers, and aromatic camphor for archana', 'Supporting uninterrupted daily morning Suprabhatam, noon Bhog, evening Maha Aarti, and Akhanda Jyoti oil lamps.', 300000.00, 215000.00, 'Flame', 'Pious Offering', 1);

-- Sample Donations (Digital & Cash)
INSERT INTO `donations` (`id`, `receipt_number`, `transaction_id`, `box_id`, `cause_id`, `donor_name`, `donor_phone`, `donor_email`, `donor_pan`, `amount`, `payment_method`, `payment_status`, `is_80g_claimed`, `sankalp_text`, `devotee_gotra`, `is_anonymous`, `created_at`) VALUES
(1, 'SDP-REC-20261020-0001', 'UPI-TXN-9842109841', 2, 1, 'Rameshwar Sharma', '+91 98234 56789', 'rameshwar.s@example.com', 'AABCS1234F', 5100.00, 'UPI_QR', 'COMPLETED', 1, 'For family health, well-being, and longevity of parents.', 'Kashyapa', 0, '2026-10-20 09:15:22'),
(2, 'SDP-REC-20261020-0002', 'CASH-AUTO-9842109842', 1, 1, 'Devotee of Lord', NULL, NULL, NULL, 500.00, 'CASH_BOX', 'COMPLETED', 0, 'Pranam to Sri Bhagavan.', NULL, 1, '2026-10-20 09:45:10'),
(3, 'SDP-REC-20261020-0003', 'CARD-TXN-9842109843', 2, 3, 'Kavitha Natarajan', '+91 94451 88992', 'kavitha.n@example.com', 'BNMPK9942R', 11000.00, 'CARD', 'COMPLETED', 1, 'Goshala fodder seva on the occasion of daughter\'s birthday.', 'Bharadwaja', 0, '2026-10-20 10:30:45'),
(4, 'SDP-REC-20261020-0004', 'UPI-TXN-9842109844', 3, 1, 'Amitabh Sengupta', '+91 98112 34567', 'amitabh.sen@example.com', 'CCDPS4455Q', 2500.00, 'UPI_QR', 'COMPLETED', 1, 'Sponsorship of 1 day morning breakfast prasad.', 'Vashishta', 0, '2026-10-20 11:12:00'),
(5, 'SDP-REC-20261020-0005', 'CASH-AUTO-9842109845', 1, 2, 'Devotee from Varanasi', NULL, NULL, NULL, 2000.00, 'CASH_BOX', 'COMPLETED', 0, 'Temple stone carving donation.', NULL, 1, '2026-10-20 11:50:18'),
(6, 'SDP-REC-20261020-0006', 'NET-TXN-9842109846', NULL, 4, 'Dr. Sunita Deshmukh', '+91 97654 32190', 'sunita.doc@example.com', 'ABMPD1122K', 21000.00, 'NET_BANKING', 'COMPLETED', 1, 'Annual education scholarship for 5 Veda students.', 'Gargya', 0, '2026-10-20 12:20:30'),
(7, 'SDP-REC-20261020-0007', 'UPI-TXN-9842109847', 4, 3, 'Vijay & Meena Patel', '+91 99201 44556', 'vpatel@example.com', 'AHJPP6677T', 5000.00, 'UPI_QR', 'COMPLETED', 1, 'Gau Seva & health recovery prayers.', 'Shandilya', 0, '2026-10-20 13:05:14'),
(8, 'SDP-REC-20261020-0008', 'CASH-AUTO-9842109848', 3, 1, 'Anonymous Devotee', NULL, NULL, NULL, 1000.00, 'CASH_BOX', 'COMPLETED', 0, NULL, NULL, 1, '2026-10-20 14:10:00'),
(9, 'SDP-REC-20261020-0009', 'UPI-TXN-9842109849', 1, 5, 'Rajesh K. Aggarwal', '+91 98100 99887', 'rajesh.agg@example.com', 'AKLPA8899Z', 2100.00, 'UPI_QR', 'COMPLETED', 1, 'Maha Aarti Ghee Lamp offering for Deepotsav.', 'Agastya', 0, '2026-10-20 14:40:25'),
(10, 'SDP-REC-20261020-0010', 'UPI-TXN-9842109850', 2, 2, 'Srinivasan Iyer', '+91 98401 22334', 'srini.iyer@example.com', 'APPSI5566M', 15000.00, 'UPI_QR', 'COMPLETED', 1, 'Golden Kalash renovation contribution.', 'Kaundinya', 0, '2026-10-20 15:15:50');

-- Pending Detections (Demo Detection Mode)
INSERT INTO `pending_detections` (`id`, `box_id`, `detected_denomination`, `confidence_score`, `sensor_type`, `mode`, `serial_number_snippet`, `status`, `cause_id`, `notes`) VALUES
(1, 1, 500, 0.96, 'OPTICAL_SPECTRAL', 'DEMO_SIMULATION', '4AA 892301', 'PENDING', 1, 'Crisp Mahatma Gandhi series ₹500 note. UV and magnetic thread verified.'),
(2, 2, 200, 0.74, 'OPTICAL_SPECTRAL', 'DEMO_SIMULATION', '9BK 104592', 'PENDING', 3, 'Slight fold on top-right watermark corner. Confidence score 74%. Requires human review.'),
(3, 1, 500, 0.98, 'OPTICAL_SPECTRAL', 'DEMO_SIMULATION', '7CR 654928', 'PENDING', 2, 'Clean high confidence ₹500 insertion at Sanctum box.'),
(4, 3, 100, 0.65, 'THICKNESS_SPECTRAL', 'DEMO_SIMULATION', '2DP 881204', 'PENDING', 1, 'Lavender ₹100 note. Minor ink mark detected near governor signature.'),
(5, 4, 50, 0.92, 'OPTICAL_SPECTRAL', 'DEMO_SIMULATION', '3ES 491022', 'PENDING', 3, 'Fluorescent blue ₹50 note deposited at Goshala box.');

-- Sample Transparent Expenses
INSERT INTO `expenses` (`id`, `cause_id`, `title`, `category`, `amount`, `vendor_name`, `invoice_number`, `approved_by_user_id`, `date_incurred`, `notes`) VALUES
(1, 1, 'Supply of 1,200 kg Sona Masoori Rice & Toor Dal', 'Groceries & Provisions', 72000.00, 'Sri Lakshmi Agro Traders', 'INV-AGRO-2026-881', 1, '2026-10-15', 'Procured for 10-day Annadanam continuous community meal feast.'),
(2, 3, 'Purchase of 8 Metric Tonnes Green Fodder & Cattle Feed', 'Fodder & Nutrition', 44000.00, 'Kisan Agro Dairy Coop', 'INV-FODDER-992', 2, '2026-10-16', 'Direct delivery to Sri Krishna Goshala for 350 cows.'),
(3, 2, 'Granite Stone Hand Carving Artisans Fortnightly Honorarium', 'Artisan Wages', 95000.00, 'Silpa Kala Mandapam Guild', 'VCH-GUILD-104', 1, '2026-10-17', 'Sculpting decorative pillars for outer circumambulation hall.'),
(4, 4, 'Annual Printing of 400 Vedic Chant Books & School Bags', 'Educational Supplies', 32500.00, 'Vidya Bharati Printers', 'INV-PRINT-4501', 1, '2026-10-18', 'Distributed to newly enrolled students at Veda Patashala.'),
(5, 5, 'Pure Desi Cow Ghee (150 Litres) & Camphor for Sanctum', 'Ritual Offerings', 82500.00, 'Amrutha Goshala Organics', 'INV-GHEE-309', 3, '2026-10-19', 'Used for uninterrupted Akhand Jyoti lamps and daily Maha Aarti.');

-- Sample Sankalps
INSERT INTO `sankalps` (`id`, `donation_id`, `devotee_name`, `gotra`, `nakshatra`, `prayer_intent`, `status`, `priest_remarks`) VALUES
(1, 1, 'Rameshwar Sharma', 'Kashyapa', 'Rohini', 'Prayers for father\'s speedy recovery and global peace.', 'OFFERED_IN_POOJA', 'Special archana performed during noon Mahapooja with Bilva leaves.'),
(2, 3, 'Kavitha Natarajan', 'Bharadwaja', 'Swati', 'Success in daughter Ananya\'s higher medical entrance exams.', 'RECEIVED', 'Scheduled for Tuesday morning Navagraha abhishekam.'),
(3, 7, 'Vijay Patel', 'Shandilya', 'Pushya', 'Family prosperity, healthy newborn baby blessings.', 'COMPLETED', 'Blessed with consecrated Raksha sutra and sacred vermillion prasad.');

-- Sample System Alerts
INSERT INTO `system_alerts` (`id`, `box_id`, `alert_type`, `severity`, `message`, `is_resolved`) VALUES
(1, 1, 'BOX_FULL', 'HIGH', 'Sanctum Dan Peti has reached 72% capacity (18.2 kg). Schedule dual-key emptying soon.', 0),
(2, 4, 'SYSTEM_INFO', 'LOW', 'Sri Krishna Goshala Box firmware updated to v2.4 successfully over OTA.', 1);

-- Sample Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`) VALUES
(1, 1, 'Srikanth Ramanathan', 'USER_LOGIN', 'AUTH', '1', 'Admin signed in successfully from local console.', '127.0.0.1'),
(2, 4, 'Suresh K. Auditor', 'DETECTION_APPROVED', 'DETECTION', '29', 'Manually verified and confirmed ₹500 banknote at East Gopuram kiosk.', '192.168.1.15'),
(3, 2, 'Mahant Aniruddha Das', 'DUAL_KEY_VERIFICATION', 'SMART_BOX', '1', 'Pre-authorization token granted for Sanctum Dan Peti weekend clearance.', '192.168.1.20'),
(4, 1, 'Srikanth Ramanathan', 'THRESHOLD_UPDATE', 'SETTINGS', '1', 'Updated weight alert threshold to 20.0 kg for safety compliance.', '127.0.0.1');

-- App Settings
INSERT INTO `app_settings` (`id`, `trust_name`, `tax_80g_number`, `upi_vpa`, `weight_threshold_kg`, `fill_alert_pct`, `demo_mode_enabled`, `auto_approve_threshold`, `currency_symbol`) VALUES
(1, 'Sri Maha Mandir Trust', 'AAATS1234F/80G/2022-23', 'smartdanpeti@upi', 20.00, 85, 1, 0.98, '₹')
ON DUPLICATE KEY UPDATE `trust_name`=VALUES(`trust_name`);
