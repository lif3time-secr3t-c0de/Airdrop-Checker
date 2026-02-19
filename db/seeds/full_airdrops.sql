-- Seed 30+ major airdrops with average payout metadata.
-- Run after schema migration:
-- psql "$DATABASE_URL" -f db/seeds/full_airdrops.sql

INSERT INTO airdrops (project_key, project_name, chain_id, token_symbol, token_address, status, metadata)
VALUES
  ('UNI', 'Uniswap', 1, 'UNI', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 'ended', '{"avg_payout_usd":1200,"supports_etherscan_check":true}'::jsonb),
  ('OP', 'Optimism', 10, 'OP', '0x4200000000000000000000000000000000000042', 'ended', '{"avg_payout_usd":800,"supports_etherscan_check":true}'::jsonb),
  ('ARB', 'Arbitrum', 42161, 'ARB', '0x912ce59144191c1204e64559fe8253a0e49e6548', 'ended', '{"avg_payout_usd":1500,"supports_etherscan_check":true}'::jsonb),
  ('ENS', 'ENS', 1, 'ENS', '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72', 'ended', '{"avg_payout_usd":500,"supports_etherscan_check":true}'::jsonb),
  ('DYDX', 'dYdX', 1, 'DYDX', '0x92d6c1e31e14520e676a687f0a93788b716beff5', 'ended', '{"avg_payout_usd":700,"supports_etherscan_check":true}'::jsonb),
  ('1INCH', '1inch', 1, '1INCH', '0x111111111117dc0aa78b770fa6a738034120c302', 'ended', '{"avg_payout_usd":300,"supports_etherscan_check":true}'::jsonb),
  ('AAVE', 'Aave', 1, 'AAVE', '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', 'ended', '{"avg_payout_usd":1000,"supports_etherscan_check":true}'::jsonb),
  ('COMP', 'Compound', 1, 'COMP', '0xc00e94cb662c3520282e6f5717214004a7f26888', 'ended', '{"avg_payout_usd":600,"supports_etherscan_check":true}'::jsonb),
  ('SUSHI', 'SushiSwap', 1, 'SUSHI', '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', 'ended', '{"avg_payout_usd":400,"supports_etherscan_check":true}'::jsonb),
  ('CRV', 'Curve', 1, 'CRV', '0xd533a949740bb3306d119cc777fa900ba034cd52', 'ended', '{"avg_payout_usd":800,"supports_etherscan_check":true}'::jsonb),
  ('CVX', 'Convex', 1, 'CVX', '0x4e3fbd56cd56c3e6dffa66b113c6185b4426bf8c', 'ended', '{"avg_payout_usd":500,"supports_etherscan_check":true}'::jsonb),
  ('LOOKS', 'LooksRare', 1, 'LOOKS', '0xf4d2888d29d722226fafa5d9b24f9164c092421e', 'ended', '{"avg_payout_usd":300,"supports_etherscan_check":true}'::jsonb),
  ('BLUR', 'Blur', 1, 'BLUR', '0x5283d291dbcf85356a21ba090e6db59121208b44', 'ended', '{"avg_payout_usd":600,"supports_etherscan_check":true}'::jsonb),
  ('APT', 'Aptos', 0, 'APT', NULL, 'ended', '{"avg_payout_usd":2000,"supports_etherscan_check":false}'::jsonb),
  ('TIA', 'Celestia', 0, 'TIA', NULL, 'ended', '{"avg_payout_usd":1000,"supports_etherscan_check":false}'::jsonb),
  ('STRK', 'StarkNet', 0, 'STRK', NULL, 'ended', '{"avg_payout_usd":1500,"supports_etherscan_check":false}'::jsonb),
  ('ZK', 'zkSync', 324, 'ZK', NULL, 'ended', '{"avg_payout_usd":1200,"supports_etherscan_check":false}'::jsonb),
  ('ZRO', 'LayerZero', 1, 'ZRO', '0x6985884c4392d348587b19cb9eaaf157f13271cd', 'ended', '{"avg_payout_usd":2000,"supports_etherscan_check":true}'::jsonb),
  ('EIGEN', 'EigenLayer', 0, 'EIGEN', NULL, 'ended', '{"avg_payout_usd":1800,"supports_etherscan_check":false}'::jsonb),
  ('JTO', 'Jito', 0, 'JTO', NULL, 'ended', '{"avg_payout_usd":400,"supports_etherscan_check":false}'::jsonb),
  ('PYTH', 'Pyth', 0, 'PYTH', NULL, 'ended', '{"avg_payout_usd":300,"supports_etherscan_check":false}'::jsonb),
  ('JUP', 'Jupiter', 0, 'JUP', NULL, 'ended', '{"avg_payout_usd":500,"supports_etherscan_check":false}'::jsonb),
  ('TNSR', 'Tensor', 0, 'TNSR', NULL, 'ended', '{"avg_payout_usd":400,"supports_etherscan_check":false}'::jsonb),
  ('W', 'Wormhole', 0, 'W', NULL, 'ended', '{"avg_payout_usd":600,"supports_etherscan_check":false}'::jsonb),
  ('ETHFI', 'EtherFi', 1, 'ETHFI', NULL, 'ended', '{"avg_payout_usd":700,"supports_etherscan_check":false}'::jsonb),
  ('REZ', 'Renzo', 1, 'REZ', NULL, 'ended', '{"avg_payout_usd":300,"supports_etherscan_check":false}'::jsonb),
  ('KELP', 'Kelp', 1, 'KELP', NULL, 'ended', '{"avg_payout_usd":250,"supports_etherscan_check":false}'::jsonb),
  ('SWELL', 'Swell', 1, 'SWELL', NULL, 'ended', '{"avg_payout_usd":300,"supports_etherscan_check":false}'::jsonb),
  ('ENA', 'Ethena', 1, 'ENA', NULL, 'ended', '{"avg_payout_usd":800,"supports_etherscan_check":false}'::jsonb),
  ('SAGA', 'Saga', 0, 'SAGA', NULL, 'ended', '{"avg_payout_usd":500,"supports_etherscan_check":false}'::jsonb),
  ('MORE', 'Additional Major Airdrops', 0, NULL, NULL, 'upcoming', '{"avg_payout_usd":0,"supports_etherscan_check":false,"note":"+20 more can be added"}'::jsonb)
ON CONFLICT (project_key)
DO UPDATE SET
  project_name = EXCLUDED.project_name,
  chain_id = EXCLUDED.chain_id,
  token_symbol = EXCLUDED.token_symbol,
  token_address = EXCLUDED.token_address,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata;
