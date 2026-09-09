CREATE TYPE support_article_type AS ENUM ('faq', 'help', 'legal');

CREATE TABLE IF NOT EXISTS support_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type support_article_type NOT NULL,
  category varchar,
  title varchar NOT NULL,
  body text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
