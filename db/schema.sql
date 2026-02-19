-- PostgreSQL schema for users, airdrops, eligibility results, and alerts.
-- Compatible with Postgres 14+.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'airdrop_status') THEN
    CREATE TYPE airdrop_status AS ENUM ('upcoming', 'active', 'ended', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'eligibility_source') THEN
    CREATE TYPE eligibility_source AS ENUM ('api', 'snapshot', 'manual', 'import');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
    CREATE TYPE alert_type AS ENUM ('eligibility_found', 'claim_window_open', 'claim_deadline', 'claim_status_changed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_channel') THEN
    CREATE TYPE alert_channel AS ENUM ('email', 'sms', 'webhook', 'push', 'telegram', 'discord');
  END IF;
END $$;

ALTER TYPE alert_channel ADD VALUE IF NOT EXISTS 'telegram';
ALTER TYPE alert_channel ADD VALUE IF NOT EXISTS 'discord';

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (position('@' in email) > 1)
);

CREATE TABLE IF NOT EXISTS airdrops (
  id BIGSERIAL PRIMARY KEY,
  project_key TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  token_symbol TEXT,
  token_address TEXT,
  claim_url TEXT,
  status airdrop_status NOT NULL DEFAULT 'active',
  snapshot_at TIMESTAMPTZ,
  claim_starts_at TIMESTAMPTZ,
  claim_ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (token_address IS NULL OR token_address ~* '^0x[a-f0-9]{40}$'),
  CHECK (claim_ends_at IS NULL OR claim_starts_at IS NULL OR claim_ends_at >= claim_starts_at)
);

CREATE TABLE IF NOT EXISTS user_wallets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL DEFAULT 1,
  label TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, wallet_address, chain_id),
  CHECK (wallet_address ~* '^0x[a-f0-9]{40}$')
);

CREATE TABLE IF NOT EXISTS eligibility_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  wallet_id BIGINT REFERENCES user_wallets(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  airdrop_id BIGINT NOT NULL REFERENCES airdrops(id) ON DELETE CASCADE,
  is_eligible BOOLEAN NOT NULL,
  claimable_amount NUMERIC(38, 18) NOT NULL DEFAULT 0,
  claimed_amount NUMERIC(38, 18) NOT NULL DEFAULT 0,
  claim_tx_hash TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source eligibility_source NOT NULL DEFAULT 'api',
  confidence_score NUMERIC(5, 2),
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_address, airdrop_id),
  CHECK (wallet_address ~* '^0x[a-f0-9]{40}$'),
  CHECK (claimable_amount >= 0),
  CHECK (claimed_amount >= 0),
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100))
);

CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  airdrop_id BIGINT REFERENCES airdrops(id) ON DELETE CASCADE,
  wallet_id BIGINT REFERENCES user_wallets(id) ON DELETE CASCADE,
  wallet_address TEXT,
  type alert_type NOT NULL,
  channel alert_channel NOT NULL,
  destination TEXT NOT NULL,
  threshold_amount NUMERIC(38, 18),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (wallet_address IS NULL OR wallet_address ~* '^0x[a-f0-9]{40}$'),
  CHECK (threshold_amount IS NULL OR threshold_amount >= 0)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_airdrops_updated_at ON airdrops;
CREATE TRIGGER trg_airdrops_updated_at
BEFORE UPDATE ON airdrops
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER trg_user_wallets_updated_at
BEFORE UPDATE ON user_wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_eligibility_results_updated_at ON eligibility_results;
CREATE TRIGGER trg_eligibility_results_updated_at
BEFORE UPDATE ON eligibility_results
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON alerts;
CREATE TRIGGER trg_alerts_updated_at
BEFORE UPDATE ON alerts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_airdrops_status ON airdrops(status);
CREATE INDEX IF NOT EXISTS idx_airdrops_chain_id ON airdrops(chain_id);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_address ON user_wallets(wallet_address);

CREATE INDEX IF NOT EXISTS idx_eligibility_results_user_id ON eligibility_results(user_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_wallet_address ON eligibility_results(wallet_address);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_airdrop_id ON eligibility_results(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_checked_at ON eligibility_results(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_eligible ON eligibility_results(is_eligible) WHERE is_eligible = TRUE;

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_airdrop_id ON alerts(airdrop_id);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_alerts_last_sent_at ON alerts(last_sent_at);

COMMIT;
