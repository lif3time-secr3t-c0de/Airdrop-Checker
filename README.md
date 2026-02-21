# Airdrop Checker - Multi-Chain Eligibility Tool

![License](https://img.shields.io/badge/License-Custom-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Status](https://img.shields.io/badge/status-live-success)

## Live Demo
**Website:** https://airdrop-checker-ten.vercel.app

**Admin Dashboard:** https://airdrop-checker-ten.vercel.app/admin.html

**API Base URL:** https://airdrop-checker-api.onrender.com

---

## Overview

Airdrop Checker is a technical tool for checking cryptocurrency airdrop eligibility across multiple blockchains. It uses machine learning to analyze wallet activity and predict eligibility probabilities.

### Technical Features

| Feature | Description |
|---------|-------------|
| Multi-Chain Support | Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Chain, Solana, Cosmos |
| ML Predictions | Logistic regression models predict eligibility (0-100%) |
| Portfolio Scanner | Batch scanning for multiple wallets (up to 10,000) |
| Real-Time Updates | WebSocket connection for live scanning |
| Admin Dashboard | API usage metrics and system monitoring |
| CSV Export | Portfolio data export functionality |
| Alert System | Telegram and Discord webhook notifications |
| Enterprise Features | White-label solutions and custom rules |

---

## Tech Stack

**Backend:**
- Node.js / Express
- PostgreSQL
- WebSocket
- Machine Learning (Logistic Regression)

**Frontend:**
- HTML5 / CSS3
- JavaScript
- Responsive Design

**Infrastructure:**
- Render (Backend API)
- Vercel (Frontend)
- Supabase (PostgreSQL)
- cron-job.org (Uptime monitoring)

---

## Supported Networks

| Network | API Provider | Status |
|---------|--------------|--------|
| Ethereum | Etherscan | ✅ Live |
| Arbitrum | Arbiscan | ✅ Live |
| Optimism | Optimistic Etherscan | ✅ Live |
| Base | Basescan | ✅ Live |
| Polygon | Polygonscan | ✅ Live |
| BNB Chain | BscScan | ✅ Live |
| Solana | SolanaFM | ✅ Beta |
| Cosmos | Mintscan | ⚠️ Development |

---

## Airdrop Database

The tool checks eligibility for 50+ historical airdrops including:

Uniswap (UNI), Arbitrum (ARB), Optimism (OP), ENS, dYdX, 1inch, Aave, Compound, SushiSwap, Curve, Convex, LooksRare, Blur, Aptos, Celestia, StarkNet, zkSync, LayerZero, EigenLayer, Jito, Pyth, Jupiter, Tensor, Wormhole, EtherFi, Renzo, Kelp, Swell, Ethena, Saga, and more.

---

## ML Prediction Features

| Feature | Description |
|---------|-------------|
| Eligibility Score | 0-100% probability per airdrop |
| Confidence Scoring | Statistical confidence levels |
| Recommendation Engine | Action items based on wallet analysis |
| Value Estimates | Historical average projections |

---

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/airdrops` | List all tracked airdrops |
| GET | `/api/airdrops/chains` | Supported networks |
| POST | `/api/airdrops/check` | Check wallet eligibility |
| POST | `/api/portfolio/scan` | Multi-wallet scanning |
| POST | `/api/portfolio/export.csv` | CSV export |
| POST | `/api/predictions/eligibility` | ML predictions |
| GET | `/api/integrations/catalog` | API integrations list |
| GET | `/api/admin/metrics` | System metrics |
| POST | `/api/alerts/subscribe` | Alert subscriptions |
| GET | `/api/analytics/historical` | Historical analysis |
| GET | `/api/tax/report.csv` | Tax report generation |

**WebSocket Endpoint:** `wss://airdrop-checker-api.onrender.com/ws`

---

## License and Commercial Use

**Free for Personal Use:**
- Individual developers
- Learning and experimentation
- Personal projects
- Non-commercial applications

**Commercial Licensing:**
Organizations using this software for revenue-generating activities require a commercial license.

Commercial License Includes:
- Permanent usage rights
- Legal agreement
- Invoice documentation
- Priority support
- Custom modification options

**Contact for Licensing:**
📧 thisiswaliraza@gmail.com

---

## Local Development

```bash
# Clone repository
git clone https://github.com/lif3time-secr3t-c0de/Airdrop-Checker.git
cd Airdrop-Checker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your API keys to .env

# Start development server
npm run dev

# API health check
# http://localhost:4000/api/health
```

### Required API Keys
- Etherscan API key (free from etherscan.io)
- Additional chain APIs optional (Arbiscan, BscScan, etc.)

---

## Deployment Guide

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

### Frontend (Vercel)
1. Import repository to Vercel
2. Deploy as static site
3. Configure `API_BASE` in frontend code

### Database (Optional)
1. Create Supabase project
2. Run schema.sql
3. Add `DATABASE_URL` to Render environment

### Uptime Monitoring
1. Create cron-job at cron-job.org
2. Set to ping `/api/health` every 15 minutes
3. Prevents service sleep

---

## Project Structure

```
Airdrop-Checker/
├── api/                    # Serverless functions
├── db/                      # Database schemas
├── scripts/                 # Utility scripts
├── src/                     # Backend source
│   ├── config/             # Configuration
│   ├── middleware/         # Express middleware
│   ├── realtime/           # WebSocket implementation
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Helpers
├── supabase/                # Database migrations
├── admin.html               # Admin interface
├── index.html               # Main interface
└── package.json             # Dependencies
```

---

## Environment Configuration

```env
PORT=4000
ETHERSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key
POLYGONSCAN_API_KEY=your_key
BSCSCAN_API_KEY=your_key
SOLANAFM_API_KEY=your_key
DATABASE_URL=postgresql://...
ADMIN_API_KEY=your_key
ENTERPRISE_API_KEY=your_key
CACHE_TTL_SECONDS=180
CHECK_ROUTE_MAX_PER_MINUTE=30
PREDICTION_ROUTE_MAX_PER_MINUTE=20
BULK_SCAN_MAX_WALLETS=10000
BULK_SCAN_CONCURRENCY=10
PLATFORM_FEE_BPS=100
```

---

## Admin Dashboard

Access: `https://airdrop-checker-ten.vercel.app/admin.html`

Features:
- API request metrics
- User analytics
- Revenue tracking
- Request volume charts
- Error rate monitoring

---

## Support

**Technical Issues:** Open GitHub issue

**Licensing Questions:** thisiswaliraza@gmail.com

---

## Acknowledgments

- Etherscan for blockchain data APIs
- CoinGecko for price data
- Open source community

---

## Repository Statistics

![GitHub stars](https://img.shields.io/github/stars/lif3time-secr3t-c0de/Airdrop-Checker?style=social)
![GitHub forks](https://img.shields.io/github/forks/lif3time-secr3t-c0de/Airdrop-Checker?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/lif3time-secr3t-c0de/Airdrop-Checker?style=social)

---

© 2026 lif3time-secr3t-c0de. All rights reserved.
