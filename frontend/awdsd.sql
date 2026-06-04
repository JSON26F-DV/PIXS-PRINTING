-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 12, 2026 at 06:37 AM
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
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `customer_id`, `product_id`, `variant_id`, `screenplate_id`, `quantity`, `unit_price`, `plate_price`, `created_at`, `updated_at`) VALUES
('P001__V-PPY-12OZ__C001__SP-S-001', 'CUST-501', 'P001', 'V-PPY-12OZ', 'SP-S-001', 100, 2.85, 2.50, '2026-04-11 18:49:41', '2026-04-11 18:49:41'),
('P002__V-UCUP-16OZ__no-color__no-plate', 'CUST-501', 'P002', 'V-UCUP-16OZ', NULL, 50, 3.00, 0.00, '2026-04-11 18:49:41', '2026-04-11 18:49:41');

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
('CT002', 'Lid', 4, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80'),
('CT003', 'Accessories', 1, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80'),
('CT004', 'Paper Bowl', 1, 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80'),
('CT005', 'Paper Cup', 1, 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80'),
('CT006', 'Meal Box', 7, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80');

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
('EMP-001_CUST-501', 'msg_2', '2026-04-11 21:29:57', '2026-04-11 21:29:57');

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

--
-- Dumping data for table `conversation_participants`
--

INSERT INTO `conversation_participants` (`id`, `conversation_id`, `participant_id`, `participant_type`, `joined_at`) VALUES
(1, 'EMP-001_CUST-501', 'EMP-001', 'employee', '2026-04-11 21:29:57'),
(2, 'EMP-001_CUST-501', 'CUST-501', 'customer', '2026-04-11 21:29:57');

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
  `role` enum('customer') NOT NULL DEFAULT 'customer',
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
('CUST-501', 'Juan', 'Dela Cruz', 'https://i.pravatar.cc/300?img=14', 'juan@example.com', 'customer', 'active', 35, 'male', 'Juan\'s Sari-Sari', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 15450.50, 12, NULL, NULL, '2024-05-12 14:20:00', '2026-03-27 11:00:00'),
('CUST-502', 'Laguna', 'Prints', 'https://i.pravatar.cc/300?img=15', 'info@lagunaprints.com', 'customer', 'active', 42, 'female', 'Laguna Prints & Design', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 85200.00, 45, NULL, NULL, '2024-06-20 11:45:00', '2026-03-28 09:30:00'),
('CUST-503', 'aira', 'uzi', NULL, 'airamapagmahal67@gmail.com', 'customer', 'active', 21, 'female', 'Ligma Shop\r\n', '$2y$12$tL5Z7oAftnGXxR/OiRbWsesHft8PIlY0uNWrGjojWGU1q4aEhL9Dq', 0.00, 0, NULL, NULL, '2026-04-12 01:07:22', NULL);

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
  `street` tinyint(255) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 'CUST-501', '+63 918 111 2233', 1),
(2, 'CUST-501', '+63 919 444 5566', 0),
(3, 'CUST-502', '+63 920 555 8888', 1),
(4, 'CUST-502', '+63 921 222 1010', 0),
(5, 'CUST-503', '+639945646355', 1);

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

--
-- Dumping data for table `customer_discounts`
--

INSERT INTO `customer_discounts` (`id`, `customer_id`, `discount_id`, `type`, `value`, `product_id`, `remaining_uses`, `is_one_time`, `expires_at`, `status`) VALUES
(1, 'CUST-502', 'DISC-001', 'unit', 1.50, 'P001', 1, 1, '2026-06-01 00:00:00', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `customer_payment_methods`
--

CREATE TABLE `customer_payment_methods` (
  `id` varchar(20) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `type` enum('bank','ewallet','credit_card','cod') NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `provider` varchar(100) DEFAULT NULL,
  `masked_number` varchar(30) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_payment_methods`
--

INSERT INTO `customer_payment_methods` (`id`, `customer_id`, `type`, `bank_name`, `provider`, `masked_number`, `is_default`) VALUES
('pay_001', 'CUST-501', 'bank', 'BDO', NULL, '**** 1234', 1),
('pay_002', 'CUST-501', 'ewallet', NULL, 'GCash', '**** 5678', 0),
('PAY-10778', 'CUST-503', 'ewallet', NULL, 'GCash', '•••••••6355', 1);

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

--
-- Dumping data for table `deleted_accounts`
--

INSERT INTO `deleted_accounts` (`id`, `original_id`, `account_type`, `email`, `password`, `deleted_by`, `deleted_by_type`, `reason`, `deleted_at`) VALUES
(1, 'CUST-503', 'customer', 'banned@example.com', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 'EMP-001', 'employee', 'Fraudulent transactions reported', '2026-04-11 18:07:15'),
(2, 'EMP-005', 'employee', 'fired@pixs.com', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 'EMP-001', 'employee', 'Violation of company policy', '2026-04-11 18:07:15');

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
  `role` enum('admin','staff','technician','welder','inventory') NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `age` tinyint(3) UNSIGNED DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `total_orders_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ot_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `first_name`, `last_name`, `profile_picture`, `email`, `role`, `status`, `age`, `gender`, `company_name`, `password`, `total_orders_value`, `daily_rate`, `ot_rate`, `date_created`, `last_login`) VALUES
('EMP-001', 'Jason', 'G', 'https://i.pravatar.cc/300?img=11', 'jason@pixs.com', 'admin', 'active', 28, 'male', 'PIXS PRINTING SHOP', '$2y$12$tL5Z7oAftnGXxR/OiRbWsesHft8PIlY0uNWrGjojWGU1q4aEhL9Dq', 0.00, 850.00, 150.00, '2024-01-15 08:00:00', '2026-03-28 10:30:00'),
('EMP-002', 'Staff', 'A', 'https://i.pravatar.cc/300?img=12', 'staff_a@pixs.com', 'staff', 'active', 24, 'female', 'PIXS PRINTING SHOP', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 0.00, 600.00, 100.00, '2024-02-10 09:00:00', '2026-03-28 08:15:00'),
('EMP-003', 'Tech', 'B', 'https://i.pravatar.cc/300?img=13', 'tech_b@pixs.com', 'technician', 'active', 30, 'male', 'PIXS PRINTING SHOP', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 0.00, 750.00, 120.00, '2024-03-15 10:00:00', '2026-03-28 11:45:00'),
('EMP-004', 'Weld', 'C', 'https://i.pravatar.cc/300?img=15', 'weld_c@pixs.com', 'welder', 'active', 28, 'male', 'PIXS PRINTING SHOP', '$2y$12$6pX90R7u0.9TInXzGPmGuev6MvE.C1uXyX8v7.nF9t/K9.uH.yM2e', 0.00, 800.00, 150.00, '2024-03-15 10:00:00', '2026-03-28 11:45:00');

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

--
-- Dumping data for table `employee_addresses`
--

INSERT INTO `employee_addresses` (`id`, `employee_id`, `full_name`, `phone`, `region`, `province`, `city`, `barangay`, `street`, `address`, `postal_code`, `is_default`, `latitude`, `longitude`) VALUES
('addr_001', 'EMP-001', 'Jason G', '+63 912 345 6789', 'NCR', 'Metro Manila', 'Manila', 'Barangay 123', '123 Taft Ave', '123 Taft Ave, Manila', '1000', 1, 14.5995000, 120.9842000),
('addr_003', 'EMP-002', 'Staff Primary', '+63 911 111 2222', 'Region IV-A', 'Laguna', 'Calamba', 'Parian', '456 National Hwy', 'Calamba, Laguna', '4027', 1, 14.2133000, 121.1633000);

-- --------------------------------------------------------

--
-- Table structure for table `employee_attendance`
--

CREATE TABLE `employee_attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `weekly_salary_id` int(10) UNSIGNED NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `date` date NOT NULL,
  `status` enum('full','half','absent') NOT NULL DEFAULT 'full',
  `overtime_hours` decimal(4,2) NOT NULL DEFAULT 0.00,
  `late_minutes` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `hours_worked` decimal(4,2) NOT NULL DEFAULT 0.00,
  `computed_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_holiday` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_attendance`
--

INSERT INTO `employee_attendance` (`id`, `weekly_salary_id`, `employee_id`, `date`, `status`, `overtime_hours`, `late_minutes`, `hours_worked`, `computed_salary`, `is_holiday`) VALUES
(1, 1, 'EMP-001', '2026-03-30', 'full', 2.00, 0, 8.00, 1150.00, 0),
(2, 1, 'EMP-001', '2026-03-31', 'full', 0.00, 0, 8.00, 850.00, 0),
(3, 1, 'EMP-001', '2026-04-01', 'half', 1.00, 0, 4.00, 575.00, 1),
(4, 1, 'EMP-001', '2026-04-02', 'full', 0.00, 0, 8.00, 850.00, 0),
(5, 1, 'EMP-001', '2026-04-03', 'full', 2.00, 30, 7.50, 1150.00, 0),
(6, 1, 'EMP-001', '2026-04-04', 'absent', 0.00, 0, 0.00, 0.00, 0),
(7, 1, 'EMP-001', '2026-04-05', 'absent', 0.00, 0, 0.00, 0.00, 0),
(8, 2, 'EMP-001', '2026-04-06', 'full', 0.00, 0, 8.00, 850.00, 0),
(9, 2, 'EMP-001', '2026-04-07', 'full', 2.00, 0, 8.00, 1150.00, 0),
(10, 2, 'EMP-001', '2026-04-08', 'full', 0.00, 0, 8.00, 850.00, 0),
(11, 2, 'EMP-001', '2026-04-09', 'full', 0.00, 0, 8.00, 850.00, 0),
(12, 2, 'EMP-001', '2026-04-10', 'full', 1.00, 0, 8.00, 1000.00, 0),
(13, 2, 'EMP-001', '2026-04-11', 'absent', 0.00, 0, 0.00, 0.00, 0),
(14, 2, 'EMP-001', '2026-04-12', 'absent', 0.00, 0, 0.00, 0.00, 0),
(15, 3, 'EMP-002', '2026-03-30', 'full', 0.00, 0, 8.00, 600.00, 0),
(16, 3, 'EMP-002', '2026-03-31', 'full', 2.00, 0, 8.00, 800.00, 0),
(17, 3, 'EMP-002', '2026-04-01', 'full', 1.00, 0, 8.00, 700.00, 0),
(18, 3, 'EMP-002', '2026-04-02', 'half', 0.00, 60, 3.00, 225.00, 0),
(19, 3, 'EMP-002', '2026-04-03', 'full', 2.00, 0, 8.00, 800.00, 0),
(20, 3, 'EMP-002', '2026-04-04', 'full', 0.00, 0, 8.00, 600.00, 0),
(21, 3, 'EMP-002', '2026-04-05', 'absent', 0.00, 0, 0.00, 0.00, 0);

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
(1, 'EMP-001', '+63 912 345 6789', 1),
(2, 'EMP-001', '+63 917 200 1001', 0),
(3, 'EMP-002', '+63 912 345 6780', 1),
(4, 'EMP-002', '+63 917 200 1002', 0),
(5, 'EMP-003', '+63 912 345 6788', 1),
(6, 'EMP-004', '+63 912 345 6789', 1);

-- --------------------------------------------------------

--
-- Table structure for table `employee_weekly_salary`
--

CREATE TABLE `employee_weekly_salary` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `week_start` date NOT NULL,
  `weekly_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `weekly_hours_total` decimal(6,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_weekly_salary`
--

INSERT INTO `employee_weekly_salary` (`id`, `employee_id`, `week_start`, `weekly_total`, `weekly_hours_total`) VALUES
(1, 'EMP-001', '2026-03-30', 4575.00, 35.50),
(2, 'EMP-001', '2026-04-06', 4700.00, 40.00),
(3, 'EMP-002', '2026-03-30', 3725.00, 43.00);

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

INSERT INTO `inventory_logs` (`id`, `employee_id`, `product_id`, `product_name`, `qty_added`, `cost`, `type`, `notes`, `date`) VALUES
('RL-001', 'EMP-001', 'P001', 'PPY Cup', 500, 1500.00, 'RESTOCK', 'Bulk restock for April start.', '2026-04-01 10:00:00'),
('RL-002', 'EMP-002', 'P002', 'Thinwall Container', 200, 800.00, 'RESTOCK', 'Emergency restock.', '2026-04-02 14:30:00'),
('RL-003', 'EMP-001', NULL, 'Utility - Ink Supply', 0, 2500.00, 'MISC', 'Industrial screen ink procurement.', '2026-04-02 16:00:00'),
('RL-004', 'EMP-001', 'P003', 'Meal Box (Standard)', 1000, 3000.00, 'RESTOCK', 'Weekly base stock.', '2026-03-31 09:15:00');

--
-- Triggers `inventory_logs`
--
DELIMITER $$
CREATE TRIGGER `trg_inventory_log_restock` AFTER INSERT ON `inventory_logs` FOR EACH ROW BEGIN
  IF NEW.type = 'RESTOCK' AND NEW.product_id IS NOT NULL AND NEW.qty_added > 0 THEN
    UPDATE products SET current_stock = current_stock + NEW.qty_added WHERE id = NEW.product_id;
  END IF;
  IF NEW.type = 'ADJUSTMENT' AND NEW.product_id IS NOT NULL THEN
    UPDATE products SET current_stock = current_stock + NEW.qty_added WHERE id = NEW.product_id;
  END IF;
END
$$
DELIMITER ;

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
  `used_count` int(11) NOT NULL DEFAULT 0,
  `minimum_quantity` int(11) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `marketing_promotions`
--

INSERT INTO `marketing_promotions` (`id`, `title`, `discount_type`, `discount_value`, `target_type`, `assigned_user_id`, `product_id`, `code`, `max_uses`, `used_count`, `minimum_quantity`, `expires_at`, `status`, `created_at`, `updated_at`) VALUES
('PROMO-001', 'VIP Laguna Client', 'unit', 1.50, 'specific_user', 'CUST-501', 'P001', 'LAGUNA300', 1, 0, 300, '2026-06-01 00:00:00', 'active', '2026-04-11 13:23:28', '2026-04-11 13:23:28'),
('PROMO-002', 'Welcome Discount', 'percentage', 10.00, 'all_users', NULL, NULL, 'WELCOME10', 100, 5, NULL, '2026-12-31 23:59:59', 'active', '2026-04-11 13:23:28', '2026-04-11 13:23:28');

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
  `reply_to_id` varchar(30) DEFAULT NULL,
  `is_edited` tinyint(1) NOT NULL DEFAULT 0,
  `original_text` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `sender_type`, `receiver_id`, `receiver_type`, `message`, `reply_to_id`, `is_edited`, `original_text`, `is_deleted`, `is_read`, `created_at`, `updated_at`) VALUES
('msg_1', 'EMP-001_CUST-501', 'EMP-001', 'employee', 'CUST-501', 'customer', 'Welcome to PIXS Printing Shop!', NULL, 0, NULL, 0, 1, '2026-04-11 21:29:57', '2026-04-11 21:29:57'),
('msg_2', 'EMP-001_CUST-501', 'CUST-501', 'customer', 'EMP-001', 'employee', 'Hi! I need printing.', NULL, 0, NULL, 0, 0, '2026-04-11 21:29:57', '2026-04-11 21:29:57');

--
-- Triggers `messages`
--
DELIMITER $$
CREATE TRIGGER `trg_update_last_message` AFTER INSERT ON `messages` FOR EACH ROW BEGIN
  UPDATE conversations
  SET last_message_id = NEW.id, updated_at = NOW()
  WHERE id = NEW.conversation_id;
END
$$
DELIMITER ;

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
(1, 'msg_1', 'CUST-501', 'customer', '👍');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(30) NOT NULL,
  `customer_id` varchar(20) NOT NULL,
  `discount_id` varchar(20) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_discount_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `delivery_method` varchar(100) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `complaint` text DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `admin_comment` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `orders`
--
DELIMITER $$
CREATE TRIGGER `trg_order_delivered` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
  IF OLD.status != 'DELIVERED' AND NEW.status = 'DELIVERED' THEN
    UPDATE products p
    JOIN order_items oi ON oi.product_id = p.id
    SET p.current_stock = p.current_stock - oi.quantity
    WHERE oi.order_id = NEW.id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` varchar(30) NOT NULL,
  `product_id` varchar(10) DEFAULT NULL,
  `variant_id` varchar(30) DEFAULT NULL,
  `screenplate_id` varchar(20) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `product_image` varchar(500) DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plate_setup_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `plate_print_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `custom_requirements` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_item_colors`
--

CREATE TABLE `order_item_colors` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_item_id` int(10) UNSIGNED NOT NULL,
  `color_name` varchar(100) NOT NULL,
  `color_hex` varchar(7) NOT NULL,
  `channel_label` enum('Primary','Secondary','Accent') NOT NULL DEFAULT 'Primary',
  `channel_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
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
(4, 'App\\Models\\Customer', 'CUST-503', 'customer-token', '90bd645cdf77957d10a607dafb030fb9f06b581dc1d338f180dfe90c19c6d858', '[\"role:customer\"]', '2026-04-11 20:29:27', '2026-05-11 20:05:59', '2026-04-11 20:05:59', '2026-04-11 20:29:27');

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

--
-- Dumping data for table `production_logs`
--

INSERT INTO `production_logs` (`id`, `employee_id`, `order_id`, `product_name`, `quantity`, `completed_at`) VALUES
('LOG-001', 'EMP-003', 'ORD-12347', 'Milktea Cup', 1000, '2026-04-05 10:30:00'),
('LOG-002', 'EMP-004', 'ORD-12349', 'Black Straw', 500, '2026-04-05 14:20:00');

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
  `raw_material_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `current_stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_threshold` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_order` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `main_image` varchar(500) DEFAULT NULL,
  `print_method` varchar(100) DEFAULT NULL,
  `is_need_screenplate` tinyint(1) NOT NULL DEFAULT 0,
  `is_need_color` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `short_description`, `long_description`, `best_for`, `base_price`, `raw_material_cost`, `current_stock`, `min_threshold`, `min_order`, `main_image`, `print_method`, `is_need_screenplate`, `is_need_color`) VALUES
('P001', 'CT001', 'PPY Cup', 'Standard PP cup for milktea and cold drinks — affordable and food-grade.', 'The PPY Cup is an everyday polypropylene cup built for high-volume milktea shops and cafes.', 'Milktea Shops, Coffee Houses, and Catering Events.', 2.85, 1.10, 10000, 500, 100, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P002', 'CT001', 'UCUP', 'Premium U-shaped PP cup — crystal clear with a modern profile.', 'The UCUP features a distinctive U-shaped design that enhances drink presentation.', 'Milktea Shops, Juice Bars, and Premium Cafes.', 2.95, 1.20, 5, 500, 100, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P003', 'CT001', 'Slim Cup', 'Sleek slim-profile PP cup — ergonomic grip, great for on-the-go drinks.', 'The Slim Cup is designed with a narrower diameter for a comfortable grip.', 'Premium Milktea Shops, Coffee Shops, and Takeaway Counters.', 3.80, 1.50, 5000, 300, 100, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P004', 'CT001', 'Doublewall Cup with Lid', 'Insulated doublewall cup with lid — keeps drinks hot or cold longer.', 'The Doublewall Cup features a dual-wall construction that provides superior insulation.', 'Coffee Shops, Hot Beverage Stalls, and Premium Milktea Outlets.', 7.00, 3.00, 4000, 200, 50, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P005', 'CT001', 'PET Cup 95mm', 'Crystal-clear PET cup with 95mm diameter opening — vibrant and recyclable.', 'The PET Cup (95mm) is made from polyethylene terephthalate, offering exceptional clarity.', 'Milktea Shops, Fruit Tea Stalls, and Specialty Drink Outlets.', 3.20, 1.40, 7000, 500, 100, 'https://images.unsplash.com/photo-1582636172536-0a3f25bcf977?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P006', 'CT001', 'PET Cup 98mm', 'Wide-mouth crystal-clear PET cup with 98mm diameter — great for toppings-heavy drinks.', 'The PET Cup (98mm) features a wider 98mm opening, perfect for drinks loaded with pearls.', 'Milktea Shops, Dessert Drinks, and Topping-Heavy Beverages.', 4.45, 1.80, 6000, 500, 100, 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80', 'Screen Print / Offset', 1, 1),
('P007', 'CT002', 'Dome Lid', 'Classic dome-shaped lid — fits standard 90mm and 98mm cup openings.', 'The Dome Lid features a raised dome design that accommodates whipped cream and pearls.', 'Milktea Cups, Smoothie Cups, and Topping-Heavy Drinks.', 1.30, 0.50, 15000, 1000, 200, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 'N/A', 0, 0),
('P008', 'CT002', 'Strawless Lid', 'Eco-friendly strawless lid — sip-directly design, fits 90mm, 95mm, and 98mm cups.', 'The Strawless Lid promotes sustainable drinking with its no-straw sip design.', 'Eco-Friendly Shops, Cold Brew, and Juice Bars.', 1.20, 0.45, 18000, 1000, 200, 'https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&q=80', 'N/A', 0, 0),
('P009', 'CT002', 'Flat Lid', 'Flat-profile lid — clean, minimal design for no-straw or straw-hole use.', 'The Flat Lid provides a clean, low-profile seal for standard cups.', 'Standard Milktea Cups, Coffee, and Cold Drinks.', 1.20, 0.40, 12000, 1000, 200, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 'N/A', 0, 0),
('P010', 'CT002', 'Conjoined Lid', 'Double-cup conjoined lid — connects two cups for easy carrying.', 'The Conjoined Lid is a unique dual-cup lid that connects two cups side by side.', 'Takeaway Orders, Couple Deals, and Events.', 1.90, 0.70, 5000, 300, 100, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80', 'N/A', 0, 0),
('P011', 'CT003', 'Black Straw', 'Sleek black PP straw — stylish and sturdy for all cup types.', 'The Black Straw is made from food-grade polypropylene in a classic matte black finish.', 'All Beverage Types, Milktea Shops, and Coffee Outlets.', 1.00, 0.30, 20000, 1000, 500, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80', 'N/A', 0, 0),
('P012', 'CT004', 'Paper Bowl', 'Eco-friendly paper bowl for soups, noodles, and hot meals — available in 6 sizes.', 'The Paper Bowl is crafted from food-grade paperboard with a PE-coated interior.', 'Food Stalls, Canteens, Delivery Kitchens, and Catering Events.', 2.40, 1.00, 12000, 500, 100, 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P013', 'CT005', 'Paper Cup', 'Single-wall paper cup for hot and cold drinks — available in 8 sizes.', 'Our Paper Cups are made from food-grade paperboard with a PE-lined interior.', 'Coffee Shops, Canteens, Events, and Takeaway Stalls.', 1.55, 0.65, 20000, 1000, 200, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80', 'Flexographic Print / Screen Print', 1, 1),
('P014', 'CT006', 'Spaghetti Box', 'Rectangular paper box sized perfectly for spaghetti and pasta servings.', 'The Spaghetti Box is a long, rectangular food-grade paper box for pasta.', 'Food Stalls, Canteens, School Tuck Shops, and Catering.', 3.90, 1.60, 5000, 300, 100, 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P015', 'CT006', 'Burger Box', 'Clamshell burger box — keeps burgers fresh, warm, and intact.', 'The Burger Box features a clamshell design that locks in heat.', 'Burger Stalls, Fast Food, and Food Delivery.', 3.72, 1.50, 5000, 300, 100, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P016', 'CT006', 'Meal Box', 'Standard paper meal box for rice and viand combos — available in 750cc and 880cc.', 'The Meal Box is the go-to container for rice meal servings.', 'Carinderias, Food Stalls, Catering, and Takeaway Counters.', 5.05, 2.00, 6000, 300, 100, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P017', 'CT006', 'High Meal Box', 'Tall-profile meal box — ideal for bulkier meals with heaping toppings.', 'The High Meal Box features greater height than a standard meal box.', 'Catering, Generous Meal Servings, and Food Stalls.', 5.25, 2.10, 4000, 300, 100, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P018', 'CT006', 'Lechon Take Out Bag', 'Heavy-duty grease-resistant bag for lechon and roasted meat takeout.', 'The Lechon Take Out Bag is built to handle greasy, heavy roasted meat servings.', 'Lechon Stalls, Roasted Chicken Shops, BBQ Counters, and Catering.', 2.90, 1.10, 5000, 300, 100, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P019', 'CT006', '2-Division Box', 'Two-compartment paper box — keeps rice and viand neatly separated.', 'The 2-Division Box features an internal divider that keeps rice and viand separate.', 'Carinderias, Combo Meals, Catering, and Food Stalls.', 5.40, 2.20, 4000, 300, 100, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1),
('P020', 'CT006', 'Hotdog Box', 'Elongated paper box designed to hold hotdog sandwiches and corn dogs.', 'The Hotdog Box is a narrow, elongated food-grade paper box for hotdog sandwiches.', 'Street Food Stalls, School Canteens, Fairs, and Events.', 2.80, 1.10, 5000, 300, 100, 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?auto=format&fit=crop&q=80', 'Flexographic Print', 1, 1);

--
-- Triggers `products`
--
DELIMITER $$
CREATE TRIGGER `trg_product_delete` AFTER DELETE ON `products` FOR EACH ROW BEGIN
  UPDATE categories
  SET count = (SELECT COUNT(*) FROM products WHERE category_id = OLD.category_id)
  WHERE id = OLD.category_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_insert` AFTER INSERT ON `products` FOR EACH ROW BEGIN
  UPDATE categories
  SET count = (SELECT COUNT(*) FROM products WHERE category_id = NEW.category_id)
  WHERE id = NEW.category_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_product_update` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
  IF OLD.category_id != NEW.category_id THEN
    UPDATE categories SET count = (SELECT COUNT(*) FROM products WHERE category_id = OLD.category_id) WHERE id = OLD.category_id;
    UPDATE categories SET count = (SELECT COUNT(*) FROM products WHERE category_id = NEW.category_id) WHERE id = NEW.category_id;
  END IF;
END
$$
DELIMITER ;

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
(34, 'P013', 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80', 2),
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
(48, 'P020', 'https://images.unsplash.com/photo-1612392166886-ee8475b03af2?auto=format&fit=crop&q=80', 0),
(49, 'P020', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', 1);

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
(69, 'P020', 'Food Grade'),
(70, 'P020', 'Grease-Resistant'),
(71, 'P020', 'Street Food'),
(72, 'P020', 'Elongated');

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
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`variant_id`, `product_id`, `size`, `width`, `height`, `price`, `stock`) VALUES
('V-DOME-90MM', 'P007', 'Standard (90mm)', '90mm', '25mm', 1.30, 8000),
('V-DOME-98MM', 'P007', 'Wide (98mm)', '98mm', '25mm', 1.30, 7000),
('V-DW-12OZ', 'P004', '12oz', '90mm', '110mm', 7.70, 2000),
('V-DW-16OZ', 'P004', '16oz', '90mm', '130mm', 8.20, 1000),
('V-DW-8OZ', 'P004', '8oz', '80mm', '90mm', 7.00, 1000),
('V-MB-750CC', 'P016', '750cc', '140mm', '55mm', 5.05, 3000),
('V-MB-880CC', 'P016', '880cc', '155mm', '60mm', 6.35, 3000),
('V-PB-220CC', 'P012', '220cc', '95mm', '55mm', 2.40, 2000),
('V-PB-260CC', 'P012', '260cc', '100mm', '58mm', 2.50, 2000),
('V-PB-320CC', 'P012', '320cc', '108mm', '62mm', 2.70, 2000),
('V-PB-390CC', 'P012', '390cc', '115mm', '65mm', 2.90, 2000),
('V-PB-520CC', 'P012', '520cc', '125mm', '70mm', 3.60, 2000),
('V-PB-750CC', 'P012', '750cc', '138mm', '78mm', 3.70, 2000),
('V-PC-10OZ', 'P013', '10oz', '84mm', '105mm', 1.85, 2500),
('V-PC-12OZ', 'P013', '12oz', '90mm', '112mm', 1.95, 2500),
('V-PC-16OZ', 'P013', '16oz', '90mm', '135mm', 2.40, 2500),
('V-PC-22OZ', 'P013', '22oz', '90mm', '155mm', 2.75, 2500),
('V-PC-3OZ', 'P013', '3oz', '62mm', '65mm', 1.81, 2500),
('V-PC-5OZ', 'P013', '5oz', '70mm', '78mm', 1.55, 2500),
('V-PC-65OZ', 'P013', '6.5oz', '76mm', '88mm', 1.60, 2500),
('V-PC-8OZ', 'P013', '8oz', '80mm', '96mm', 1.70, 2500),
('V-PET95-12OZ', 'P005', '12oz', '95mm', '100mm', 3.20, 2500),
('V-PET95-16OZ', 'P005', '16oz', '95mm', '122mm', 3.50, 3000),
('V-PET95-22OZ', 'P005', '22oz', '95mm', '148mm', 4.20, 1500),
('V-PET98-12OZ', 'P006', '12oz', '98mm', '98mm', 4.45, 2000),
('V-PET98-16OZ', 'P006', '16oz', '98mm', '118mm', 4.75, 2500),
('V-PET98-20OZ', 'P006', '20oz', '98mm', '140mm', 5.50, 1500),
('V-PPY-12OZ', 'P001', '12oz', '90mm', '100mm', 2.85, 3000),
('V-PPY-16OZ', 'P001', '16oz', '90mm', '122mm', 2.95, 5000),
('V-PPY-22OZ', 'P001', '22oz', '90mm', '145mm', 3.25, 2000),
('V-SLIM-16OZ', 'P003', '16oz', '80mm', '140mm', 3.80, 3000),
('V-SLIM-22OZ', 'P003', '22oz', '80mm', '165mm', 4.20, 2000),
('V-SLL-90MM', 'P008', 'Standard (90mm)', '90mm', '18mm', 1.20, 6000),
('V-SLL-95MM', 'P008', 'PET 95mm', '95mm', '18mm', 1.20, 6000),
('V-SLL-98MM', 'P008', 'PET 98mm', '98mm', '18mm', 1.20, 6000),
('V-UCUP-12OZ', 'P002', '12oz', '90mm', '100mm', 2.95, 2500),
('V-UCUP-16OZ', 'P002', '16oz', '90mm', '122mm', 3.00, 4000),
('V-UCUP-22OZ', 'P002', '22oz', '90mm', '145mm', 3.95, 1500);

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
('SP-FLAT-001', 'CUST-502', 'Flatscreen Meal Node', 650.00, 1, 2, 'Front', 'Front', '120mm x 90mm', 'Flatscreen photopolymer terminal for meal boxes.', 'https://images.unsplash.com/photo-1544391496-1ca7c97457cd?auto=format&fit=crop&q=80', 'For large flat surfaces only.'),
('SP-MH-002', 'CUST-501', 'Medium/High Power Plate', 550.00, 0, 3, 'Back-to-Back', 'Front,Back-to-Back,Triple Logo', '85mm x 65mm', 'High-velocity industrial mesh for 16-22oz variants.', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80', 'High durability mesh for high-volume cup production.'),
('SP-S-001', 'CUST-501', 'Standard Small Plate', 450.00, 0, 3, 'Front', 'Front,Back-to-Back,Triple Logo', '55mm x 45mm', 'Industrial Mesh 120T for small diameters.', 'https://images.unsplash.com/photo-1590422749897-47036da0b0ff?q=80', 'Industrial mesh for small profile prints.');

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
(1, 'SP-S-001', 'P001', 'V-PPY-12OZ', 2.50),
(2, 'SP-S-001', 'P002', 'V-UCUP-12OZ', 1.50),
(3, 'SP-MH-002', 'P001', 'V-PPY-16OZ', 1.70),
(4, 'SP-MH-002', 'P001', 'V-PPY-22OZ', 2.00),
(5, 'SP-FLAT-001', 'P015', NULL, 1.70),
(6, 'SP-FLAT-001', 'P012', 'V-PB-320CC', 1.20),
(7, 'SP-FLAT-001', 'P012', 'V-PB-520CC', 1.50);

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
(4, 'SP-FLAT-001', 'P001', NULL),
(5, 'SP-FLAT-001', 'P002', NULL),
(6, 'SP-FLAT-001', 'P003', NULL),
(3, 'SP-MH-002', 'P004', NULL),
(2, 'SP-S-001', 'P012', NULL),
(1, 'SP-S-001', 'P016', NULL);

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
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  ADD UNIQUE KEY `uq_emp_date` (`employee_id`,`date`),
  ADD KEY `weekly_salary_id` (`weekly_salary_id`);

--
-- Indexes for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employee_weekly_salary`
--
ALTER TABLE `employee_weekly_salary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_emp_week` (`employee_id`,`week_start`);

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
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

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
  ADD KEY `reply_to_id` (`reply_to_id`);

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
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `screenplate_id` (`screenplate_id`);

--
-- Indexes for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_order_item_channel` (`order_item_id`,`channel_order`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`);

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
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customer_contact_numbers`
--
ALTER TABLE `customer_contact_numbers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `customer_discounts`
--
ALTER TABLE `customer_discounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `deleted_accounts`
--
ALTER TABLE `deleted_accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `employee_weekly_salary`
--
ALTER TABLE `employee_weekly_salary`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_reactions`
--
ALTER TABLE `message_reactions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `product_gallery`
--
ALTER TABLE `product_gallery`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `product_tags`
--
ALTER TABLE `product_tags`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `screenplate_compatibility`
--
ALTER TABLE `screenplate_compatibility`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `screenplate_incompatible`
--
ALTER TABLE `screenplate_incompatible`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_4` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_addresses`
--
ALTER TABLE `customer_addresses`
  ADD CONSTRAINT `customer_addresses_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_contact_numbers`
--
ALTER TABLE `customer_contact_numbers`
  ADD CONSTRAINT `customer_contact_numbers_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_discounts`
--
ALTER TABLE `customer_discounts`
  ADD CONSTRAINT `customer_discounts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `customer_payment_methods`
--
ALTER TABLE `customer_payment_methods`
  ADD CONSTRAINT `customer_payment_methods_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_addresses`
--
ALTER TABLE `employee_addresses`
  ADD CONSTRAINT `employee_addresses_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_attendance`
--
ALTER TABLE `employee_attendance`
  ADD CONSTRAINT `employee_attendance_ibfk_1` FOREIGN KEY (`weekly_salary_id`) REFERENCES `employee_weekly_salary` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_attendance_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_contact_numbers`
--
ALTER TABLE `employee_contact_numbers`
  ADD CONSTRAINT `employee_contact_numbers_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_weekly_salary`
--
ALTER TABLE `employee_weekly_salary`
  ADD CONSTRAINT `employee_weekly_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`reply_to_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message_reactions`
--
ALTER TABLE `message_reactions`
  ADD CONSTRAINT `message_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_4` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_item_colors`
--
ALTER TABLE `order_item_colors`
  ADD CONSTRAINT `order_item_colors_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `production_logs`
--
ALTER TABLE `production_logs`
  ADD CONSTRAINT `production_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `product_gallery`
--
ALTER TABLE `product_gallery`
  ADD CONSTRAINT `product_gallery_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_tags`
--
ALTER TABLE `product_tags`
  ADD CONSTRAINT `product_tags_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `screenplates`
--
ALTER TABLE `screenplates`
  ADD CONSTRAINT `screenplates_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `screenplate_compatibility`
--
ALTER TABLE `screenplate_compatibility`
  ADD CONSTRAINT `screenplate_compatibility_ibfk_1` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_compatibility_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_compatibility_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `screenplate_incompatible`
--
ALTER TABLE `screenplate_incompatible`
  ADD CONSTRAINT `screenplate_incompatible_ibfk_1` FOREIGN KEY (`screenplate_id`) REFERENCES `screenplates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_incompatible_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_incompatible_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `screenplate_requests`
--
ALTER TABLE `screenplate_requests`
  ADD CONSTRAINT `screenplate_requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_requests_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `screenplate_requests_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`variant_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
