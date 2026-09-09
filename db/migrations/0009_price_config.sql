CREATE TABLE IF NOT EXISTS price_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base decimal(10,2) NOT NULL DEFAULT 8000,
  per_km decimal(10,2) NOT NULL DEFAULT 1500,
  per_kg decimal(10,2) NOT NULL DEFAULT 500,
  express_multiplier decimal(5,2) NOT NULL DEFAULT 1.35,
  same_day_multiplier decimal(5,2) NOT NULL DEFAULT 1.35
);
