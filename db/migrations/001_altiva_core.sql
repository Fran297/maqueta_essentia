CREATE TABLE IF NOT EXISTS altiva_clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  points_balance INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_points_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  event_key VARCHAR(128) NOT NULL,
  reason VARCHAR(32) NOT NULL,
  points_delta INT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_altiva_ledger_event (client_id, event_key),
  KEY idx_altiva_ledger_client_date (client_id, created_at),
  CONSTRAINT fk_altiva_ledger_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_otps (
  id CHAR(36) NOT NULL PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  purpose VARCHAR(24) NOT NULL,
  email VARCHAR(254) NOT NULL,
  points INT UNSIGNED NOT NULL,
  code_hash CHAR(64) NOT NULL,
  code_salt CHAR(32) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  KEY idx_altiva_otp_client_date (client_id, created_at),
  CONSTRAINT fk_altiva_otp_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_redemptions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  points INT UNSIGNED NOT NULL,
  discount_ars INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  cancelled_at DATETIME(3) NULL,
  KEY idx_altiva_redemption_client (client_id, expires_at, used_at),
  CONSTRAINT fk_altiva_redemption_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_orders (
  ticket_id VARCHAR(24) NOT NULL PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  buyer_json JSON NOT NULL,
  items_json JSON NOT NULL,
  subtotal_ars INT UNSIGNED NOT NULL,
  shipping_ars INT UNSIGNED NOT NULL,
  transfer_discount_ars INT UNSIGNED NOT NULL DEFAULT 0,
  points_discount_ars INT UNSIGNED NOT NULL DEFAULT 0,
  points_redeemed INT UNSIGNED NOT NULL DEFAULT 0,
  total_ars INT UNSIGNED NOT NULL,
  email_sent_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_altiva_order_client_date (client_id, created_at),
  CONSTRAINT fk_altiva_order_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_surveys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL UNIQUE,
  aesthetics TEXT NOT NULL,
  experiences TEXT NOT NULL,
  suggestions TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_altiva_survey_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_incidents (
  ticket_id VARCHAR(24) NOT NULL PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  topic VARCHAR(80) NOT NULL,
  details TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_altiva_incident_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS altiva_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  client_id BIGINT UNSIGNED NOT NULL,
  ticket_id VARCHAR(24) NOT NULL UNIQUE,
  rating TINYINT UNSIGNED NOT NULL,
  review_text VARCHAR(1200) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_altiva_review_client FOREIGN KEY (client_id) REFERENCES altiva_clients(id),
  CONSTRAINT fk_altiva_review_order FOREIGN KEY (ticket_id) REFERENCES altiva_orders(ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
