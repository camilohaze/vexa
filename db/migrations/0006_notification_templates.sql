CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  title varchar NOT NULL,
  body text NOT NULL,
  audience varchar NOT NULL DEFAULT 'all' CHECK (audience IN ('all','couriers','companies')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_title varchar NOT NULL,
  description text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  is_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
