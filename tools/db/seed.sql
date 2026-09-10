INSERT INTO price_config (base, per_km, per_kg, express_multiplier, same_day_multiplier)
VALUES (8000, 1500, 500, 1.35, 1.35);

INSERT INTO commission_config (base_rate, tiers, meta)
VALUES (10.00, '[{"max": 100000, "rate": 10}, {"max": 500000, "rate": 8}, {"max": null, "rate": 6}]'::jsonb, '{}'::jsonb);
