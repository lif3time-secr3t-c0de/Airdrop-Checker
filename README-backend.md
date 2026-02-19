# Airdrop Checker Backend

## Setup

1. Copy `.env.example` to `.env`.
2. Set `ETHERSCAN_API_KEY`.
3. Install dependencies:

```bash
npm install
```

4. Start server:

```bash
npm run dev
```

## API Routes

- `GET /api/health`
- `GET /api/airdrops`
- `GET /api/airdrops/chains`
- `POST /api/airdrops/check`
- `POST /api/predictions/eligibility`
- `POST /api/admin/predictions/train` (admin key optional if configured)
- `POST /api/portfolio/scan`
- `POST /api/portfolio/export.csv`
- `POST /api/alerts/subscribe`
- `POST /api/alerts/test`
- `GET /api/analytics/historical?wallet=...`
- `GET /api/tax/report.csv?wallet=...&year=2026`
- `GET /api/integrations/catalog`
- `GET /api/integrations/status`
- `GET /api/enterprise/branding`
- `PUT /api/enterprise/branding`
- `POST /api/enterprise/bulk/jobs` (JSON/CSV wallets, up to 10k)
- `GET /api/enterprise/bulk/jobs/:jobId`
- `GET /api/enterprise/bulk/jobs/:jobId/export.json`
- `POST /api/enterprise/bulk/from-database`
- `GET /api/enterprise/custom-airdrops`
- `POST /api/enterprise/custom-airdrops`
- `POST /api/enterprise/custom-airdrops/:key/evaluate`
- `GET /api/enterprise/analytics/overview`
- `GET /api/enterprise/sla/status`
- `GET /api/enterprise/private/check?wallet=...`
- `GET /api/admin/metrics`
- `GET /api/admin/usage/timeseries?hours=24`

## Check Route Payload

```json
{
  "wallets": [
    "0x7e57d004f9f4d1f2dce447f7dfdf9f9ce17ccf11",
    "0x5f3f51f4f39c265d8f9b4a11f0473a4e83974944"
  ],
  "includeTransfers": true
}
```

## Notes

- Includes a config list of 30 airdrop campaigns in `src/config/airdrops.js`.
- Multi-chain providers supported: Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Chain, Solana, Cosmos.
- Includes a full 30+ major airdrop seed in `db/seeds/full_airdrops.sql` with average payout metadata.
- Uses in-memory TTL caching for Etherscan requests and response payloads.
- Uses route rate-limiting for `POST /api/airdrops/check`.
- Uses ML-based eligibility prediction (logistic regression) when enough DB training data exists.
- Falls back to heuristic scoring when training data is insufficient or DB is unavailable.
- Admin route can be protected with `ADMIN_API_KEY` header (`x-admin-key`).
- If `DATABASE_URL` is set, admin metrics include user/earnings/alerts data from PostgreSQL.

### Chain API Keys

Configure as needed:

- `ETHERSCAN_API_KEY`
- `ARBISCAN_API_KEY`
- `OPTIMISTIC_ETHERSCAN_API_KEY`
- `BASESCAN_API_KEY`
- `POLYGONSCAN_API_KEY`
- `BSCSCAN_API_KEY`
- `SOLANAFM_API_KEY`
- `MINTSCAN_API_KEY`

If a chain adapter lacks API key or mapping data, that airdrop result is returned with `unsupported: true` and an explanatory `reason`.
Supported wallet formats for requests: EVM (`0x...`), Solana (base58), Cosmos (bech32).

## Real-Time Scanning (WebSocket)

- WebSocket endpoint: `ws://localhost:4000/ws`
- Subscribe message:

```json
{
  "type": "subscribe_scan",
  "wallets": ["0x7e57d004f9f4d1f2dce447f7dfdf9f9ce17ccf11"],
  "intervalMs": 30000,
  "includeTransfers": true
}
```

- Server pushes `scan_result` messages with totals and wallet breakdown.

## Professional Modules

- Portfolio integration: scan many wallets and export CSV.
- Alert system: email/sms/push placeholders, Telegram + Discord/webhook delivery support.
- Historical tracking: missed airdrop analytics and improvement suggestions.
- Tax reporting: CSV with eligibility date, FMV proxy, and taxable income baseline.

## Enterprise Modules

- White-label settings (branding, logo URL, custom domain flags) via enterprise API.
- Bulk scanning jobs with progress tracking (up to 10,000 wallets per job).
- CSV upload support through `csvText` payload field in bulk jobs endpoint.
- JSON export of bulk scan results.
- Database wallet ingestion (`user_wallets` -> bulk scan job).
- Custom airdrops and custom rule evaluation endpoints.
- Enterprise analytics (total value found, user stats, popular wallets, revenue estimate).
- SLA status endpoint (uptime + target metadata).
- Private API routes protected by `x-enterprise-key`.

## API Integrations (Free Tier Catalog)

Integrated catalog includes:

- Etherscan, BscScan, Polygonscan, Arbiscan, Optimistic Etherscan, Basescan
- CoinGecko
- The Graph, Moralis, Covalent
- Alchemy, Infura, QuickNode
- SolanaFM
- Flipside Crypto, Dune Analytics

Use:

- `GET /api/integrations/catalog` for limits + required env keys
- `GET /api/integrations/status` for configured/healthy snapshot

### Enterprise Auth Header

- `x-enterprise-key: <ENTERPRISE_API_KEY>`
- Falls back to `x-admin-key` when `ENTERPRISE_API_KEY` is not set.

## Prediction API Payload

```json
{
  "wallets": [
    "0x7e57d004f9f4d1f2dce447f7dfdf9f9ce17ccf11"
  ],
  "airdropKeys": ["UNI", "ARB", "ENS"],
  "forceRetrain": false
}
```

The response includes probability, confidence, and likely-eligible boolean for each wallet-airdrop pair.
It also includes AI-enhanced fields:

- `predictionText` (e.g. "Wallet X has 85% chance for zkSync airdrop")
- `eligibilityScore` (0-100)
- `scoreColor` (`green|yellow|red`)
- `recommendations` (top 5 actions)
- `potentialValueIfQualifiedUsd`
- `expectedValueUsd`

## Admin Dashboard

- Open `admin.html` in the browser.
- It polls `/api/admin/metrics` every 30 seconds.
- Enter `ADMIN_API_KEY` in the dashboard input if route protection is enabled.

## Price Updater Script (Python)

Fetches token prices from CoinGecko and stores them in `airdrops.metadata`:

- `coingecko_id`
- `latest_price_usd`
- `price_source`
- `price_updated_at`

Install Python deps:

```bash
pip install -r scripts/requirements.txt
```

Run:

```bash
python scripts/update_token_prices.py
```

Dry-run:

```bash
python scripts/update_token_prices.py --dry-run
```

Required env var:

- `DATABASE_URL`

Load full airdrop seed:

```bash
psql "$DATABASE_URL" -f db/seeds/full_airdrops.sql
```

Apply enterprise 5-table schema (users/airdrops/results/predictions/alerts):

```bash
psql "$DATABASE_URL" -f db/schema_enterprise.sql
```
