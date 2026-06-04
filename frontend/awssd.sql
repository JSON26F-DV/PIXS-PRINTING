-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 02, 2026 at 03:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pixs_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-068af5d29715c229a06b304fd958287f', 'i:1;', 1779959063),
('laravel-cache-068af5d29715c229a06b304fd958287f:timer', 'i:1779959063;', 1779959063),
('laravel-cache-1f115e722bb667e1ffca6a05207f803c', 'i:11;', 1779337060),
('laravel-cache-1f115e722bb667e1ffca6a05207f803c:timer', 'i:1779337060;', 1779337060),
('laravel-cache-4fb3e67cc20ab70a8c45eab112dadbeb', 'i:1;', 1779959063),
('laravel-cache-4fb3e67cc20ab70a8c45eab112dadbeb:timer', 'i:1779959063;', 1779959063),
('laravel-cache-5210a5ff37c1adf5db1b3c6d03bff28b', 'i:5;', 1780325151),
('laravel-cache-5210a5ff37c1adf5db1b3c6d03bff28b:timer', 'i:1780325151;', 1780325151),
('laravel-cache-89c1b6e2d4c95f26e22786f4a7c37ef9', 'i:3;', 1779337060),
('laravel-cache-89c1b6e2d4c95f26e22786f4a7c37ef9:timer', 'i:1779337060;', 1779337060),
('laravel-cache-a75f3f172bfb296f2e10cbfc6dfc1883', 'i:8;', 1780325151),
('laravel-cache-a75f3f172bfb296f2e10cbfc6dfc1883:timer', 'i:1780325151;', 1780325151);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` varchar(100) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `variant_id` varchar(30) NOT NULL,
  `screenplate_id` varchar(20) DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plate_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cart_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `selected` tinyint(1) NOT NULL DEFAULT 0,
  `temp` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `customer_id`, `product_id`, `variant_id`, `screenplate_id`, `quantity`, `unit_price`, `plate_price`, `total_cart_price`, `selected`, `temp`, `created_at`) VALUES
('P001__V-PPY-16OZ__C005-C006__SP-FLAT-001', 'CUST-503', 'P001', 'V-PPY-16OZ', 'SP-FLAT-001', 100, 2.95, 0.00, 295.00, 0, 0, '2026-05-31 23:20:56');

-- --------------------------------------------------------

--
-- Table structure for table `cart_item_colors`
--

CREATE TABLE `cart_item_colors` (
  `id` int(10) UNSIGNED NOT NULL,
  `cart_item_id` varchar(100) NOT NULL,
  `color_id` varchar(10) NOT NULL,
  `channel_label` enum('Primary','Secondary','Accent') NOT NULL DEFAULT 'Primary',
  `channel_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_item_colors`
--

INSERT INTO `cart_item_colors` (`id`, `cart_item_id`, `color_id`, `channel_label`, `channel_order`) VALUES
(139, 'P001__V-PPY-16OZ__C005-C006__SP-FLAT-001', 'C005', 'Primary', 0),
(140, 'P001__V-PPY-16OZ__C005-C006__SP-FLAT-001', 'C006', 'Secondary', 1);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(10) NOT NULL,
  `label` varchar(100) NOT NULL,
  `count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `label`, `count`, `image`) VALUES
('CT001', 'Milktea Cup', 6, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80'),
('CT002', 'Lid 2', 4, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80'),
('CT003', 'Accessories', 1, 'paper-bowl_1779920061_6a176cbd5b1e5.webp'),
('CT004', 'Paper Bowl', 1, 'paper-bowl_1779920061_6a176cbd5b1e5.webp'),
('CT005', 'Paper Cup', 1, 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80'),
('CT006', 'Meal Box', 6, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80');

-- --------------------------------------------------------

--
-- Table structure for table `colors`
--

CREATE TABLE `colors` (
  `id` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `hex` varchar(7) NOT NULL,
  `type` enum('Standard','Premium') NOT NULL DEFAULT 'Standard'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `colors`
--

INSERT INTO `colors` (`id`, `name`, `hex`, `type`) VALUES
('C001', 'Deep Mint', '#75EEA5', 'Standard'),
('C002', 'Electric Blue', '#4A90E2', 'Standard'),
('C003', 'Lava Red', '#E74C3C', 'Standard'),
('C004', 'Matte Black', '#2C3E50', 'Premium'),
('C005', 'Pearl White', '#FDFEFE', 'Standard'),
('C006', 'Gold Leaf', '#D4AF37', 'Premium');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` varchar(50) NOT NULL,
  `last_message_id` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `last_message_id`, `created_at`, `updated_at`) VALUES
('1_2', NULL, '2026-05-31 06:34:01', '2026-05-31 06:34:01'),
('1_CUST-501', NULL, '2026-05-19 22:23:12', '2026-05-19 22:23:12'),
('1_CUST-502', NULL, '2026-05-31 06:50:11', '2026-05-31 06:50:11'),
('1_CUST-503', NULL, '2026-05-20 08:07:09', '2026-05-20 08:07:09'),
('2_1', NULL, '2026-06-01 10:25:31', '2026-06-01 10:25:31'),
('CUST-503_1', NULL, '2026-05-17 09:55:47', '2026-05-17 09:55:47');

-- --------------------------------------------------------

--
-- Table structure for table `conversation_participants`
--

CREATE TABLE `conversation_participants` (
  `id` int(10) UNSIGNED NOT NULL,
  `conversation_id` varchar(50) NOT NULL,
  `participant_id` varchar(20) NOT NULL,
  `participant_type` enum('employee','customer') NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `age` tinyint(3) UNSIGNED DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `total_orders_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `orders` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `first_name`, `last_name`, `profile_picture`, `email`, `role`, `status`, `age`, `gender`, `company_name`, `password`, `total_orders_value`, `orders`, `google_id`, `facebook_id`, `date_created`, `last_login`) VALUES
('CUST-501', 'Juan', 'Dela Cruz', 'https://i.pravatar.cc/300?img=14', 'juan@example.com', 'customer', 'active', 35, 'male', 'Juan\'s Sari-Sari', '$2y$12$dRfM5y2YBJDwW9smfzze8em9mXNJM5fPQggUhAbIMTEGlhcn1AeTW', 15450.50, 12, NULL, NULL, '2024-05-12 14:20:00', '2026-03-27 11:00:00'),
('CUST-502', 'Laguna', 'Prints', 'https://i.pravatar.cc/300?img=15', 'info@lagunaprints.com', 'customer', 'active', 42, 'female', 'Laguna Prints & Design', '$2y$12$dRfM5y2YBJDwW9smfzze8em9mXNJM5fPQggUhAbIMTEGlhcn1AeTW', 85200.00, 45, NULL, NULL, '2024-06-20 11:45:00', '2026-03-28 09:30:00'),
('CUST-503', 'jason', 'begornia2', 'profile_CUST-503_1779181704.jpg', 'jasonbegornia57@gmail.com', 'customer', 'active', 21, 'female', 'Ligma Shop', '$2y$12$dRfM5y2YBJDwW9smfzze8em9mXNJM5fPQggUhAbIMTEGlhcn1AeTW', 22000.85, 13, NULL, NULL, '2026-04-12 01:07:22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_addresses`
--

CREATE TABLE `customer_addresses` (
  `id` varchar(20) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `adress_label` varchar(255) NOT NULL,
  `contact_number` varchar(30) NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_addresses`
--

INSERT INTO `customer_addresses` (`id`, `customer_id`, `adress_label`, `contact_number`, `region`, `province`, `city`, `barangay`, `street`, `postal_code`, `is_default`) VALUES
('ADDR-003', 'CUST-503', 'bella vista', '+639945646355', 'Cordillera Administrative Region', 'Apayao', 'Conner', 'Banban', 'aws', '4017', 1);

-- --------------------------------------------------------

--
-- Table structure for table `customer_contact_numbers`
--

CREATE TABLE `customer_contact_numbers` (
  `id` int(10) UNSIGNED NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `number` varchar(30) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_contact_numbers`
--

INSERT INTO `customer_contact_numbers` (`id`, `customer_id`, `number`, `is_default`) VALUES
(5, 'CUST-503', '+639945646355', 1),
(6, 'CUST-503', '+639123423232', 0);

-- --------------------------------------------------------

--
-- Table structure for table `customer_discounts`
--

CREATE TABLE `customer_discounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `discount_id` varchar(20) NOT NULL,
  `type` enum('unit','percentage','fixed') NOT NULL,
  `value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `product_id` varchar(20) DEFAULT NULL,
  `remaining_uses` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `is_one_time` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `status` enum('active','used','expired') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_payment_methods`
--

CREATE TABLE `customer_payment_methods` (
  `id` varchar(20) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `type` enum('bank','ewallet','credit_card','cod') NOT NULL,
  `masked_number` varchar(30) NOT NULL,
  `gateway_token` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `provider` varchar(100) DEFAULT NULL,
  `bank_name` enum('BDO','BPI','Metrobank','Landbank','Unionbank','Security Bank','Chinabank','RCBC','EastWest','PNB','Other') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_payment_methods`
--

INSERT INTO `customer_payment_methods` (`id`, `customer_id`, `type`, `masked_number`, `gateway_token`, `is_default`, `created_at`, `updated_at`, `provider`, `bank_name`) VALUES
('PAY-50239', 'CUST-503', 'bank', '•••••••6355', NULL, 0, '2026-05-29 05:37:09', '2026-05-29 05:37:09', NULL, 'BDO'),
('PAY-81816', 'CUST-503', 'credit_card', '••••••••••6543', NULL, 0, '2026-05-29 05:37:09', '2026-05-29 05:37:09', 'Visa', NULL),
('PAY-91219', 'CUST-503', 'ewallet', '•••••••6355', NULL, 1, '2026-05-29 05:37:09', '2026-05-29 05:37:09', 'GCash', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `deleted_accounts`
--

CREATE TABLE `deleted_accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `original_id` varchar(20) NOT NULL,
  `account_type` enum('employee','customer') NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `deleted_by` varchar(20) NOT NULL,
  `deleted_by_type` enum('employee','customer') NOT NULL DEFAULT 'employee',
  `reason` text DEFAULT NULL,
  `deleted_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_methods`
--

CREATE TABLE `delivery_methods` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `delivery_methods`
--

INSERT INTO `delivery_methods` (`id`, `name`) VALUES
('del_001', 'Lalamove'),
('del_002', 'J&T Express'),
('del_003', 'Store Pickup/Self-Book');

-- --------------------------------------------------------

--
-- Table structure for table `discounts`
--

CREATE TABLE `discounts` (
  `id` varchar(30) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `customer_id` varchar(20) DEFAULT NULL,
  `product_id` varchar(10) DEFAULT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `code` varchar(20) DEFAULT NULL,
  `type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `value` decimal(10,2) NOT NULL,
  `min_spend` decimal(10,2) NOT NULL DEFAULT 0.00,
  `already_used` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `discounts`
--

INSERT INTO `discounts` (`id`, `title`, `customer_id`, `product_id`, `variant_id`, `code`, `type`, `value`, `min_spend`, `already_used`, `expires_at`, `created_at`) VALUES
('DISC001', NULL, 'CUST-503', 'P001', 'V-PPY-12OZ', '', 'fixed', 1232.00, 212.00, 1, '2026-05-29 06:15:19', NULL),
('DISC002', NULL, 'CUST-502', 'P008', NULL, '12321322', 'fixed', 122.00, 20.00, 0, '2026-05-29 06:15:19', NULL),
('DISC003', NULL, NULL, 'P003', NULL, NULL, 'fixed', 3214.00, 0.00, 0, NULL, NULL),
('dsc_LuA7FMznq2', 'Ligma', NULL, NULL, NULL, 'GLOBALFDF6', 'fixed', 50.00, 100.00, 1, '2026-06-29 15:06:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('admin','staff','technician','inventory') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `age` tinyint(3) UNSIGNED DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `total_orders_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL,
  `allowed_categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowed_categories`)),
  `allowed_products` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowed_products`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `first_name`, `last_name`, `profile_picture`, `email`, `role`, `status`, `age`, `gender`, `company_name`, `password`, `total_orders_value`, `daily_rate`, `date_created`, `last_login`, `allowed_categories`, `allowed_products`) VALUES
('1', 'Jason', 'Cruz', 'profile1.jpg', 'admin@gmail.com', 'admin', 'active', 25, 'male', 'Tech Solutions Inc', '$2y$12$dRfM5y2YBJDwW9smfzze8em9mXNJM5fPQggUhAbIMTEGlhcn1AeTW', 15000.50, 1200.00, '2026-05-17 08:30:00', '2026-05-17 10:15:00', NULL, NULL),
('2', 'Jason', 'Nadarang', 'profile1.jpg', 'admin2@gmail.com', 'inventory', 'active', 23, 'male', 'Tech Solutions Inc', '$2y$12$dRfM5y2YBJDwW9smfzze8em9mXNJM5fPQggUhAbIMTEGlhcn1AeTW', 15000.50, 1200.00, '2026-05-17 08:30:00', '2026-05-17 10:15:00', '[]', '[]');

-- --------------------------------------------------------

--
-- Table structure for table `employee_addresses`
--

CREATE TABLE `employee_addresses` (
  `id` varchar(20) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_attendance`
--

CREATE TABLE `employee_attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `break_start` time DEFAULT NULL,
  `break_end` time DEFAULT NULL,
  `status` enum('pending','full','half','present','absent','holiday') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_nopad_ci NOT NULL DEFAULT 'pending',
  `overtime` decimal(4,2) NOT NULL DEFAULT 0.00,
  `late` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `hours_worked` decimal(4,2) NOT NULL DEFAULT 0.00,
  `total_earnings` decimal(10,2) NOT NULL DEFAULT 0.00,
  `holiday_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_paid` tinyint(1) NOT NULL DEFAULT 0,
  `holiday_type` enum('none','regular','special_work','non_working') DEFAULT 'none'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_attendance`
--

INSERT INTO `employee_attendance` (`id`, `employee_id`, `date`, `start_time`, `end_time`, `break_start`, `break_end`, `status`, `overtime`, `late`, `hours_worked`, `total_earnings`, `holiday_pay`, `is_paid`, `holiday_type`) VALUES
(40, '1', '2026-05-30', '22:44:00', '22:44:00', '22:44:00', '22:44:00', 'full', 0.00, 0, 8.00, 1200.00, 0.00, 1, 'none'),
(47, '1', '2026-06-01', '17:28:00', '17:28:00', '17:28:00', '17:28:00', 'full', 0.00, 0, 8.00, 1200.00, 0.00, 0, 'none'),
(48, '2', '2026-06-01', '17:28:00', '17:28:00', '17:28:00', '17:28:00', 'full', 0.00, 0, 8.00, 1200.00, 0.00, 0, 'none');

-- --------------------------------------------------------

--
-- Table structure for table `employee_contact_numbers`
--

CREATE TABLE `employee_contact_numbers` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `number` varchar(30) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_contact_numbers`
--

INSERT INTO `employee_contact_numbers` (`id`, `employee_id`, `number`, `is_default`) VALUES
(1, '1', '09945646355', 1);

-- --------------------------------------------------------

--
-- Table structure for table `expenditures`
--

CREATE TABLE `expenditures` (
  `id` int(10) UNSIGNED NOT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `category` enum('Employee Salaries','Raw Materials / Products','Utilities','Office / Operational Expenses','Extra / Miscellaneous Expenses','Others') NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenditures`
--

INSERT INTO `expenditures` (`id`, `variant_id`, `category`, `amount`, `description`, `created_at`) VALUES
(1, NULL, 'Others', 100.00, 'ligma', '2026-05-30 00:16:35'),
(2, NULL, 'Employee Salaries', 3600.00, 'Payroll for Jason Cruz (2026-05-28 to 2026-05-30)', '2026-05-30 00:51:12'),
(3, NULL, 'Employee Salaries', 600.00, 'Payroll for Jason Cruz (2026-05-27)', '2026-05-30 00:54:29'),
(4, NULL, 'Employee Salaries', 600.00, 'Payroll for Jason Cruz (2026-05-27)', '2026-05-30 01:07:46'),
(10, NULL, 'Employee Salaries', 1200.00, 'Salary for Jason Cruz on 2026-05-30', '2026-05-30 06:46:25'),
(11, NULL, 'Employee Salaries', 600.00, 'Salary for Jason Nadarang on 2026-05-30', '2026-05-30 06:46:25'),
(13, 'V-PPY-22OZ', 'Raw Materials / Products', 1625.00, 'The stock for V-PPY-22OZ has been increased by 500', '2026-05-31 21:21:12'),
(14, 'V-PPY-16OZ', 'Raw Materials / Products', 295.00, 'The stock for V-PPY-16OZ has been increased by 100', '2026-06-01 00:03:15'),
(15, 'V-UCUP-22OZ', 'Raw Materials / Products', 395.00, 'The stock for V-UCUP-22OZ has been increased by 100', '2026-06-01 00:50:21'),
(16, NULL, 'Others', 123.00, 'aws', '2026-06-01 00:53:30'),
(17, NULL, 'Others', 1213.00, 'adaw', '2026-06-01 01:02:53'),
(18, NULL, 'Others', 12.00, 'wdawd', '2026-06-01 01:02:57'),
(19, NULL, 'Others', 123.00, 'hello world', '2026-06-01 01:09:53');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `id` varchar(20) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `product_id` varchar(10) DEFAULT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `expenditure_id` int(10) UNSIGNED DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `qty_added` int(11) NOT NULL DEFAULT 0,
  `cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `type` enum('RESTOCK','MISC','ADJUSTMENT','DAMAGE') NOT NULL DEFAULT 'RESTOCK',
  `notes` text DEFAULT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_logs`
--

INSERT INTO `inventory_logs` (`id`, `employee_id`, `product_id`, `variant_id`, `expenditure_id`, `product_name`, `qty_added`, `cost`, `type`, `notes`, `date`) VALUES
('LOG-2PJXS16KOL', '1', 'P001', 'V-PPY-16OZ', 14, 'PPY Cup', 100, 295.00, 'RESTOCK', 'Restocked 100 units of variant 16oz', '2026-06-01 08:03:15'),
('LOG-HUNRNGSVEQ', '2', 'P001', 'V-PPY-22OZ', 13, 'PPY Cup', 500, 1625.00, 'RESTOCK', 'Restocked 500 units of variant 22oz', '2026-06-01 05:21:12'),
('LOG-X2ZRD9IIP8', '2', 'P002', 'V-UCUP-22OZ', 15, 'UCUP', 100, 395.00, 'RESTOCK', 'Restocked 100 units of variant 22oz', '2026-06-01 08:50:21');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `marketing_promotions`
--

CREATE TABLE `marketing_promotions` (
  `id` varchar(20) NOT NULL,
  `title` varchar(150) NOT NULL,
  `discount_type` enum('percentage','unit') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `target_type` enum('all_users','specific_user') NOT NULL,
  `assigned_user_id` varchar(50) DEFAULT NULL,
  `product_id` varchar(20) DEFAULT NULL,
  `code` varchar(50) NOT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `minimum_quantity` int(11) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(30) NOT NULL,
  `conversation_id` varchar(50) NOT NULL,
  `sender_id` varchar(20) NOT NULL,
  `sender_type` enum('employee','customer') NOT NULL,
  `receiver_id` varchar(20) NOT NULL,
  `receiver_type` enum('employee','customer') NOT NULL,
  `message` text DEFAULT NULL,
  `order_id` varchar(30) DEFAULT NULL,
  `screenplate_request_id` varchar(20) DEFAULT NULL,
  `payment_code_id` varchar(30) DEFAULT NULL,
  `refund_id` varchar(30) DEFAULT NULL,
  `expenditures_id` varchar(30) DEFAULT NULL,
  `is_pinned` datetime DEFAULT NULL,
  `is_confirm` tinyint(1) NOT NULL DEFAULT 0,
  `reply_to_id` varchar(30) DEFAULT NULL,
  `is_edited` tinyint(1) NOT NULL DEFAULT 0,
  `original_text` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `product_concern` tinyint(1) NOT NULL DEFAULT 0,
  `an_email` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `sender_type`, `receiver_id`, `receiver_type`, `message`, `order_id`, `screenplate_request_id`, `payment_code_id`, `refund_id`, `expenditures_id`, `is_pinned`, `is_confirm`, `reply_to_id`, `is_edited`, `original_text`, `is_deleted`, `is_read`, `product_concern`, `an_email`, `created_at`, `updated_at`) VALUES
('msg_0b0vWmanep', '1_2', '1', 'employee', '2', 'employee', 'ikaw nalang boss', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:32', '2026-06-01 17:50:49'),
('msg_2Jol2cE6at', '2_1', '2', 'employee', '1', 'employee', 'hahah', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:06', '2026-06-01 17:51:37'),
('msg_40tAJQLZhk', '1_2', '1', 'employee', '2', 'employee', 'kupal kaba boss', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:08', '2026-06-01 17:50:49'),
('msg_6Uu1O9lh0J', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_7OeIK5zOLf', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'esf', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_7TS7dTaL5t', '1_2', '1', 'employee', '2', 'employee', 'awds', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:44', '2026-06-01 17:59:03'),
('msg_9Exiw1UMPQ', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'haha', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 18:20:31', '2026-06-01 22:00:01'),
('msg_a0PjorzGMY', '1_2', '1', 'employee', '2', 'employee', 'hindi ko na kasi alam hahah', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:27', '2026-06-01 17:50:49'),
('msg_AQfN7ZMRO8', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'haha', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:21:50', '2026-06-01 22:00:01'),
('msg_dPBevNM8yn', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'review your shipping address ORD-SKH0V2WY7Y', 'ORD-SKH0V2WY7Y', NULL, NULL, NULL, NULL, NULL, 1, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 18:17:11', '2026-06-01 22:00:01'),
('msg_dSRkkXEIZo', '2_1', '2', 'employee', '1', 'employee', 'kupal kaba', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:02', '2026-06-01 17:51:37'),
('msg_DZ65M4C7A9', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:30', '2026-06-01 22:32:15'),
('msg_Eb8fWxUvNZ', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'review your shipping address', 'ORD-SKH0V2WY7Y', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 10:17:11', '2026-06-01 22:00:01'),
('msg_esHRDGlpnU', '2_1', '2', 'employee', '1', 'employee', 'hello world', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:13', '2026-06-01 17:51:37'),
('msg_F856TOUnib', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'dwawd', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:30', '2026-06-01 22:32:15'),
('msg_faEDhQevHO', '1_2', '1', 'employee', '2', 'employee', 'tralala', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:15', '2026-06-01 17:50:49'),
('msg_fG5R8FsUMG', '2_1', '2', 'employee', '1', 'employee', 'awdawds', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:09', '2026-06-01 17:51:37'),
('msg_FPHwXf0Fbz', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_FqdBUYZA3A', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'haha', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:19:14', '2026-06-01 22:32:35'),
('msg_G0zx4MiHFf', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'aws talaga mamala', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:56', '2026-06-01 18:00:30'),
('msg_HI8N07Jmvg', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'fes', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_hIkBYDwRWH', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'Review Screenplate Request: SPR-4GS16DGMPW', NULL, 'SPR-4GS16DGMPW', NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:24', '2026-06-01 22:32:24'),
('msg_HORwEihHAV', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_HQloECC2TX', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'waddawwd', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:30', '2026-06-01 22:32:15'),
('msg_icEYzAMn7f', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'fe', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_ImMpwxCgsR', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_iUdNGSaw0m', '2_1', '2', 'employee', '1', 'employee', 'they say', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:16', '2026-06-01 17:51:37'),
('msg_jqtvpCYfLM', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'ad', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:32', '2026-06-01 22:32:15'),
('msg_KRbEzTrgcO', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'adwad', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:33:14', '2026-06-01 22:00:01'),
('msg_LtYckRaH5i', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'tralala', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:41', '2026-06-01 18:00:30'),
('msg_nedVAtKs6c', '1_2', '1', 'employee', '2', 'employee', 'awds', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:51:48', '2026-06-01 17:59:03'),
('msg_NK4iZ0QsuM', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'asw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 18:20:38', '2026-06-01 22:00:01'),
('msg_nq48GpkoRU', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'sefesfs', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:30', '2026-06-01 22:32:30'),
('msg_oh381eDijq', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adwwddaw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:29', '2026-06-01 22:32:35'),
('msg_oKdDcTrvpE', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'awdwd', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:33:17', '2026-06-01 22:00:01'),
('msg_pWo4V5fory', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'fe', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:32', '2026-06-01 22:32:32'),
('msg_rCIBTyI7WJ', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_s4FiCj0tEz', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:31', '2026-06-01 22:32:15'),
('msg_Shwb1HRisa', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'haha', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 21:09:43', '2026-06-01 22:00:01'),
('msg_SlCpOD9JiP', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'review your shipping address', 'ORD-UUGTWHTQGL', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 10:17:33', '2026-06-01 22:00:01'),
('msg_SmE3xhnAXv', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'kupal kaba boss', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:46', '2026-06-01 18:00:30'),
('msg_tRuXGtKqHA', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'fesefsesf', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_twWw1BbYHe', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'saan ba pupunta ang aws', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 18:00:06', '2026-06-01 18:00:30'),
('msg_V2wJiYKgaB', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'fes', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_vIK3Ctsn1k', '1_2', '1', 'employee', '2', 'employee', 'saan ba to patunong', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:22', '2026-06-01 17:50:49'),
('msg_VKf5dgRQAW', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'hello world', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:40', '2026-06-01 18:00:30'),
('msg_vU7wWfNW1W', '1_2', '1', 'employee', '2', 'employee', 'hello world', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:13', '2026-06-01 17:50:49'),
('msg_vUOwYZoAuj', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'adwawd', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:33:12', '2026-06-01 22:00:01'),
('msg_w2eEPgJg0V', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'hahah', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:33', '2026-06-01 18:00:30'),
('msg_wZfay9kk9Y', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'awcs', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:31:47', '2026-06-01 22:00:01'),
('msg_XNM1WRDSwA', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'aws', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:34', '2026-06-01 18:00:30'),
('msg_XVB5vush7z', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'esf', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 0, 0, 0, '2026-06-01 22:32:31', '2026-06-01 22:32:31'),
('msg_xYBzOyHA48', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'ang inang buhay to hahah', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:59:52', '2026-06-01 18:00:30'),
('msg_yKUY55VG9V', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'ahhaha', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 20:35:05', '2026-06-01 22:00:01'),
('msg_YQu1HrP8lm', '1_CUST-503', '1', 'employee', 'CUST-503', 'customer', 'adw', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 22:30:30', '2026-06-01 22:43:29'),
('msg_ZAeJduVxOh', '1_2', '1', 'employee', '2', 'employee', 'hahahah', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:04', '2026-06-01 17:50:49'),
('msg_ZENHpi5oUY', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'review your shipping address ORD-UUGTWHTQGL', 'ORD-UUGTWHTQGL', NULL, NULL, NULL, NULL, NULL, 1, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 18:17:33', '2026-06-01 22:00:01'),
('msg_zOStNJuK7v', '1_2', '1', 'employee', '2', 'employee', 'talaga ba', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, 0, 1, 0, 0, '2026-06-01 17:50:10', '2026-06-01 17:50:49');

-- --------------------------------------------------------

--
-- Table structure for table `message_attachments`
--

CREATE TABLE `message_attachments` (
  `id` int(10) UNSIGNED NOT NULL,
  `message_id` varchar(30) NOT NULL,
  `type` enum('image','file') NOT NULL DEFAULT 'file',
  `url` varchar(500) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_reactions`
--

CREATE TABLE `message_reactions` (
  `id` int(10) UNSIGNED NOT NULL,
  `message_id` varchar(30) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `user_type` enum('employee','customer') NOT NULL,
  `emoji` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `message_reactions`
--

INSERT INTO `message_reactions` (`id`, `message_id`, `user_id`, `user_type`, `emoji`) VALUES
(15, 'msg_twWw1BbYHe', '1', 'employee', '😂');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2026_04_11_143002_create_personal_access_tokens_table', 1),
(4, '2026_04_11_143003_create_delivery_methods_table', 1),
(5, '2026_04_11_143004_create_categories_table', 1),
(6, '2026_04_11_143005_create_colors_table', 1),
(7, '2026_04_11_143006_create_customers_table', 1),
(8, '2026_04_11_143007_create_employees_table', 1),
(9, '2026_04_11_143008_create_products_table', 1),
(10, '2026_04_11_143009_create_screenplates_table', 1),
(11, '2026_04_11_143010_create_conversations_table', 1),
(12, '2026_04_11_143011_create_product_variants_table', 1),
(13, '2026_04_11_143012_create_product_gallery_table', 1),
(14, '2026_04_11_143013_create_product_tags_table', 1),
(15, '2026_04_11_143014_create_customer_addresses_table', 1),
(16, '2026_04_11_143015_create_customer_contact_numbers_table', 1),
(18, '2026_04_11_143017_create_customer_payment_methods_table', 1),
(19, '2026_04_11_143018_create_employee_addresses_table', 1),
(20, '2026_04_11_143019_create_employee_attendance_table', 1),
(21, '2026_04_11_143020_create_employee_contact_numbers_table', 1),
(23, '2026_04_11_143022_create_cart_items_table', 1),
(24, '2026_04_11_143023_create_cart_item_colors_table', 1),
(25, '2026_04_11_143024_create_orders_table', 1),
(26, '2026_04_11_143025_create_order_items_table', 1),
(27, '2026_04_11_143026_create_order_item_colors_table', 1),
(28, '2026_04_11_143027_create_screenplate_compatibility_table', 1),
(29, '2026_04_11_143028_create_screenplate_incompatible_table', 1),
(30, '2026_04_11_143029_create_screenplate_requests_table', 1),
(31, '2026_04_11_143030_create_messages_table', 1),
(32, '2026_04_11_143031_create_message_attachments_table', 1),
(33, '2026_04_11_143032_create_message_reactions_table', 1),
(34, '2026_04_11_143033_create_conversation_participants_table', 1),
(35, '2026_04_11_143034_create_inventory_logs_table', 1),
(36, '2026_04_11_143035_create_marketing_promotions_table', 1),
(37, '2026_04_11_143036_create_production_logs_table', 1),
(38, '2026_04_11_143037_create_deleted_accounts_table', 1),
(39, '2026_04_11_150138convert_database_to_utf8mb4_and_bcrypt_passwords', 1),
(40, '2026_04_22_013058_update_cart_items_table', 1),
(41, '2026_04_26_033029_create_screenplate_requests_table', 2),
(42, '2026_05_17_025817_create_notifications_table', 3),
(43, '2026_05_18_105141_create_product_reviews_table', 4),
(44, '2026_05_19_000304_add_temp_v2_to_cart_items_table', 5),
(45, '2026_05_19_150500_update_customer_payment_methods_table', 6),
(46, '2026_05_19_081323_change_provider_to_enum_in_customer_payment_methods_table', 7),
(47, '2026_05_19_083325_change_bank_name_to_enum_in_customer_payment_methods_table', 8),
(48, '2026_05_19_100037_add_role_to_customers_table', 9),
(49, '2026_05_20_031409_add_order_and_screenplate_to_messages_table', 10),
(50, '2026_05_20_060740_create_discounts_table', 11),
(51, '2026_05_20_060744_add_discount_to_orders_table', 12),
(52, '2026_05_20_060745_add_variant_id_to_discounts_table', 13),
(53, '2026_05_22_000001_add_is_confirm_to_messages_table', 14),
(54, '2026_05_27_025704_add_current_stock_to_products_table', 15),
(56, '2026_05_29_225640_drop_employee_weekly_salary_and_expenditures', 17),
(57, '2026_04_11_143021_create_employee_weekly_salary_table', 18),
(58, '2026_05_29_072956_create_expenditures_table', 19),
(59, '2026_05_30_150159_add_title_to_discounts_table', 20),
(60, '2026_05_31_000000_create_payment_codes_table', 21),
(61, '2026_05_31_115423_add_cascade_delete_to_message_tables', 22),
(62, '2026_05_31_231616_add_operational_assignments_to_employees_table', 23),
(63, '2026_06_01_004741_add_is_need_screenplate_to_product_variants_table', 24),
(64, '2026_06_01_094900_add_expenditure_id_to_inventory_logs_table', 25),
(65, '2026_06_01_095000_add_variant_id_to_inventory_logs_table', 26),
(66, '2026_06_01_060246_create_refunds_table', 27),
(67, '2026_06_01_060258_add_refund_columns_to_messages_table', 27),
(68, '2026_04_11_143016_create_customer_discounts_table', 28);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(255) NOT NULL,
  `customer_id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'info',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `customer_id`, `title`, `message`, `type`, `is_read`, `created_at`, `updated_at`) VALUES
('a8d6e00a-4b65-4a41-833d-59e5fc60df5a', 'CUST-503', 'Screenplate Requested', 'Your setup request for PPY Cup has been processed.', 'success', 0, '2026-06-01 06:32:24', '2026-06-01 06:32:24');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(30) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `address_id` varchar(50) DEFAULT NULL,
  `payment_method_id` varchar(50) DEFAULT NULL,
  `delivery_method_id` varchar(50) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_id` varchar(30) DEFAULT NULL,
  `total_discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `production_notes` text DEFAULT NULL,
  `status` enum('UNPAID','PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `feedback` text DEFAULT NULL,
  `complaint` text DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `admin_comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `payment_code_id` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `address_id`, `payment_method_id`, `delivery_method_id`, `total_amount`, `discount_id`, `total_discount_amount`, `production_notes`, `status`, `feedback`, `complaint`, `rating`, `admin_comment`, `created_at`, `payment_code_id`) VALUES
('ORD-1RKEWWBEK8', 'CUST-503', 'ADDR-003', 'PAY-81816', 'del_001', 0.00, 'DISC001', 585.00, NULL, 'PROCESSING', NULL, NULL, 0, NULL, '2026-05-22 08:00:29', NULL),
('ORD-3IRZCCY8PF', 'CUST-503', 'ADDR-003', 'PAY-81816', 'del_001', 585.00, NULL, 0.00, NULL, 'DELIVERED', NULL, NULL, 0, NULL, '2026-05-22 03:45:18', NULL),
('ORD-FERO2PSVAO', 'CUST-503', 'ADDR-003', 'PAY-81816', 'del_001', 1085.00, NULL, 0.00, NULL, 'PENDING', NULL, NULL, 0, 'Cancelled by customer: Change of mind', '2026-05-22 07:41:50', NULL),
('ORD-HLQNGG8OPB', 'CUST-503', 'ADDR-003', 'PAY-81816', 'del_001', 585.00, NULL, 0.00, NULL, 'DELIVERED', NULL, NULL, 5, NULL, '2026-05-22 08:42:32', NULL),
('ORD-IZGOI6H75U', 'CUST-503', 'ADDR-003', 'PAY-91219', 'del_001', 245.00, 'dsc_LuA7FMznq2', 50.00, NULL, 'PROCESSING', NULL, NULL, 0, NULL, '2026-05-30 15:08:35', NULL),
('ORD-PKFUXZQEWH', 'CUST-503', 'ADDR-003', 'PAY-91219', 'del_001', 1785.00, NULL, 0.00, NULL, 'PENDING', NULL, NULL, 0, NULL, '2026-05-28 05:10:41', NULL),
('ORD-R2E4GWYU4W', 'CUST-503', 'ADDR-003', NULL, 'del_001', 1295.00, NULL, 0.00, NULL, 'CANCELLED', NULL, NULL, 0, NULL, '2026-05-31 15:08:47', 'PAY-GGTYEUYS'),
('ORD-SKH0V2WY7Y', 'CUST-503', 'ADDR-003', 'PAY-91219', 'del_001', 260.00, NULL, 0.00, NULL, 'PENDING', NULL, NULL, 0, NULL, '2026-06-01 10:17:11', NULL),
('ORD-UUGTWHTQGL', 'CUST-503', 'ADDR-003', 'PAY-91219', 'del_001', 295.00, NULL, 0.00, NULL, 'PENDING', NULL, NULL, 0, NULL, '2026-06-01 10:17:33', NULL),
('ORD-XTH9CHUAOH', 'CUST-503', 'ADDR-003', 'PAY-81816', 'del_001', 500.00, NULL, 0.00, NULL, 'CANCELLED', NULL, NULL, 3, NULL, '2026-05-22 03:39:13', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` varchar(30) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `product_id` varchar(10) DEFAULT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `screenplate_id` varchar(20) DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plate_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `customer_id`, `product_id`, `variant_id`, `screenplate_id`, `quantity`, `unit_price`, `plate_price`, `created_at`) VALUES
(29, 'ORD-XTH9CHUAOH', 'CUST-503', 'P011', 'V-BS-STD', NULL, 500, 1.00, 0.00, '2026-05-22 11:39:13'),
(30, 'ORD-3IRZCCY8PF', 'CUST-503', 'P001', 'V-PPY-12OZ', 'SP-FLAT-001', 100, 2.85, 3.00, '2026-05-22 11:45:18'),
(31, 'ORD-FERO2PSVAO', 'CUST-503', 'P001', 'V-PPY-12OZ', 'SP-FLAT-001', 100, 2.85, 3.00, '2026-05-22 15:41:50'),
(32, 'ORD-FERO2PSVAO', 'CUST-503', 'P011', 'V-BS-STD', NULL, 500, 1.00, 0.00, '2026-05-22 15:41:50'),
(33, 'ORD-1RKEWWBEK8', 'CUST-503', 'P001', 'V-PPY-12OZ', 'SP-FLAT-001', 100, 2.85, 3.00, '2026-05-22 16:00:29'),
(34, 'ORD-HLQNGG8OPB', 'CUST-503', 'P001', 'V-PPY-12OZ', 'SP-FLAT-001', 100, 2.85, 3.00, '2026-05-22 16:42:32'),
(35, 'ORD-PKFUXZQEWH', 'CUST-503', 'P001', 'V-PPY-12OZ', 'SP-FLAT-001', 100, 2.85, 3.00, '2026-05-28 13:10:41'),
(36, 'ORD-PKFUXZQEWH', 'CUST-503', 'P009', 'V-FL-98MM', NULL, 1000, 1.20, 0.00, '2026-05-28 13:10:41'),
(37, 'ORD-IZGOI6H75U', 'CUST-503', 'P001', 'V-PPY-16OZ', 'SP-FLAT-001', 100, 2.95, 0.00, '2026-05-30 23:08:35'),
(39, 'ORD-R2E4GWYU4W', 'CUST-503', 'P011', 'V-BS-STD', 'SP-FLAT-001', 500, 1.00, 1.00, '2026-05-31 23:08:47'),
(40, 'ORD-R2E4GWYU4W', 'CUST-503', 'P001', 'V-PPY-16OZ', 'SP-FLAT-001', 100, 2.95, 0.00, '2026-05-31 23:08:47'),
(45, 'ORD-SKH0V2WY7Y', 'CUST-503', 'P007', 'V-DOME-90MM', NULL, 200, 1.30, 0.00, '2026-06-01 18:17:11'),
(46, 'ORD-UUGTWHTQGL', 'CUST-503', 'P001', 'V-PPY-16OZ', 'SP-FLAT-001', 100, 2.95, 0.00, '2026-06-01 18:17:33');

-- --------------------------------------------------------

--
-- Table structure for table `order_item_colors`
--

CREATE TABLE `order_item_colors` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_item_id` int(10) UNSIGNED NOT NULL,
  `color_id` varchar(10) NOT NULL,
  `channel_label` enum('Primary','Secondary','Accent') NOT NULL DEFAULT 'Primary',
  `channel_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_item_colors`
--

INSERT INTO `order_item_colors` (`id`, `order_item_id`, `color_id`, `channel_label`, `channel_order`) VALUES
(25, 30, 'C005', 'Primary', 0),
(26, 30, 'C006', 'Secondary', 1),
(27, 31, 'C005', 'Primary', 0),
(28, 31, 'C006', 'Secondary', 1),
(29, 33, 'C005', 'Primary', 0),
(30, 33, 'C006', 'Secondary', 1),
(31, 34, 'C005', 'Primary', 0),
(32, 34, 'C006', 'Secondary', 1),
(33, 35, 'C005', 'Primary', 0),
(34, 35, 'C006', 'Secondary', 1),
(35, 37, 'C005', 'Primary', 0),
(36, 37, 'C006', 'Secondary', 1),
(39, 40, 'C005', 'Primary', 0),
(40, 40, 'C006', 'Secondary', 1),
(43, 46, 'C005', 'Primary', 0),
(44, 46, 'C006', 'Secondary', 1);

-- --------------------------------------------------------

--
-- Table structure for table `payment_codes`
--

CREATE TABLE `payment_codes` (
  `id` varchar(30) NOT NULL,
  `code` varchar(20) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_codes`
--

INSERT INTO `payment_codes` (`id`, `code`, `is_used`, `used_at`, `created_at`) VALUES
('PAY-GGTYEUYS', '7FRWCJ', 0, NULL, '2026-05-31 15:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` varchar(30) NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(33, 'App\\Models\\Customer', 'CUST-505', 'customer-token', '1dae7ccbcd28c09b284490d8f264e066e453b7455862b549d53fd584d2cbbb36', '[\"role:customer\"]', NULL, '2026-06-18 02:36:46', '2026-05-19 02:36:46', '2026-05-19 02:36:46'),
(34, 'App\\Models\\Customer', 'CUST-506', 'customer-token', '0c5e76f5f791c8ce0fe6b08ae6a3812e1b83a1ecb7cbb6ed68af63430440145f', '[\"role:customer\"]', NULL, '2026-06-18 02:42:34', '2026-05-19 02:42:34', '2026-05-19 02:42:34'),
(40, 'App\\Models\\Customer', 'CUST-504', 'customer-token', 'dada959aeeb198d2525a720a3b7357fcc0c5552fb2716b4c675925f5ebe6c210', '[\"role:customer\"]', NULL, '2026-06-18 06:09:45', '2026-05-19 06:09:45', '2026-05-19 06:09:45');

-- --------------------------------------------------------

--
-- Table structure for table `production_logs`
--

CREATE TABLE `production_logs` (
  `id` varchar(20) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `order_id` varchar(20) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `completed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` varchar(10) NOT NULL,
  `category_id` varchar(10) NOT NULL,
  `name` varchar(255) NOT NULL,
  `short_description` text DEFAULT NULL,
  `long_description` text DEFAULT NULL,
  `best_for` varchar(500) DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_in_stock` tinyint(1) DEFAULT 1,
  `raw_material_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `min_threshold` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_order` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `main_image` varchar(500) DEFAULT NULL,
  `print_method` varchar(100) DEFAULT NULL,
  `is_need_screenplate` tinyint(1) NOT NULL DEFAULT 0,
  `is_need_color` tinyint(1) NOT NULL DEFAULT 0,
  `ratings` tinyint(3) UNSIGNED NOT NULL DEFAULT 5,
  `total_sold` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `short_description`, `long_description`, `best_for`, `base_price`, `is_in_stock`, `raw_material_cost`, `min_threshold`, `min_order`, `main_image`, `print_method`, `is_need_screenplate`, `is_need_color`, `ratings`, `total_sold`) VALUES
('P001', 'CT001', 'PPY Cup', 'Standard PP cup for milktea and cold drinks — affordable and food-grade.', 'The PPY Cup is an everyday polypropylene cup built for high-volume milktea shops and cafes.', 'Milktea Shops, Coffee Houses, and Catering Events.', 2.85, 1, 1.10, 500, 100, 'happycup.png', 'Screen Print / Offset', 1, 1, 4, 5285),
('P002', 'CT001', 'UCUP', 'Premium U-shaped PP cup — crystal clear with a modern profile.', 'The UCUP features a distinctive U-shaped design that enhances drink presentation.', 'Milktea Shops, Juice Bars, and Premium Cafes.', 2.95, 1, 1.20, 500, 100, 'ligma.jpeg', 'Screen Print / Offset', 1, 1, 4, 424),
('P003', 'CT001', 'Slim Cup', 'Sleek slim-profile PP cup — ergonomic grip, great for on-the-go drinks.', 'The Slim Cup is designed with a narrower diameter for a comfortable grip.', 'Premium Milktea Shops, Coffee Shops, and Takeaway Counters.', 3.80, 1, 1.50, 300, 100, 'nothappy.jpeg', 'Screen Print / Offset', 1, 1, 4, 543),
('P004', 'CT001', 'Doublewall Cup with Lid', 'Insulated doublewall cup with lid — keeps drinks hot or cold longer.', 'The Doublewall Cup features a dual-wall construction that provides superior insulation.', 'Coffee Shops, Hot Beverage Stalls, and Premium Milktea Outlets.', 7.00, 1, 3.00, 200, 1, 'happycup.png', 'Screen Print / Offset', 1, 1, 5, 281),
('P005', 'CT001', 'PET Cup 95mm', 'Crystal-clear PET cup with 95mm diameter opening — vibrant and recyclable.', 'The PET Cup (95mm) is made from polyethylene terephthalate, offering exceptional clarity.', 'Milktea Shops, Fruit Tea Stalls, and Specialty Drink Outlets.', 3.20, 1, 1.40, 500, 100, 'happycup.png', 'Screen Print / Offset', 1, 1, 4, 319),
('P006', 'CT001', 'PET Cup 98mm', 'Wide-mouth crystal-clear PET cup with 98mm diameter — great for toppings-heavy drinks.', 'The PET Cup (98mm) features a wider 98mm opening, perfect for drinks loaded with pearls.', 'Milktea Shops, Dessert Drinks, and Topping-Heavy Beverages.', 4.45, 1, 1.80, 500, 100, 'happycup.png', 'Screen Print / Offset', 1, 1, 4, 431),
('P007', 'CT002', 'Dome Lid', 'Classic dome-shaped lid — fits standard 90mm and 98mm cup openings.', 'The Dome Lid features a raised dome design that accommodates whipped cream and pearls.', 'Milktea Cups, Smoothie Cups, and Topping-Heavy Drinks.', 1.30, 1, 0.50, 1000, 200, 'happycup.png', 'N/A', 0, 0, 5, 1690),
('P008', 'CT002', 'Strawless Lid', 'Eco-friendly strawless lid — sip-directly design, fits 90mm, 95mm, and 98mm cups.', 'The Strawless Lid promotes sustainable drinking with its no-straw sip design.', 'Eco-Friendly Shops, Cold Brew, and Juice Bars.', 1.20, 1, 0.45, 1000, 200, 'happycup.png', 'N/A', 0, 0, 5, 1033),
('P009', 'CT002', 'Flat Lid', 'Flat-profile lid — clean, minimal design for no-straw or straw-hole use.', 'The Flat Lid provides a clean, low-profile seal for standard cups.', 'Standard Milktea Cups, Coffee, and Cold Drinks.', 1.20, 1, 0.40, 1000, 200, 'happycup.png', 'N/A', 0, 0, 5, 1467),
('P010', 'CT002', 'Conjoined Lid', 'Double-cup conjoined lid — connects two cups for easy carrying.', 'The Conjoined Lid is a unique dual-cup lid that connects two cups side by side.', 'Takeaway Orders, Couple Deals, and Events.', 1.90, 1, 0.70, 300, 100, 'happycup.png', 'N/A', 0, 0, 5, 661),
('P011', 'CT003', 'Black Straw', 'Sleek black PP straw — stylish and sturdy for all cup types.', 'The Black Straw is made from food-grade polypropylene in a classic matte black finish.', 'All Beverage Types, Milktea Shops, and Coffee Outlets.', 1.00, 1, 0.30, 1000, 500, 'happycup.png', 'N/A', 0, 0, 5, 2144),
('P012', 'CT004', 'Paper Bowl', 'Eco-friendly paper bowl for soups, noodles, and hot meals — available in 6 sizes.', 'The Paper Bowl is crafted from food-grade paperboard with a PE-coated interior.', 'Food Stalls, Canteens, Delivery Kitchens, and Catering Events.', 2.40, 1, 1.00, 500, 100, 'happycup.png', 'Flexographic Print', 1, 1, 4, 846),
('P013', 'CT005', 'Paper Cup', 'Single-wall paper cup for hot and cold drinks — available in 8 sizes.', 'Our Paper Cups are made from food-grade paperboard with a PE-lined interior.', 'Coffee Shops, Canteens, Events, and Takeaway Stalls.', 1.55, 1, 0.65, 1000, 200, 'happycup.png', 'Flexographic Print / Screen Print', 1, 1, 4, 1491),
('P014', 'CT006', 'Spaghetti Box', 'Rectangular paper box sized perfectly for spaghetti and pasta servings.', 'The Spaghetti Box is a long, rectangular food-grade paper box for pasta.', 'Food Stalls, Canteens, School Tuck Shops, and Catering.', 3.90, 1, 1.60, 300, 100, 'happycup.png', 'Flexographic Print', 1, 1, 4, 220),
('P015', 'CT006', 'Burger Box', 'Clamshell burger box — keeps burgers fresh, warm, and intact.', 'The Burger Box features a clamshell design that locks in heat.', 'Burger Stalls, Fast Food, and Food Delivery.', 3.72, 1, 1.50, 300, 100, 'happycup.png', 'Flexographic Print', 1, 1, 4, 1217),
('P016', 'CT006', 'Meal Box', 'Standard paper meal box for rice and viand combos — available in 750cc and 880cc.', 'The Meal Box is the go-to container for rice meal servings.', 'Carinderias, Food Stalls, Catering, and Takeaway Counters.', 5.05, 1, 2.00, 300, 100, 'happycup.png', 'Flexographic Print', 1, 1, 5, 1103),
('P017', 'CT006', 'High Meal Box', 'Tall-profile meal box — ideal for bulkier meals with heaping toppings.', 'The High Meal Box features greater height than a standard meal box.', 'Catering, Generous Meal Servings, and Food Stalls.', 5.25, 1, 2.10, 300, 100, 'happycup.png', 'Flexographic Print', 1, 1, 5, 1228),
('P018', 'CT006', 'Lechon Take Out Bag', 'Heavy-duty grease-resistant bag for lechon and roasted meat takeout.', 'The Lechon Take Out Bag is built to handle greasy, heavy roasted meat servings.', 'Lechon Stalls, Roasted Chicken Shops, BBQ Counters, and Catering.', 2.90, 1, 1.10, 300, 100, 'happycup.png', 'Flexographic Print', 1, 1, 4, 521),
('P019', 'CT006', '2-Division Box', 'Two-compartment paper box — keeps rice and viand neatly separated.', 'The 2-Division Box features an internal divider that keeps rice and viand separate.', 'Carinderias, Combo Meals, Catering, and Food Stalls.', 5.40, 1, 2.20, 300, 100, 'P019_main_1779923210.jpeg', 'Flexographic Print', 1, 1, 4, 756),
('P020', 'CT006', 'Hotdog Box', 'Elongated paper box designed to hold hotdog sandwiches and corn dogs.', 'The Hotdog Box is a narrow, elongated food-grade paper box for hotdog sandwiches.', 'Street Food Stalls, School Canteens, Fairs, and Events.', 2.80, 1, 1.01, 300, 100, 'P020_main_1779925267.webp', 'Flexographic Print', 0, 0, 5, 839);

-- --------------------------------------------------------

--
-- Table structure for table `product_gallery`
--

CREATE TABLE `product_gallery` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_gallery`
--

INSERT INTO `product_gallery` (`id`, `product_id`, `image_url`, `sort_order`) VALUES
(1, 'P001', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 0),
(2, 'P001', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 1),
(3, 'P001', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80', 2),
(4, 'P002', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 0),
(5, 'P002', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(6, 'P002', 'https://images.unsplash.com/photo-1582636172536-0a3f25bcf977?auto=format&fit=crop&q=80', 2),
(7, 'P003', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 0),
(8, 'P003', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(9, 'P003', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 2),
(10, 'P004', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80', 0),
(11, 'P004', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 1),
(12, 'P004', 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80', 2),
(13, 'P005', 'https://images.unsplash.com/photo-1582636172536-0a3f25bcf977?auto=format&fit=crop&q=80', 0),
(14, 'P005', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(15, 'P005', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 2),
(16, 'P006', 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80', 0),
(17, 'P006', 'https://images.unsplash.com/photo-1582636172536-0a3f25bcf977?auto=format&fit=crop&q=80', 1),
(18, 'P006', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 2),
(19, 'P007', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 0),
(20, 'P007', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(21, 'P008', 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&q=80', 0),
(22, 'P008', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 1),
(23, 'P009', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 0),
(24, 'P009', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(25, 'P010', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 0),
(26, 'P010', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(27, 'P011', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 0),
(28, 'P011', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 1),
(29, 'P012', 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80', 0),
(30, 'P012', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1),
(31, 'P012', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 2),
(32, 'P013', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 0),
(33, 'P013', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80', 1),
(34, 'P013', 'nothappy.jpeg', 2),
(35, 'P014', 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?auto=format&fit=crop&q=80', 0),
(36, 'P014', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1),
(37, 'P015', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80', 0),
(38, 'P015', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80', 1),
(39, 'P016', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 0),
(40, 'P016', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1),
(41, 'P016', 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80', 2),
(42, 'P017', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 0),
(43, 'P017', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 1),
(44, 'P018', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80', 0),
(45, 'P018', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1),
(46, 'P019', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 0),
(47, 'P019', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1),
(54, 'P020', 'P020_gallery_1779925267_1.jpeg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `order_id` varchar(30) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `feedback` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_tags`
--

CREATE TABLE `product_tags` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `tag` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_tags`
--

INSERT INTO `product_tags` (`id`, `product_id`, `tag`) VALUES
(1, 'P001', 'Budget-Friendly'),
(2, 'P001', 'Food Grade'),
(3, 'P001', 'High Volume'),
(4, 'P002', 'Premium Look'),
(5, 'P002', 'Food Grade'),
(6, 'P002', 'Crystal Clear'),
(7, 'P003', 'Ergonomic'),
(8, 'P003', 'Food Grade'),
(9, 'P003', 'Modern Design'),
(10, 'P004', 'Best Seller'),
(11, 'P004', 'Insulated'),
(12, 'P004', 'Includes Lid'),
(13, 'P004', 'Food Grade'),
(14, 'P005', 'Eco-Friendly'),
(15, 'P005', 'Crystal Clear'),
(16, 'P005', 'BPA-Free'),
(17, 'P005', 'Recyclable'),
(18, 'P006', 'Wide Mouth'),
(19, 'P006', 'BPA-Free'),
(20, 'P006', 'Recyclable'),
(21, 'P006', 'Crystal Clear'),
(22, 'P007', 'Food Grade'),
(23, 'P007', 'Dome Top'),
(24, 'P007', 'Topping-Friendly'),
(25, 'P008', 'Eco-Friendly'),
(26, 'P008', 'No Straw'),
(27, 'P008', 'Food Grade'),
(28, 'P009', 'Food Grade'),
(29, 'P009', 'Minimal Design'),
(30, 'P009', 'Leak-Proof'),
(31, 'P010', 'Unique'),
(32, 'P010', 'Double Cup'),
(33, 'P010', 'Takeaway-Friendly'),
(34, 'P010', 'Food Grade'),
(35, 'P011', 'Food Grade'),
(36, 'P011', 'Black'),
(37, 'P011', 'Premium Look'),
(38, 'P012', 'Eco-Friendly'),
(39, 'P012', 'Food Grade'),
(40, 'P012', 'Leak-Resistant'),
(41, 'P012', 'Hot Food Safe'),
(42, 'P013', 'Food Grade'),
(43, 'P013', 'Hot & Cold Safe'),
(44, 'P013', 'Customizable'),
(45, 'P013', 'Eco-Friendly'),
(46, 'P014', 'Food Grade'),
(47, 'P014', 'Leak-Resistant'),
(48, 'P014', 'Takeaway'),
(49, 'P015', 'Food Grade'),
(50, 'P015', 'Clamshell'),
(51, 'P015', 'Grease-Resistant'),
(52, 'P015', 'Hot Food Safe'),
(53, 'P016', 'Food Grade'),
(54, 'P016', 'Rice Meal'),
(55, 'P016', 'Grease-Resistant'),
(56, 'P016', 'Takeaway'),
(57, 'P017', 'Food Grade'),
(58, 'P017', 'Tall Profile'),
(59, 'P017', 'Grease-Resistant'),
(60, 'P017', 'Catering'),
(61, 'P018', 'Food Grade'),
(62, 'P018', 'Grease-Resistant'),
(63, 'P018', 'Heavy Duty'),
(64, 'P018', 'Takeaway'),
(65, 'P019', 'Food Grade'),
(66, 'P019', '2 Compartments'),
(67, 'P019', 'Grease-Resistant'),
(68, 'P019', 'Combo Meal'),
(78, 'P020', 'Food Grade'),
(79, 'P020', 'Grease-Resistant'),
(80, 'P020', 'Street Food'),
(81, 'P020', 'Elongated');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `variant_id` varchar(30) NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `width` varchar(20) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_need_screenplate` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`variant_id`, `product_id`, `size`, `width`, `height`, `price`, `stock`, `is_need_screenplate`) VALUES
('P020-V-17799258492', 'P020', 'Standard', '220', '60', 2.80, 3000, 1),
('V-1779844953583', 'P020', 'Large', '230mm', '70mm', 3.00, 3000, 1),
('V-2DB-STD', 'P019', 'Standard', '220mm', '60mm', 5.40, 4000, 1),
('V-BB-STD', 'P015', 'Standard', '130mm', '75mm', 3.72, 5000, 1),
('V-BS-STD', 'P011', 'Standard', '8mm', '210mm', 1.00, 18000, 1),
('V-CL-90MM', 'P010', 'Standard (90mm)', '90mm', '20mm', 1.90, 5000, 1),
('V-DOME-90MM', 'P007', 'Standard (90mm)', '90mm', '25mm', 1.30, 7800, 1),
('V-DOME-98MM', 'P007', 'Wide (98mm)', '98mm', '25mm', 1.30, 7000, 1),
('V-DW-12OZ', 'P004', '12oz', '90mm', '110mm', 7.70, 2000, 1),
('V-DW-16OZ', 'P004', '16oz', '90mm', '130mm', 8.20, 1000, 1),
('V-DW-8OZ', 'P004', '8oz', '80mm', '90mm', 7.00, 1000, 1),
('V-FL-90MM', 'P009', 'Standard (90mm)', '90mm', '12mm', 1.20, 3000, 1),
('V-FL-95MM', 'P009', 'PET 95mm', '95mm', '12mm', 1.20, 4000, 1),
('V-FL-98MM', 'P009', 'PET 98mm', '98mm', '12mm', 1.20, 3000, 1),
('V-HMB-STD', 'P017', 'Standard', '155mm', '90mm', 5.25, 4000, 1),
('V-LTB-STD', 'P018', 'Standard', '300mm', '400mm', 2.90, 5000, 1),
('V-MB-750CC', 'P016', '750cc', '140mm', '55mm', 5.05, 3000, 1),
('V-MB-880CC', 'P016', '880cc', '155mm', '60mm', 6.35, 3000, 1),
('V-PB-220CC', 'P012', '220cc', '95mm', '55mm', 2.40, 2000, 1),
('V-PB-260CC', 'P012', '260cc', '100mm', '58mm', 2.50, 2000, 1),
('V-PB-320CC', 'P012', '320cc', '108mm', '62mm', 2.70, 2000, 1),
('V-PB-390CC', 'P012', '390cc', '115mm', '65mm', 2.90, 2000, 1),
('V-PB-520CC', 'P012', '520cc', '125mm', '70mm', 3.60, 2000, 1),
('V-PB-750CC', 'P012', '750cc', '138mm', '78mm', 3.70, 2000, 1),
('V-PC-10OZ', 'P013', '10oz', '84mm', '105mm', 1.85, 2500, 1),
('V-PC-12OZ', 'P013', '12oz', '90mm', '112mm', 1.95, 2500, 1),
('V-PC-16OZ', 'P013', '16oz', '90mm', '135mm', 2.40, 2500, 1),
('V-PC-22OZ', 'P013', '22oz', '90mm', '155mm', 2.75, 2500, 1),
('V-PC-3OZ', 'P013', '3oz', '62mm', '65mm', 1.81, 2500, 1),
('V-PC-5OZ', 'P013', '5oz', '70mm', '78mm', 1.55, 2500, 1),
('V-PC-65OZ', 'P013', '6.5oz', '76mm', '88mm', 1.60, 2500, 1),
('V-PC-8OZ', 'P013', '8oz', '80mm', '96mm', 1.70, 2500, 1),
('V-PET95-12OZ', 'P005', '12oz', '95mm', '100mm', 3.20, 2500, 1),
('V-PET95-16OZ', 'P005', '16oz', '95mm', '122mm', 3.50, 3000, 1),
('V-PET95-22OZ', 'P005', '22oz', '95mm', '148mm', 4.20, 1500, 1),
('V-PET98-12OZ', 'P006', '12oz', '98mm', '98mm', 4.45, 2000, 1),
('V-PET98-16OZ', 'P006', '16oz', '98mm', '118mm', 4.75, 2500, 1),
('V-PET98-20OZ', 'P006', '20oz', '98mm', '140mm', 5.50, 1500, 1),
('V-PPY-12OZ', 'P001', '12oz', '90mm', '100mm', 2.85, 501, 1),
('V-PPY-16OZ', 'P001', '16oz', '90mm', '122mm', 2.95, 400, 1),
('V-PPY-22OZ', 'P001', '22oz', '90mm', '145mm', 3.25, 800, 1),
('V-SB-STD', 'P014', 'Standard', '200mm', '80mm', 3.90, 5000, 1),
('V-SLIM-16OZ', 'P003', '16oz', '80mm', '140mm', 3.80, 3000, 1),
('V-SLIM-22OZ', 'P003', '22oz', '80mm', '165mm', 4.20, 2000, 1),
('V-SLL-90MM', 'P008', 'Standard (90mm)', '90mm', '18mm', 1.20, 5400, 1),
('V-SLL-95MM', 'P008', 'PET 95mm', '95mm', '18mm', 1.20, 6000, 1),
('V-SLL-98MM', 'P008', 'PET 98mm', '98mm', '18mm', 1.20, 6000, 1),
('V-UCUP-12OZ', 'P002', '12oz', '90mm', '100mm', 2.95, 2500, 1),
('V-UCUP-16OZ', 'P002', '16oz', '90mm', '122mm', 3.00, 4000, 1),
('V-UCUP-22OZ', 'P002', '22oz', '90mm', '145mm', 3.95, 100, 1);

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` varchar(30) NOT NULL,
  `employee_id` varchar(20) DEFAULT NULL,
  `customer_id` varchar(20) DEFAULT NULL,
  `order_id` varchar(30) DEFAULT NULL,
  `payment_code_id` varchar(30) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `screenplates`
--

CREATE TABLE `screenplates` (
  `id` varchar(20) NOT NULL,
  `owner_id` varchar(20) NOT NULL,
  `plate_name` varchar(255) NOT NULL,
  `base_setup_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_flatscreen` tinyint(1) NOT NULL DEFAULT 0,
  `channels` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `alignment` enum('Front','Back-to-Back','Triple Logo') NOT NULL DEFAULT 'Front',
  `supported_alignments` set('Front','Back-to-Back','Triple Logo') NOT NULL DEFAULT 'Front',
  `dimensions` varchar(50) DEFAULT NULL,
  `technical_info` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screenplates`
--

INSERT INTO `screenplates` (`id`, `owner_id`, `plate_name`, `base_setup_fee`, `is_flatscreen`, `channels`, `alignment`, `supported_alignments`, `dimensions`, `technical_info`, `image`, `comment`) VALUES
('SP-FLAT-001', 'CUST-503', 'Flatscreen Meal Node', 650.00, 1, 2, 'Front', 'Front', '120mm x 90mm', 'Flatscreen photopolymer terminal for meal boxes.', 'SP-019e6e3f-577f-70be-a1d1-22c0f1e322da.jpg', 'For large flat surfaces only.');

-- --------------------------------------------------------

--
-- Table structure for table `screenplate_compatibility`
--

CREATE TABLE `screenplate_compatibility` (
  `id` int(10) UNSIGNED NOT NULL,
  `screenplate_id` varchar(20) NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `print_price_per_unit` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screenplate_compatibility`
--

INSERT INTO `screenplate_compatibility` (`id`, `screenplate_id`, `product_id`, `variant_id`, `print_price_per_unit`) VALUES
(49, 'SP-FLAT-001', 'P011', 'V-BS-STD', 1.00),
(50, 'SP-FLAT-001', 'P008', 'V-SLL-90MM', 0.00),
(51, 'SP-FLAT-001', 'P008', 'V-SLL-95MM', 0.00),
(52, 'SP-FLAT-001', 'P001', 'V-PPY-16OZ', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `screenplate_incompatible`
--

CREATE TABLE `screenplate_incompatible` (
  `id` int(10) UNSIGNED NOT NULL,
  `screenplate_id` varchar(20) NOT NULL,
  `product_id` varchar(10) NOT NULL,
  `variant_id` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screenplate_incompatible`
--

INSERT INTO `screenplate_incompatible` (`id`, `screenplate_id`, `product_id`, `variant_id`) VALUES
(92, 'SP-FLAT-001', 'P002', NULL),
(93, 'SP-FLAT-001', 'P003', NULL),
(94, 'SP-FLAT-001', 'P005', NULL),
(95, 'SP-FLAT-001', 'P006', NULL),
(96, 'SP-FLAT-001', 'P007', NULL),
(97, 'SP-FLAT-001', 'P009', NULL),
(98, 'SP-FLAT-001', 'P010', NULL),
(99, 'SP-FLAT-001', 'P012', NULL),
(100, 'SP-FLAT-001', 'P013', NULL),
(101, 'SP-FLAT-001', 'P014', NULL),
(102, 'SP-FLAT-001', 'P015', NULL),
(103, 'SP-FLAT-001', 'P016', NULL),
(104, 'SP-FLAT-001', 'P017', NULL),
(105, 'SP-FLAT-001', 'P018', NULL),
(106, 'SP-FLAT-001', 'P019', NULL),
(107, 'SP-FLAT-001', 'P020', NULL),
(108, 'SP-FLAT-001', 'P021', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `screenplate_requests`
--

CREATE TABLE `screenplate_requests` (
  `id` varchar(20) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `product_id` varchar(10) DEFAULT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `color_count` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `alignment` enum('Front','Back-to-Back','Triple Logo') NOT NULL DEFAULT 'Front',
  `reference_image` varchar(500) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `calculated_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `screenplate_requests`
--

INSERT INTO `screenplate_requests` (`id`, `customer_id`, `product_id`, `variant_id`, `color_count`, `alignment`, `reference_image`, `comment`, `calculated_total`, `status`, `created_at`) VALUES
('SPR-4GS16DGMPW', 'CUST-503', 'P001', 'V-PPY-22OZ', 2, 'Front', NULL, NULL, 1400.00, 'Pending', '2026-06-01 14:32:24'),
('SPR-O8YFHZOFTP', 'CUST-503', 'P001', 'V-PPY-16OZ', 2, 'Back-to-Back', 'SPR_1779442142_tjrrE.png', 'ligma gustio ko', 1400.00, 'Pending', '2026-05-22 09:29:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `screenplate_id` (`screenplate_id`);

--
-- Indexes for table `cart_item_colors`
--
ALTER TABLE `cart_item_colors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_channel` (`cart_item_id`,`channel_order`),
  ADD UNIQUE KEY `uq_cart_color` (`cart_item_id`,`color_id`),
  ADD KEY `color_id` (`color_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `colors`
--
ALTER TABLE `colors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conv_participant` (`conversation_id`,`participant_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD UNIQUE KEY `facebook_id` (`facebook_id`);

--
-- Indexes for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `customer_contact_numbers`
--
ALTER TABLE `customer_contact_numbers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `customer_discounts`
--
ALTER TABLE `customer_discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `customer_payment_methods`
--
ALTER TABLE `customer_payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `deleted_accounts`
--
ALTER TABLE `deleted_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_original_id` (`original_id`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `delivery_methods`
--
ALTER TABLE `delivery_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discounts`
--
ALTER TABLE `discounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `discounts_code_unique` (`code`),
  ADD KEY `discounts_customer_id_foreign` (`customer_id`),
  ADD KEY `discounts_product_id_foreign` (`product_id`),
  ADD KEY `discounts_variant_id_foreign` (`variant_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `employee_addresses`
--
ALTER TABLE `employee_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_emp_date` (`employee_id`,`date`);

--
-- Indexes for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `expenditures`
--
ALTER TABLE `expenditures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_variant` (`variant_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `fk_inv_log_expenditure` (`expenditure_id`),
  ADD KEY `fk_inv_log_variant` (`variant_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `marketing_promotions`
--
ALTER TABLE `marketing_promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `reply_to_id` (`reply_to_id`),
  ADD KEY `fk_message_payment_code` (`payment_code_id`);

--
-- Indexes for table `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`);

--
-- Indexes for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_msg_user_reaction` (`message_id`,`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `orders_delivery_method_id_foreign` (`delivery_method_id`),
  ADD KEY `orders_discount_id_foreign` (`discount_id`),
  ADD KEY `fk_order_payment_code` (`payment_code_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `screenplate_id` (`screenplate_id`);

--
-- Indexes for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_channel` (`order_item_id`,`channel_order`),
  ADD UNIQUE KEY `uq_order_color` (`order_item_id`,`color_id`),
  ADD KEY `color_id` (`color_id`);

--
-- Indexes for table `payment_codes`
--
ALTER TABLE `payment_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `production_logs`
--
ALTER TABLE `production_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `product_gallery`
--
ALTER TABLE `product_gallery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_reviews_order_id_product_id_unique` (`order_id`,`product_id`),
  ADD KEY `product_reviews_product_id_index` (`product_id`),
  ADD KEY `product_reviews_customer_id_index` (`customer_id`),
  ADD KEY `product_reviews_order_id_index` (`order_id`);

--
-- Indexes for table `product_tags`
--
ALTER TABLE `product_tags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`variant_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `refunds_customer_id_index` (`customer_id`),
  ADD KEY `refunds_order_id_index` (`order_id`);

--
-- Indexes for table `screenplates`
--
ALTER TABLE `screenplates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `screenplate_compatibility`
--
ALTER TABLE `screenplate_compatibility`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sp_compat` (`screenplate_id`,`product_id`,`variant_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `screenplate_incompatible`
--
ALTER TABLE `screenplate_incompatible`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_sp_incompat` (`screenplate_id`,`product_id`,`variant_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `screenplate_requests`
--
ALTER TABLE `screenplate_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `screenplate_requests_customer_id_index` (`customer_id`),
  ADD KEY `screenplate_requests_product_id_index` (`product_id`),
  ADD KEY `screenplate_requests_variant_id_index` (`variant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_item_colors`
--
ALTER TABLE `cart_item_colors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=141;

--
-- AUTO_INCREMENT for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_contact_numbers`
--
ALTER TABLE `customer_contact_numbers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `customer_discounts`
--
ALTER TABLE `customer_discounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deleted_accounts`
--
ALTER TABLE `deleted_accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `expenditures`
--
ALTER TABLE `expenditures`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_attachments`
--
ALTER TABLE `message_attachments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `message_reactions`
--
ALTER TABLE `message_reactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=173;

--
-- AUTO_INCREMENT for table `product_gallery`
--
ALTER TABLE `product_gallery`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product_tags`
--
ALTER TABLE `product_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `screenplate_compatibility`
--
ALTER TABLE `screenplate_compatibility`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `screenplate_incompatible`
--
ALTER TABLE `screenplate_incompatible`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_item_colors`
--
ALTER TABLE `cart_item_colors`
  ADD CONSTRAINT `cart_item_colors_cart_item_id_foreign` FOREIGN KEY (`cart_item_id`) REFERENCES `cart_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `discounts`
--
ALTER TABLE `discounts`
  ADD CONSTRAINT `discounts_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discounts_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `discounts_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE;

--
-- Constraints for table `expenditures`
--
ALTER TABLE `expenditures`
  ADD CONSTRAINT `fk_exp_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `fk_inv_log_expenditure` FOREIGN KEY (`expenditure_id`) REFERENCES `expenditures` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inv_log_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_message_payment_code` FOREIGN KEY (`payment_code_id`) REFERENCES `payment_codes` (`id`);

--
-- Constraints for table `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `fk_attachments_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD CONSTRAINT `fk_reactions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_payment_code` FOREIGN KEY (`payment_code_id`) REFERENCES `payment_codes` (`id`),
  ADD CONSTRAINT `orders_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_delivery_method_id_foreign` FOREIGN KEY (`delivery_method_id`) REFERENCES `delivery_methods` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_discount_id_foreign` FOREIGN KEY (`discount_id`) REFERENCES `discounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  ADD CONSTRAINT `order_item_colors_color_id_foreign` FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_item_colors_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `product_reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `screenplate_compatibility`
--
ALTER TABLE `screenplate_compatibility`
  ADD CONSTRAINT `screenplate_compatibility_screenplate_id_foreign` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `screenplate_incompatible`
--
ALTER TABLE `screenplate_incompatible`
  ADD CONSTRAINT `screenplate_incompatible_screenplate_id_foreign` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
