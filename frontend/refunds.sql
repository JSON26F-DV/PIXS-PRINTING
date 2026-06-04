-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 04, 2026 at 03:12 AM
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
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` varchar(30) NOT NULL,
  `customer_id` varchar(20) DEFAULT NULL,
  `order_id` varchar(30) DEFAULT NULL,
  `payment_id` varchar(30) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refunds`
--

INSERT INTO `refunds` (`id`, `customer_id`, `order_id`, `payment_id`, `message`, `amount`, `status`, `processed_at`, `created_at`, `updated_at`) VALUES
('ref_2UMSw9WPoz', 'CUST-503', 'ORD-O2JVAT548Z', NULL, 'ligma', 240.00, 'completed', '2026-06-03 16:07:15', '2026-06-03 06:31:10', '2026-06-03 16:07:15'),
('ref_paqP8AMi0o', 'CUST-503', 'ORD-3IRZCCY8PF', NULL, 'hello world', 585.00, 'completed', '2026-06-03 16:44:45', '2026-06-03 16:44:43', '2026-06-03 16:44:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `refunds_customer_id_index` (`customer_id`),
  ADD KEY `refunds_order_id_index` (`order_id`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `customer_payment_methods` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
