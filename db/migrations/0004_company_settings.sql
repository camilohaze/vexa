CREATE TABLE IF NOT EXISTS company_settings (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  admin_email varchar,
  two_factor boolean NOT NULL DEFAULT false,
  language varchar NOT NULL DEFAULT 'es',
  currency varchar NOT NULL DEFAULT 'COP',
  address varchar,
  meta jsonb NOT NULL DEFAULT '{}'
);
