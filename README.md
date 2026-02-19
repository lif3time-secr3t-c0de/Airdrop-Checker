# Airdrop Checker

Airdrop Checker is a wallet eligibility platform for tracking multiple token airdrops, checking claim status, and sending alerts.

## Features

- Wallet eligibility checks across configured airdrops
- API backend with caching and rate limiting
- SQL schema for users, airdrops, eligibility results, and alerts
- Token price sync script (CoinGecko -> PostgreSQL)

## Commercial Terms

These commercial terms apply to paid/commercial use of this software and related services.

### Plans

- `Starter`: single environment, community support, fair-use limits
- `Business`: production use, higher limits, priority email support
- `Enterprise`: custom SLAs, dedicated support, negotiated usage terms

### Billing

- Billing cycle: monthly or annually (as agreed in order form)
- Invoices due: net 15 days unless otherwise specified
- Late payments may result in service suspension

### Usage Limits

- API and infrastructure usage may be rate-limited based on plan
- Excess usage may incur overage charges or throttling
- Abuse, scraping, or malicious traffic is prohibited

### Support

- Support channel and response times depend on subscribed plan
- Incident priority is assigned by severity and business impact

### Warranties and Liability

- Software is provided under the LICENSE terms
- No guarantee of uninterrupted service or airdrop eligibility accuracy
- Indirect, consequential, and special damages are excluded to the maximum extent permitted by law

### Termination

- Either party may terminate according to contract/order form
- Access may be revoked for material breach, non-payment, or abuse

### Data and Privacy

- Customer is responsible for lawful data collection and processing
- Sensitive keys/secrets must not be stored insecurely

## Contact Information

- Sales: `sales@airdropchecker.example`
- Support: `support@airdropchecker.example`
- Legal: `legal@airdropchecker.example`
- Website: `https://airdropchecker.example`

Replace the placeholder addresses above with your real contact details.

## Quick Start

1. Install backend dependencies:
   `npm install`
2. Copy env file:
   `cp .env.example .env` (or create `.env` manually on Windows)
3. Set `ETHERSCAN_API_KEY` in `.env`
4. Run backend:
   `npm run dev`

For API details, see `README-backend.md`.
