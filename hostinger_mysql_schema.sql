-- ============================================================================
-- ALTURA BAR POS - ESQUEMA OPCIONAL PARA HOSTINGER MYSQL / phpMyAdmin
-- Úsalo SOLO si decides hospedar la base de datos dentro del MySQL de Hostinger
-- en lugar de Supabase (PostgreSQL).
-- ============================================================================

CREATE TABLE IF NOT EXISTS `business_profiles` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL DEFAULT 'ALTURA',
  `tagline` VARCHAR(200) DEFAULT 'Andean Tapas Bar',
  `sector` VARCHAR(60) DEFAULT 'bar',
  `logo_url` TEXT,
  `brand_color` VARCHAR(20) DEFAULT '#ea580c',
  `currency_symbol` VARCHAR(10) DEFAULT 'S/.',
  `categories_json` JSON,
  `is_configured` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ingredients` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `name` VARCHAR(140) NOT NULL,
  `category` VARCHAR(60) NOT NULL,
  `unit` VARCHAR(40) NOT NULL,
  `package_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `volume_per_unit_ml` DECIMAL(10,2) NOT NULL DEFAULT 750.00,
  `initial_stock_units` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `current_stock_units` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `min_alert_units` DECIMAL(10,2) NOT NULL DEFAULT 2.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktails` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `name` VARCHAR(140) NOT NULL,
  `category` VARCHAR(60) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `description` TEXT,
  `illustration_key` VARCHAR(60) DEFAULT 'pisco-sour',
  `enabled_for_event` TINYINT(1) NOT NULL DEFAULT 1,
  `color_gradient` VARCHAR(120) DEFAULT '',
  `glass_type` VARCHAR(40) DEFAULT 'rocks',
  `image_url` TEXT,
  `recipe_json` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `name` VARCHAR(140) NOT NULL,
  `date` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `initial_ingredients_snapshot` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `closed_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(80) NOT NULL,
  `order_type` VARCHAR(20) NOT NULL DEFAULT 'venta',
  `payment_method` VARCHAR(30) DEFAULT 'yape_plin',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT,
  `status` VARCHAR(30) NOT NULL DEFAULT 'preparing',
  `printed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_orders_event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(80) NOT NULL,
  `cocktail_id` VARCHAR(80),
  `cocktail_name` VARCHAR(140) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  INDEX `idx_order_items_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wastes` (
  `id` VARCHAR(80) NOT NULL PRIMARY KEY,
  `event_id` VARCHAR(80) NOT NULL,
  `ingredient_id` VARCHAR(80) NULL,
  `cocktail_id` VARCHAR(80) NULL,
  `name` VARCHAR(140) NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(30) NOT NULL,
  `reason` VARCHAR(40) NOT NULL,
  `estimated_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wastes_event_id` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
