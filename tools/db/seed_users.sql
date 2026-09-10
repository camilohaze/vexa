WITH admin_user AS (
  INSERT INTO users (id, email, full_name, phone, password_hash, email_verified, role, provider, provider_id, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'admin@vexa.local', 'Vexa Admin', NULL, '$2b$10$fVJGxOLZWzyyIW724v5lbe3x0Qy5fePWRL0MRtP7DisiYst9KU2M6', true, 'ADMIN', 'EMAIL', 'admin@vexa.local', true, NOW(), NOW())
  RETURNING id
),
company_user AS (
  INSERT INTO users (id, email, full_name, phone, password_hash, email_verified, role, provider, provider_id, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'company@vexa.local', 'Vexa Company', '+57 300 000 0001', '$2b$10$fVJGxOLZWzyyIW724v5lbe3x0Qy5fePWRL0MRtP7DisiYst9KU2M6', true, 'COMPANY', 'EMAIL', 'company@vexa.local', true, NOW(), NOW())
  RETURNING id
),
courier_user AS (
  INSERT INTO users (id, email, full_name, phone, password_hash, email_verified, role, provider, provider_id, is_active, created_at, updated_at)
  VALUES (gen_random_uuid(), 'courier@vexa.local', 'Vexa Courier', '+57 300 000 0002', '$2b$10$fVJGxOLZWzyyIW724v5lbe3x0Qy5fePWRL0MRtP7DisiYst9KU2M6', true, 'COURIER', 'EMAIL', 'courier@vexa.local', true, NOW(), NOW())
  RETURNING id
)
INSERT INTO companies (id, name, tax_id, owner_id, is_active, created_at, updated_at)
SELECT gen_random_uuid(), 'Vexa Demo Company', 'VEXA-123', id, true, NOW(), NOW() FROM company_user;

INSERT INTO couriers (id, user_id, status, vehicle, rating, ratings_count, created_at, updated_at)
SELECT gen_random_uuid(), id, 'OFFLINE', 'MOTORCYCLE', 5.00, 0, NOW(), NOW() FROM courier_user;
