-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 04, 2026 at 02:06 AM
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
('PAY-50239', 'CUST-503', 'bank', '•••••••6355', NULL, 0, '2026-05-29 05:37:09', '2026-06-02 04:21:01', NULL, 'BDO'),
('PAY-81816', 'CUST-503', 'credit_card', '••••••••••6543', NULL, 1, '2026-05-29 05:37:09', '2026-06-02 04:21:01', 'Visa', NULL),
('PAY-91219', 'CUST-503', 'ewallet', '•••••••6355', NULL, 0, '2026-05-29 05:37:09', '2026-06-02 04:21:01', 'GCash', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer_payment_methods`
--
ALTER TABLE `customer_payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
