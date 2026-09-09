CREATE TYPE notification_scope AS ENUM ('global','company','courier');
CREATE TYPE user_role AS ENUM ('ADMIN','COMPANY','COURIER');

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope notification_scope NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES couriers(id) ON DELETE CASCADE,
  audience user_role,
  icon varchar NOT NULL,
  title varchar NOT NULL,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  reference_id varchar,
  reference_type varchar,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(scope, company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_courier ON notifications(scope, courier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_global ON notifications(scope, created_at DESC);
