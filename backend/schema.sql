CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'merchant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  from_account_id INT NOT NULL REFERENCES accounts(id),
  to_account_id INT NOT NULL REFERENCES accounts(id),
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id SERIAL PRIMARY KEY,
  payment_id INT NOT NULL REFERENCES payments(id),
  account_id INT NOT NULL REFERENCES accounts(id),
  amount_cents INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
