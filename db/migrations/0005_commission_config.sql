CREATE TABLE IF NOT EXISTS commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_rate decimal(5,2) NOT NULL,
  tiers jsonb NOT NULL DEFAULT '[]',
  meta jsonb NOT NULL DEFAULT '{}'
);
