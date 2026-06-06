-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 06, 2026 at 03:41 AM
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
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(30) NOT NULL,
  `conversation_id` varchar(50) NOT NULL,
  `sender_id` varchar(20) NOT NULL,
  `sender_type` enum('employee','customer') NOT NULL,
  `receiver_id` varchar(20) NOT NULL,
  `receiver_type` enum('employee','customer') NOT NULL,
  `type_id` varchar(30) DEFAULT NULL,
  `message_type` enum('order','screenplate_request','payment_code','refund','expenditure') DEFAULT NULL,
  `message` text DEFAULT NULL,
  `reply_to_id` varchar(30) DEFAULT NULL,
  `original_text` text DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `is_email` tinyint(1) NOT NULL DEFAULT 0,
  `is_edited` tinyint(1) NOT NULL DEFAULT 0,
  `is_pinned` datetime DEFAULT NULL,
  `is_confirm` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `product_concern` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `sender_type`, `receiver_id`, `receiver_type`, `type_id`, `message_type`, `message`, `reply_to_id`, `original_text`, `is_read`, `is_email`, `is_edited`, `is_pinned`, `is_confirm`, `is_deleted`, `product_concern`, `created_at`, `updated_at`) VALUES
('msg_6D838fK9ih', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', NULL, NULL, 'hello world', NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, '2026-06-06 09:29:00', '2026-06-06 09:29:00'),
('msg_8eXgnw5hbI', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'ORD-ZCKHZUYV1F', 'order', 'review your shipping address', NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, '2026-06-06 01:28:48', '2026-06-06 01:28:48'),
('msg_B1oNR6SPbS', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', NULL, NULL, 'hehe', NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, '2026-06-06 09:35:50', '2026-06-06 09:35:50'),
('msg_cGSinMN57C', '1_CUST-503', 'CUST-503', 'customer', '1', 'employee', 'ORD-ZCKHZUYV1F', 'order', 'review your shipping address ORD-ZCKHZUYV1F', NULL, NULL, 0, 0, 0, NULL, 0, 0, 0, '2026-06-06 09:28:48', '2026-06-06 09:28:48');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `reply_to_id` (`reply_to_id`),
  ADD KEY `messages_message_type_type_id_index` (`message_type`,`type_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
