-- Enterprise-friendly schema matching requested structure
-- PostgreSQL 14+

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  telegram_id TEXT,
  discord_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scan TIMESTAMPTZ,
  CHECK (wallet_address ~* '^0x[a-f0-9]{40}$' OR wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' OR wallet_address ~* '^[a-z]{2,20}1[0-9a-z]{38,74}$')
);

CREATE TABLE IF NOT EXISTS airdrops (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  snapshot_date TIMESTAMPTZ,
  eligibility_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  token_price NUMERIC(28, 10) NOT NULL DEFAULT 0,
  total_value NUMERIC(28, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, token_symbol, chain)
);

CREATE TABLE IF NOT EXISTS eligibility_results (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  airdrop_id BIGINT NOT NULL REFERENCES airdrops(id) ON DELETE CASCADE,
  eligible BOOLEAN NOT NULL,
  amount NUMERIC(38, 18) NOT NULL DEFAULT 0,
  value_usd NUMERIC(28, 2) NOT NULL DEFAULT 0,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_address, airdrop_id),
  CHECK (amount >= 0),
  CHECK (value_usd >= 0)
);

CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  airdrop_id BIGINT NOT NULL REFERENCES airdrops(id) ON DELETE CASCADE,
  probability_score NUMERIC(5, 4) NOT NULL,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_value NUMERIC(28, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_address, airdrop_id),
  CHECK (probability_score >= 0 AND probability_score <= 1),
  CHECK (predicted_value >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enterprise_alert_type') THEN
    CREATE TYPE enterprise_alert_type AS ENUM (
      'new_airdrop',
      'eligibility_found',
      'value_threshold',
      'prediction_change',
      'scan_complete'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
  alert_type enterprise_alert_type NOT NULL,
  threshold NUMERIC(28, 2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (threshold IS NULL OR threshold >= 0)
);

CREATE OR REPLACE FUNCTION enterprise_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_airdrops_updated_at_enterprise ON airdrops;
CREATE TRIGGER trg_airdrops_updated_at_enterprise
BEFORE UPDATE ON airdrops
FOR EACH ROW
EXECUTE FUNCTION enterprise_set_updated_at();

DROP TRIGGER IF EXISTS trg_predictions_updated_at_enterprise ON predictions;
CREATE TRIGGER trg_predictions_updated_at_enterprise
BEFORE UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION enterprise_set_updated_at();

DROP TRIGGER IF EXISTS trg_alerts_updated_at_enterprise ON alerts;
CREATE TRIGGER trg_alerts_updated_at_enterprise
BEFORE UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION enterprise_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_last_scan ON users(last_scan DESC);
CREATE INDEX IF NOT EXISTS idx_airdrops_chain ON airdrops(chain);
CREATE INDEX IF NOT EXISTS idx_airdrops_snapshot_date ON airdrops(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_results_wallet ON eligibility_results(wallet_address);
CREATE INDEX IF NOT EXISTS idx_results_airdrop ON eligibility_results(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_results_scan_date ON eligibility_results(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_results_eligible ON eligibility_results(eligible);
CREATE INDEX IF NOT EXISTS idx_predictions_wallet ON predictions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_predictions_airdrop ON predictions(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_predictions_prob ON predictions(probability_score DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_alerts_last_sent ON alerts(last_sent DESC);

COMMIT;
