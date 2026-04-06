-- =====================================================
-- EV Charge Pro - Database Schema
-- Database: evcharging
-- Run this in phpMyAdmin or MySQL CLI
-- =====================================================

CREATE DATABASE IF NOT EXISTS evcharging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE evcharging;

-- =====================================================
-- STATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Mysuru',
  charger_types VARCHAR(100) NOT NULL DEFAULT 'Type2',
  total_slots INT NOT NULL DEFAULT 4,
  power_kw DECIMAL(6,1) NOT NULL DEFAULT 22.0,
  price_per_hour DECIMAL(8,2) NOT NULL DEFAULT 10.00,
  amenities VARCHAR(255) DEFAULT '',
  status ENUM('active','maintenance','offline') NOT NULL DEFAULT 'active',
  rating DECIMAL(3,2) DEFAULT 4.00,
  total_reviews INT DEFAULT 0,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TIME SLOTS
-- =====================================================
CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_slot (station_id, slot_date, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- BOOKINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_token VARCHAR(80) NOT NULL UNIQUE,
  station_id INT NOT NULL,
  slot_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_email VARCHAR(150) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(25) NOT NULL,
  vehicle_type ENUM('2-Wheeler','4-Wheeler','SUV','Bus','Other') DEFAULT '4-Wheeler',
  user_ip VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  charger_type VARCHAR(50) DEFAULT 'Type2',
  duration_hours INT DEFAULT 1,
  amount DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  status ENUM('confirmed','cancelled','completed') DEFAULT 'confirmed',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE RESTRICT,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE RESTRICT,
  INDEX idx_token (booking_token),
  INDEX idx_ip_date (user_ip, booking_date),
  INDEX idx_status (status),
  INDEX idx_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  booking_token VARCHAR(80) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT NULL,
  reviewer_name VARCHAR(80) DEFAULT 'Anonymous',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (booking_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- SEED STATIONS (Mysuru)
-- =====================================================
INSERT INTO stations (name, address, city, charger_types, total_slots, power_kw, price_per_hour, amenities, status, rating, total_reviews, latitude, longitude) VALUES
('Mysuru Central EV Hub',      'MG Road, Near Devaraja Market, Mysuru',        'Mysuru', 'CCS,CHAdeMO,Type2', 8, 100.0, 25.00, 'WiFi,Cafe,Restroom,Parking,CCTV',      'active',      4.8, 124, 12.3051, 76.6551),
('Green Charge - Vijayanagar', 'Vijayanagar 2nd Stage, Mysuru',                'Mysuru', 'Type2,CCS',         6,  50.0, 18.00, 'WiFi,Parking,Restroom',                'active',      4.5,  89, 12.3200, 76.6100),
('Forum Mall Fast Charge',     'Forum Mall, Nazarbad Main Road, Mysuru',       'Mysuru', 'CCS,CHAdeMO',       4, 150.0, 35.00, 'WiFi,Cafe,Shopping,Restroom,Parking',  'active',      4.7, 203, 12.2958, 76.6394),
('Railway Station SuperCharge','Near Mysuru Railway Station, Irwin Road',      'Mysuru', 'CCS,Type2,Type1',   3, 120.0, 30.00, 'WiFi,Restroom,Waiting Lounge',         'active',      4.3,  67, 12.3086, 76.5735),
('Brindavan EV Point',         'KRS Road, Near Brindavan Gardens, Mysuru',     'Mysuru', 'Type2',             5,  22.0, 12.00, 'Parking,Restroom,Greenery',            'active',      4.6,  45, 12.4244, 76.5728),
('Infosys Campus Charger',     'Infosys STP, Hebbal Industrial Area, Mysuru',  'Mysuru', 'Type2,CCS',         6,  50.0, 15.00, 'WiFi,Cafe,Parking,AC Lounge',          'maintenance', 4.4,  78, 12.3394, 76.6042),
('Gokulam Eco Charge',         'Gokulam 3rd Stage, Mysuru',                    'Mysuru', 'Type2,CHAdeMO',     4,  22.0, 10.00, 'Parking,WiFi',                         'active',      4.2,  32, 12.3500, 76.6200),
('Airport Road PowerStop',     'Outer Ring Road, Near Mysuru Airport',         'Mysuru', 'CCS,CHAdeMO,Type2', 6, 100.0, 28.00, 'WiFi,Cafe,Restroom,Parking,24x7',      'active',      4.9, 156, 12.2300, 76.6500);

SELECT CONCAT('Setup complete! ', COUNT(*), ' stations added to evcharging DB.') AS result FROM stations;
