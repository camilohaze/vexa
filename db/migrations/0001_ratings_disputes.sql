-- Migración: ratings de pedidos + disputas + contador de ratings
-- Aplicar en entornos donde DATABASE_SYNCHRONIZE=false (staging/prod).

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS rating_score int,
  ADD COLUMN IF NOT EXISTS rating_comment text;

ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS ratings_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verification jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_details jsonb;

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method varchar(32) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_courier ON payouts (courier_id);

CREATE TABLE IF NOT EXISTS job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role varchar(16) NOT NULL CHECK (sender_role IN ('ADMIN','COMPANY','COURIER')),
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_messages_job ON job_messages (job_id);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  subject varchar NOT NULL,
  last_message text,
  status varchar(16) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_PROGRESS','ESCALATED','CLOSED')),
  sla_hours int NOT NULL DEFAULT 24,
  assigned_to varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets (requester_id);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  opened_by varchar NOT NULL,
  subject text NOT NULL,
  detail text,
  status varchar(16) NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','ESCALATED')),
  priority varchar(8) NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW','MEDIUM','HIGH')),
  assigned_to varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_disputes_job ON disputes (job_id);
