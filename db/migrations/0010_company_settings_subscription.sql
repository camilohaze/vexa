ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS plan varchar,
  ADD COLUMN IF NOT EXISTS plan_price decimal(10,2),
  ADD COLUMN IF NOT EXISTS renewal_at timestamptz;
