import { Pool } from "pg";
import { LogisticRegressionBinary } from "./logisticRegression.js";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function stableHashToUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function calcWalletNumericRatio(wallet) {
  const body = (wallet.startsWith("0x") ? wallet.slice(2) : wallet).toLowerCase();
  let digits = 0;
  for (const c of body) if (c >= "0" && c <= "9") digits += 1;
  return body.length ? digits / body.length : 0;
}

function calcWalletUniqCharRatio(wallet) {
  const body = (wallet.startsWith("0x") ? wallet.slice(2) : wallet).toLowerCase();
  return body.length ? new Set(body.split("")).size / Math.min(body.length, 32) : 0;
}

function statusOneHot(status = "") {
  const s = String(status).toLowerCase();
  return {
    active: s === "active" ? 1 : 0,
    upcoming: s === "upcoming" ? 1 : 0,
    ended: s === "ended" ? 1 : 0
  };
}

function daysSince(isoDate) {
  if (!isoDate) return 365;
  const ms = Date.now() - new Date(isoDate).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 365;
  return ms / 86_400_000;
}

function normalizeWallets(wallets) {
  const unique = new Set();
  const out = [];
  for (const value of wallets || []) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!EVM_ADDRESS_RE.test(trimmed) && !SOLANA_ADDRESS_RE.test(trimmed) && !COSMOS_ADDRESS_RE.test(trimmed)) continue;
    const lc = trimmed.toLowerCase();
    if (unique.has(lc)) continue;
    unique.add(lc);
    out.push(trimmed);
  }
  return out;
}

function probabilityToScore(probability) {
  return Math.max(0, Math.min(100, Math.round(probability * 100)));
}

function scoreColor(score) {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

function probabilityLabel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function roundUsd(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function chainRecommendations(chain) {
  if (chain === "arbitrum") {
    return [
      "Bridge at least $100 to Arbitrum and keep funds active for 30 days.",
      "Run 3-5 swaps on an Arbitrum DEX across multiple days.",
      "Use one lending action (deposit or borrow) on an Arbitrum protocol."
    ];
  }
  if (chain === "optimism") {
    return [
      "Bridge at least $100 to Optimism and perform two weekly transactions.",
      "Make at least 3 swaps on Optimism DEXs such as Velodrome.",
      "Provide liquidity or vote on one Optimism ecosystem app."
    ];
  }
  if (chain === "base") {
    return [
      "Bridge to Base and perform 3+ on-chain actions over 14 days.",
      "Swap on Base DEXs and hold at least one LP position briefly.",
      "Interact with one social or creator app in the Base ecosystem."
    ];
  }
  if (chain === "polygon") {
    return [
      "Bridge to Polygon and do recurring weekly transactions.",
      "Swap on Polygon DEXs at least 3 times.",
      "Use one Polygon DeFi action (lend, stake, or LP)."
    ];
  }
  if (chain === "bsc") {
    return [
      "Bridge to BNB Chain and execute 3+ protocol interactions.",
      "Swap on PancakeSwap on separate days.",
      "Add and hold a small LP position for 2+ weeks."
    ];
  }
  if (chain === "solana") {
    return [
      "Fund your Solana wallet and keep it active over several weeks.",
      "Perform 3+ swaps on major Solana DEX routes.",
      "Use one staking or liquid-staking workflow and keep activity consistent."
    ];
  }
  if (chain === "cosmos") {
    return [
      "Bridge or transfer assets into Cosmos ecosystem wallets.",
      "Delegate stake to validators and keep positions active.",
      "Use IBC transfers and one DEX swap across zones."
    ];
  }
  return [
    "Bridge at least $100 to the target chain and keep it there for 30 days.",
    "Perform at least 3 swaps on leading DEXs over multiple days.",
    "Keep one DeFi position (lend, LP, or stake) active for 2-4 weeks."
  ];
}

function buildRecommendations({ chain, score, historyChecks }) {
  const recs = chainRecommendations(chain);
  const out = [];

  if (score < 40) {
    out.push("Increase wallet activity frequency: target 5+ transactions this month.");
  } else if (score < 70) {
    out.push("Maintain steady weekly activity to improve consistency signals.");
  } else {
    out.push("Keep current behavior and avoid long inactivity gaps.");
  }

  if (!historyChecks || historyChecks < 3) {
    out.push("Spread actions across multiple weeks, not all in one day.");
  }

  for (const rec of recs) {
    if (out.length >= 5) break;
    out.push(rec);
  }
  return out.slice(0, 5);
}

export class AirdropPredictionEngine {
  constructor({
    databaseUrl = "",
    airdrops = [],
    minTrainingSamples = 200,
    retrainIntervalMs = 6 * 60 * 60 * 1000,
    maxTrainingRows = 25000
  } = {}) {
    this.airdrops = airdrops;
    this.minTrainingSamples = minTrainingSamples;
    this.retrainIntervalMs = retrainIntervalMs;
    this.maxTrainingRows = maxTrainingRows;

    this.pool = databaseUrl
      ? new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 10_000 })
      : null;

    this.model = null;
    this.modelInfo = {
      trainedAt: null,
      sampleCount: 0,
      featureCount: 0,
      accuracy: null,
      mode: this.pool ? "ml" : "heuristic"
    };
  }

  async ensureModel({ force = false } = {}) {
    if (!this.pool) return;
    const stale =
      !this.modelInfo.trainedAt ||
      Date.now() - new Date(this.modelInfo.trainedAt).getTime() > this.retrainIntervalMs;
    if (!force && this.model && !stale) return;
    await this.trainModel();
  }

  async trainModel() {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
          SELECT
            er.wallet_address,
            er.is_eligible,
            er.checked_at,
            a.project_key,
            a.chain_id,
            a.status,
            a.token_address
          FROM eligibility_results er
          JOIN airdrops a ON a.id = er.airdrop_id
          WHERE er.wallet_address IS NOT NULL
          ORDER BY er.checked_at DESC
          LIMIT $1
        `,
        [this.maxTrainingRows]
      );

      if (result.rows.length < this.minTrainingSamples) {
        this.model = null;
        this.modelInfo = {
          trainedAt: new Date().toISOString(),
          sampleCount: result.rows.length,
          featureCount: 10,
          accuracy: null,
          mode: "heuristic"
        };
        return;
      }

      const walletStats = new Map();
      for (const row of result.rows) {
        const key = String(row.wallet_address || "").toLowerCase();
        const prev = walletStats.get(key) || { checks: 0, eligible: 0, lastCheckedAt: null };
        prev.checks += 1;
        prev.eligible += row.is_eligible ? 1 : 0;
        if (!prev.lastCheckedAt || new Date(row.checked_at) > new Date(prev.lastCheckedAt)) {
          prev.lastCheckedAt = row.checked_at;
        }
        walletStats.set(key, prev);
      }

      const x = [];
      const y = [];
      for (const row of result.rows) {
        const wallet = row.wallet_address;
        const stats = walletStats.get(String(wallet).toLowerCase()) || { checks: 0, eligible: 0, lastCheckedAt: null };
        x.push(this.buildFeatures(wallet, row, stats));
        y.push(row.is_eligible ? 1 : 0);
      }

      const cutoff = Math.max(1, Math.floor(x.length * 0.8));
      const xTrain = x.slice(0, cutoff);
      const yTrain = y.slice(0, cutoff);
      const xVal = x.slice(cutoff);
      const yVal = y.slice(cutoff);

      const model = new LogisticRegressionBinary({
        learningRate: 0.09,
        epochs: 400,
        l2: 0.0004
      });
      model.fit(xTrain, yTrain);

      let correct = 0;
      for (let i = 0; i < xVal.length; i += 1) {
        const p = model.predictProba(xVal[i]);
        const pred = p >= 0.5 ? 1 : 0;
        if (pred === yVal[i]) correct += 1;
      }
      const accuracy = xVal.length ? correct / xVal.length : null;

      this.model = model;
      this.modelInfo = {
        trainedAt: new Date().toISOString(),
        sampleCount: x.length,
        featureCount: x[0]?.length || 0,
        accuracy,
        mode: "ml"
      };
    } catch (error) {
      this.model = null;
      this.modelInfo = {
        trainedAt: new Date().toISOString(),
        sampleCount: 0,
        featureCount: 11,
        accuracy: null,
        mode: "heuristic",
        warning: `Prediction fallback: ${error.message || "training unavailable"}`
      };
    } finally {
      client.release();
    }
  }

  async predict(wallets, { airdropKeys = [], forceRetrain = false } = {}) {
    const normalizedWallets = normalizeWallets(wallets);
    if (!normalizedWallets.length) {
      return {
        generatedAt: new Date().toISOString(),
        model: this.modelInfo,
        wallets: []
      };
    }

    await this.ensureModel({ force: forceRetrain });
    const statsByWallet = await this.fetchWalletStats(normalizedWallets);

    const allowKeys = new Set((airdropKeys || []).map((k) => String(k).toUpperCase()));
    const targets = allowKeys.size
      ? this.airdrops.filter((a) => allowKeys.has(String(a.key).toUpperCase()))
      : this.airdrops;

    const walletsOut = normalizedWallets.map((wallet) => {
      const history = statsByWallet.get(wallet.toLowerCase()) || {
        checks: 0,
        eligible: 0,
        lastCheckedAt: null
      };
      const predictions = targets.map((airdrop) => {
        const p = this.predictSingle(wallet, airdrop, history);
        const score = probabilityToScore(p);
        const color = scoreColor(score);
        const likelyValueUsd = roundUsd(airdrop.avgAirdropUsd || 0);
        const expectedValueUsd = roundUsd(likelyValueUsd * p);
        return {
          airdropKey: airdrop.key,
          airdropName: airdrop.name,
          chain: airdrop.chain,
          chainId: Number(airdrop.chainId),
          probability: Number(p.toFixed(4)),
          predictionText: `Wallet ${wallet} has ${score}% chance for ${airdrop.name} airdrop`,
          eligibilityScore: score,
          scoreColor: color,
          scoreBand: probabilityLabel(score),
          eligibleLikely: p >= 0.5,
          confidence: Number((Math.abs(p - 0.5) * 2).toFixed(4)),
          potentialValueIfQualifiedUsd: likelyValueUsd,
          expectedValueUsd,
          recommendations: buildRecommendations({
            chain: airdrop.chain,
            score,
            historyChecks: history.checks
          })
        };
      });

      predictions.sort((a, b) => b.probability - a.probability);
      const top = predictions[0] || null;
      return {
        wallet,
        historyChecks: history.checks,
        historyEligibleRate: history.checks ? Number((history.eligible / history.checks).toFixed(4)) : 0,
        summary: top
          ? {
              strongestAirdrop: top.airdropKey,
              strongestChance: top.eligibilityScore,
              strongestChanceText: top.predictionText,
              totalExpectedValueUsd: roundUsd(predictions.reduce((sum, row) => sum + row.expectedValueUsd, 0))
            }
          : null,
        predictions
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      model: this.modelInfo,
      wallets: walletsOut
    };
  }

  predictSingle(wallet, airdrop, walletStats) {
    const row = {
      project_key: airdrop.key,
      chain_id: Number(airdrop.chainId),
      status: "active",
      token_address: airdrop.tokenAddress
    };
    const features = this.buildFeatures(wallet, row, walletStats);
    if (!this.model) {
      const seeded = stableHashToUnit(`${wallet.toLowerCase()}::${airdrop.key}`);
      const base = 0.25 + seeded * 0.5;
      const lift = walletStats.checks ? (walletStats.eligible / walletStats.checks - 0.5) * 0.25 : 0;
      return clamp01(base + lift);
    }
    return clamp01(this.model.predictProba(features));
  }

  buildFeatures(wallet, row, walletStats) {
    const status = statusOneHot(row.status);
    const chainNorm = clamp01(Number(row.chain_id || 1) / 50000);
    const tokenPresent = row.token_address ? 1 : 0;
    const keyHash = stableHashToUnit(String(row.project_key || ""));
    const walletNumRatio = calcWalletNumericRatio(wallet);
    const walletUniqRatio = calcWalletUniqCharRatio(wallet);
    const checks = Number(walletStats.checks || 0);
    const eligibleRate = checks ? Number(walletStats.eligible || 0) / checks : 0.5;
    const checksScaled = clamp01(Math.log1p(checks) / 5);
    const recency = clamp01(daysSince(walletStats.lastCheckedAt) / 365);

    return [
      1,
      chainNorm,
      tokenPresent,
      status.active,
      status.upcoming,
      keyHash,
      walletNumRatio,
      walletUniqRatio,
      eligibleRate,
      checksScaled,
      recency
    ];
  }

  async fetchWalletStats(wallets) {
    const out = new Map();
    if (!this.pool || !wallets.length) return out;
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `
          SELECT
            LOWER(wallet_address) AS wallet_address,
            COUNT(*)::bigint AS checks,
            COUNT(*) FILTER (WHERE is_eligible = TRUE)::bigint AS eligible,
            MAX(checked_at) AS last_checked_at
          FROM eligibility_results
          WHERE LOWER(wallet_address) = ANY($1::text[])
          GROUP BY LOWER(wallet_address)
        `,
        [wallets.map((w) => w.toLowerCase())]
      );
      for (const row of res.rows) {
        out.set(row.wallet_address, {
          checks: Number(row.checks || 0),
          eligible: Number(row.eligible || 0),
          lastCheckedAt: row.last_checked_at || null
        });
      }
      return out;
    } catch {
      return out;
    } finally {
      client.release();
    }
  }
}
