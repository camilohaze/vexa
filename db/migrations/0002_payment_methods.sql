CREATE TABLE IF NOT EXISTS company_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  method_type varchar NOT NULL CHECK (method_type IN ('card','bank','wallet')),
  label varchar NOT NULL,
  sub varchar,
  is_default boolean NOT NULL DEFAULT false,
  last4 varchar,
  brand varchar,
  provider_token varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_payment_methods_company_id ON company_payment_methods(company_id);
