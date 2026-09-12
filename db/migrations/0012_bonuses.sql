CREATE TABLE IF NOT EXISTS bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  type varchar(24) NOT NULL CHECK (type IN ('LEVEL_MULTIPLIER','WEEKLY_QUEST')),
  description varchar(160) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonuses_courier ON bonuses (courier_id);
