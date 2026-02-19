# 🚀 Airdrop Checker - Find Your Free Crypto

![License](https://img.shields.io/badge/License-Custom-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Status](https://img.shields.io/badge/status-live-success)

## 🌐 Live Demo
**Website:** [https://airdrop-checker.vercel.app](https://airdrop-checker.vercel.app)

**Admin Dashboard:** [https://airdrop-checker.vercel.app/admin.html](https://airdrop-checker.vercel.app/admin.html)

**API Base URL:** [https://airdrop-checker-api.onrender.com](https://airdrop-checker-api.onrender.com)

---

## 📌 Overview

Airdrop Checker is a powerful, multi-chain cryptocurrency airdrop eligibility tool powered by AI. Check 50+ airdrops across 8 blockchains in seconds, get AI-powered predictions, and track your portfolio.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Multi-Chain Support** | Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Chain, Solana, Cosmos |
| 🤖 **AI Predictions** | Machine learning models predict your eligibility probability (0-100%) |
| 📊 **Portfolio Scanner** | Scan multiple wallets at once (up to 10,000) |
| ⚡ **Real-Time Updates** | WebSocket connection for live scanning |
| 📈 **Admin Dashboard** | Monitor API usage, users, and earnings |
| 📤 **CSV Export** | Download portfolio data and tax reports |
| 🔔 **Alerts System** | Telegram, Discord, and webhook notifications |
| 🏢 **Enterprise Ready** | White-label solutions, custom rules, bulk scanning |

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL (Supabase)
- WebSocket for real-time updates
- Machine Learning (Logistic Regression)

**Frontend:**
- HTML5 / CSS3
- Vanilla JavaScript
- Responsive design

**Deployment:**
- Render (Backend API)
- Vercel (Frontend)
- Supabase (Database)
- cron-job.org (Keep alive)

---

## 🔗 Supported Blockchains

| Chain | API | Status |
|-------|-----|--------|
| Ethereum | Etherscan | ✅ Live |
| Arbitrum | Arbiscan | ✅ Live |
| Optimism | Optimistic Etherscan | ✅ Live |
| Base | Basescan | ✅ Live |
| Polygon | Polygonscan | ✅ Live |
| BNB Chain | BscScan | ✅ Live |
| Solana | SolanaFM | ✅ Live (beta) |
| Cosmos | Mintscan | ⚠️ Coming soon |

---

## 📊 Airdrops Included (50+)

**Major Past Airdrops:**
- Uniswap (UNI) - avg $1200
- Arbitrum (ARB) - avg $1500
- Optimism (OP) - avg $800
- ENS - avg $500
- dYdX - avg $700
- 1inch - avg $300
- Aave - avg $1000
- Compound - avg $600
- SushiSwap - avg $400
- Curve - avg $800
- Convex - avg $500
- LooksRare - avg $300
- Blur - avg $600
- Aptos - avg $2000
- Celestia - avg $1000
- StarkNet - avg $1500
- zkSync - avg $1200
- LayerZero - avg $2000
- EigenLayer - avg $1800
- Jito - avg $400
- Pyth - avg $300
- Jupiter - avg $500
- Tensor - avg $400
- Wormhole - avg $600
- EtherFi - avg $700
- Renzo - avg $300
- Kelp - avg $250
- Swell - avg $300
- Ethena - avg $800
- Saga - avg $500

...and 20+ more!

---

## 🤖 AI Prediction Features

| Feature | Description |
|---------|-------------|
| 🎯 **Eligibility Score** | 0-100% probability for each airdrop |
| 🟢🟡🔴 **Color Coding** | Green (70%+), Yellow (40-69%), Red (<40%) |
| 💬 **Prediction Text** | "Wallet X has 85% chance for zkSync airdrop" |
| 📝 **Recommendations** | Action items to improve eligibility |
| 💰 **Value Predictions** | Estimated USD value if eligible |
| 📊 **Expected Value** | Probability-weighted value |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/airdrops` | List all airdrops |
| GET | `/api/airdrops/chains` | Supported chains |
| POST | `/api/airdrops/check` | Check wallet eligibility |
| POST | `/api/portfolio/scan` | Scan multiple wallets |
| POST | `/api/portfolio/export.csv` | Export as CSV |
| POST | `/api/predictions/eligibility` | AI predictions |
| GET | `/api/integrations/catalog` | API integrations |
| GET | `/api/admin/metrics` | Admin stats |
| POST | `/api/alerts/subscribe` | Set up alerts |
| GET | `/api/analytics/historical` | Missed airdrops analysis |
| GET | `/api/tax/report.csv` | Tax report download |

**WebSocket:** `wss://airdrop-checker-api.onrender.com/ws` for real-time scanning

---

## 💼 Commercial License

**This software is FREE FOR PERSONAL USE only.**

### ✅ Free for:
- Individuals
- Learning and testing
- Personal projects
- Non-commercial use

### 💰 Commercial Use (PAID):
Companies, organizations, or individuals generating revenue using this code MUST obtain a commercial license.

**Commercial License Includes:**
- ✅ Permanent commercial usage rights
- ✅ Written legal agreement
- ✅ Invoice for your records
- ✅ Priority email support
- ✅ Custom modifications available

**Pricing:**
- Basic Commercial License: $500 - $2000 (depending on scope)
- Enterprise License: $2000 - $10,000+ (custom agreement)

### 📞 Contact for Commercial Use:
📧 **Email:** thisiswaliraza@gmail.com

**⚠️ IMPORTANT: No third party scammers - deal directly with me only!**

---

## 🚀 Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/lif3time-secr3t-c0de/Airdrop-Checker.git
cd Airdrop-Checker

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env and add your API keys

# Start development server
npm run dev

# Open in browser
# http://localhost:4000/api/health
# Open index.html directly in browser
```

### Required API Keys:
- Etherscan API key (free from https://etherscan.io)
- Other chain APIs optional (Arbiscan, BscScan, etc.)

---

## 📦 Deployment

### Backend (Render)
```
1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect your GitHub repo
5. Set build command: npm install
6. Set start command: npm start
7. Add environment variables
8. Deploy
```

### Frontend (Vercel)
```
1. Go to https://vercel.com
2. Import your GitHub repo
3. Deploy (static site)
4. Update API_BASE in index.html with your Render URL
```

### Database (Supabase - Optional)
```
1. Create Supabase project
2. Run schema.sql
3. Add DATABASE_URL to Render environment
```

### Keep Alive (cron-job.org)
```
1. Go to https://cron-job.org
2. Create cronjob pinging /api/health every 15 minutes
3. Prevents Render from sleeping
```

---

## 📁 Project Structure

```
Airdrop-Checker/
├── api/                    # Vercel serverless functions
├── db/                      # Database schemas
│   ├── schema.sql
│   ├── schema_enterprise.sql
│   └── seeds/
├── scripts/                 # Python utilities
│   └── update_token_prices.py
├── src/                     # Backend source code
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── realtime/            # WebSocket implementation
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
├── supabase/                # Supabase migrations
├── admin.html               # Admin dashboard
├── index.html               # Main frontend
├── package.json             # Dependencies
├── render.yaml              # Render deployment config
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

---

## 🔒 Environment Variables

Create a `.env` file with:

```
PORT=4000
ETHERSCAN_API_KEY=your_key_here
ARBISCAN_API_KEY=your_key_here
OPTIMISTIC_ETHERSCAN_API_KEY=your_key_here
BASESCAN_API_KEY=your_key_here
POLYGONSCAN_API_KEY=your_key_here
BSCSCAN_API_KEY=your_key_here
SOLANAFM_API_KEY=your_key_here
DATABASE_URL=postgresql://...
ADMIN_API_KEY=your_admin_key
ENTERPRISE_API_KEY=your_enterprise_key
CACHE_TTL_SECONDS=180
CHECK_ROUTE_MAX_PER_MINUTE=30
PREDICTION_ROUTE_MAX_PER_MINUTE=20
BULK_SCAN_MAX_WALLETS=10000
BULK_SCAN_CONCURRENCY=10
PLATFORM_FEE_BPS=100
```

---

## 📊 Admin Dashboard

Access at: `https://airdrop-checker.vercel.app/admin.html`

Features:
- 📈 Real-time API metrics
- 👥 User statistics
- 💰 Earnings tracking
- 📊 Request volume charts
- 🔥 Top API routes
- 📉 Error rate monitoring

---

## 🤝 Contributing

This project is open for personal use and learning. For commercial contributions or modifications, please contact for licensing.

---

## 📞 Support

**For personal use:** Open an issue on GitHub

**For commercial inquiries:** Email thisiswaliraza@gmail.com

---

## ⚖️ License

**Custom Commercial License** - All rights reserved.

This software is free for personal, non-commercial use only. Commercial use requires a paid license and written agreement from the copyright holder.

See the [LICENSE](LICENSE) file for full terms.

**Unauthorized commercial use is prohibited and may result in legal action.**

---

## 🎉 Acknowledgments

- Etherscan for blockchain data APIs
- CoinGecko for price data
- All the airdrop projects that made this possible
- The open source community

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/lif3time-secr3t-c0de/Airdrop-Checker?style=social)
![GitHub forks](https://img.shields.io/github/forks/lif3time-secr3t-c0de/Airdrop-Checker?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/lif3time-secr3t-c0de/Airdrop-Checker?style=social)

---

**Made with ❤️ for the crypto community**

© 2026 lif3time-secr3t-c0de. All rights reserved.
