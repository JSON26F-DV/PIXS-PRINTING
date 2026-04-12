-- ============================================================================
-- PIXS Database Sanitization Script
-- Converts latin1_swedish_ci → utf8mb4_unicode_ci + Bcrypt password rehash
-- Run via phpMyAdmin or MySQL CLI: mysql -u root pixs_db < convert_utf8mb4.sql
-- ============================================================================

-- ─── Step 1: Convert DATABASE default charset ───
ALTER DATABASE `pixs_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Step 2: Convert ALL latin1 tables to utf8mb4 ───
ALTER TABLE `cart_items` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `cart_item_colors` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `categories` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `colors` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `customers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `customer_addresses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `customer_contact_numbers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `customer_discounts` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `customer_payment_methods` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `deleted_accounts` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `employees` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `employee_addresses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `employee_attendance` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `employee_contact_numbers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `employee_weekly_salary` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `inventory_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `marketing_promotions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `orders` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `order_items` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `order_item_colors` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `production_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `products` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `product_gallery` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `product_tags` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `product_variants` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `screenplates` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `screenplate_compatibility` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `screenplate_incompatible` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Tables already utf8mb4 (no conversion needed):
-- conversations, conversation_participants, messages, message_attachments, message_reactions

-- ─── Step 3: Ensure password columns are VARCHAR(255) ───
ALTER TABLE `customers` MODIFY `password` VARCHAR(255) NULL;
ALTER TABLE `employees` MODIFY `password` VARCHAR(255) NOT NULL;
ALTER TABLE `deleted_accounts` MODIFY `password` VARCHAR(255) NOT NULL;

-- ─── Step 4: Re-hash ALL passwords to Bcrypt("password123") ───
-- Generated via PHP: echo password_hash('password123', PASSWORD_BCRYPT, ['cost' => 12]);
-- ⚠️  Replace the hash below with a fresh one from your PHP environment:
--     php -r "echo password_hash('password123', PASSWORD_BCRYPT, ['cost' => 12]);"
SET @bcrypt_hash = '$2y$12$YourGeneratedHashHere';

-- IMPORTANT: Run this PHP command first, then paste the result above:
-- php -r "echo password_hash('password123', PASSWORD_BCRYPT, ['cost' => 12]) . PHP_EOL;"

UPDATE `customers` SET `password` = @bcrypt_hash;
UPDATE `employees` SET `password` = @bcrypt_hash;
UPDATE `deleted_accounts` SET `password` = @bcrypt_hash;

-- ─── Verification Queries ───
-- Check that no tables remain on latin1:
SELECT TABLE_NAME, TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'pixs_db'
ORDER BY TABLE_NAME;

-- Check that all passwords now start with $2y$:
SELECT id, LEFT(password, 10) AS password_prefix FROM customers;
SELECT id, LEFT(password, 10) AS password_prefix FROM employees;
SELECT id, LEFT(password, 10) AS password_prefix FROM deleted_accounts;
