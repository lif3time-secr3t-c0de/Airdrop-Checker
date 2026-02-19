import { Router } from "express";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function isSupportedWalletAddress(value) {
  return EVM_ADDRESS_RE.test(value) || SOLANA_ADDRESS_RE.test(value) || COSMOS_ADDRESS_RE.test(value);
}

function parseWalletsFromCsv(text) {
  const items = String(text || "")
    .split(/[\n,;\s]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
  return items;
}

function normalizeWallets(wallets) {
  const seen = new Set();
  const out = [];
  for (const w of wallets || []) {
    if (typeof w !== "string") continue;
    const trimmed = w.trim();
    if (!isSupportedWalletAddress(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function evalRule(rule, metrics) {
  const txCount = Number(metrics.txCount || 0);
  const volumeUsd = Number(metrics.volumeUsd || 0);
  const daysActive = Number(metrics.daysActive || 0);
  const bridgedUsd = Number(metrics.bridgedUsd || 0);

  const minTxCount = Number(rule.minTxCount || 0);
  const minVolumeUsd = Number(rule.minVolumeUsd || 0);
  const minDaysActive = Number(rule.minDaysActive || 0);
  const minBridgedUsd = Number(rule.minBridgedUsd || 0);

  const checks = [
    txCount >= minTxCount,
    volumeUsd >= minVolumeUsd,
    daysActive >= minDaysActive,
    bridgedUsd >= minBridgedUsd
  ];
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  const probability = total ? passed / total : 0;
  return {
    eligibleLikely: probability >= 0.75,
    probability: Number(probability.toFixed(4)),
    score: Math.round(probability * 100)
  };
}

export function createEnterpriseRouter({
  checker,
  bulkScanService,
  enterpriseStore,
  databaseUrl = "",
  adminApiKey = ""
}) {
  const router = Router();

  function badRequestError(message) {
    const err = new Error(message);
    err.statusCode = 400;
    return err;
  }

  function requireEnterprise(req, res, next) {
    if (!adminApiKey) return next();
    const key = req.header("x-enterprise-key") || req.header("x-admin-key") || "";
    if (key && key === adminApiKey) return next();
    return res.status(401).json({ error: "Unauthorized enterprise access" });
  }

  router.use(requireEnterprise);

  router.get("/branding", async (req, res, next) => {
    try {
      return res.json(await enterpriseStore.getBranding());
    } catch (error) {
      return next(error);
    }
  });

  router.put("/branding", async (req, res, next) => {
    try {
      const updated = await enterpriseStore.setBranding(req.body || {});
      return res.json(updated);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/bulk/jobs", async (req, res, next) => {
    try {
      const walletsFromJson = Array.isArray(req.body?.wallets) ? req.body.wallets : [];
      const walletsFromCsv = req.body?.csvText ? parseWalletsFromCsv(req.body.csvText) : [];
      const wallets = normalizeWallets([...walletsFromJson, ...walletsFromCsv]);
      if (!wallets.length) {
        throw badRequestError("wallets[] is required (or provide csvText)");
      }
      const includeTransfers = req.body?.includeTransfers !== false;
      const job = bulkScanService.createJob(wallets, { includeTransfers });
      return res.status(202).json(job);
    } catch (error) {
      if (!error.statusCode && /wallets\[\]|Max \d+ wallets/i.test(error.message || "")) {
        error.statusCode = 400;
      }
      return next(error);
    }
  });

  router.get("/bulk/jobs/:jobId", (req, res) => {
    const job = bulkScanService.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  });

  router.get("/bulk/jobs/:jobId/export.json", (req, res) => {
    const result = bulkScanService.getJobResults(req.params.jobId);
    if (!result) return res.status(404).json({ error: "Result not ready or job missing" });
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bulk_scan_${req.params.jobId}.json"`);
    return res.send(JSON.stringify(result));
  });

  router.post("/bulk/from-database", async (req, res, next) => {
    try {
      if (!databaseUrl) return res.status(503).json({ error: "DATABASE_URL is not configured" });
      const { getDbPool } = await import("../services/db.js");
      const pool = getDbPool(databaseUrl);
      const limit = Math.max(1, Math.min(Number(req.body?.limit || 10000), 10000));
      const q = await pool.query(
        `
          SELECT wallet_address
          FROM user_wallets
          ORDER BY updated_at DESC
          LIMIT $1
        `,
        [limit]
      );
      const wallets = normalizeWallets(q.rows.map((r) => r.wallet_address));
      if (!wallets.length) {
        throw badRequestError("No valid wallets found in database");
      }
      const job = bulkScanService.createJob(wallets, { includeTransfers: req.body?.includeTransfers !== false });
      return res.status(202).json({ ...job, source: "database" });
    } catch (error) {
      if (!error.statusCode && /wallets\[\]|No valid wallets/i.test(error.message || "")) {
        error.statusCode = 400;
      }
      return next(error);
    }
  });

  router.get("/custom-airdrops", async (req, res, next) => {
    try {
      return res.json({ items: await enterpriseStore.listCustomAirdrops() });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/custom-airdrops", async (req, res, next) => {
    try {
      const item = await enterpriseStore.upsertCustomAirdrop(req.body || {});
      return res.status(201).json(item);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/custom-airdrops/:key/evaluate", async (req, res, next) => {
    try {
      const key = String(req.params.key || "").toUpperCase();
      const all = await enterpriseStore.listCustomAirdrops();
      const target = all.find((x) => x.key === key);
      if (!target) return res.status(404).json({ error: "Custom airdrop not found" });
      const wallet = String(req.body?.wallet || "").trim();
      if (!wallet || !isSupportedWalletAddress(wallet)) {
        return res.status(400).json({ error: "Valid wallet is required" });
      }
      const metrics = req.body?.metrics || {};
      const score = evalRule(target.rule || {}, metrics);
      return res.json({
        wallet,
        airdropKey: key,
        rule: target.rule || {},
        metrics,
        result: score
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/analytics/overview", async (req, res, next) => {
    try {
      if (!databaseUrl) {
        return res.json({
          generatedAt: new Date().toISOString(),
          databaseConnected: false,
          totalValueFoundUsd: 0,
          users: { total: 0, active: 0 },
          popularWallets: [],
          revenue: { estPlatformRevenueUsd: 0, platformFeeBps: Number(process.env.PLATFORM_FEE_BPS || 0) }
        });
      }
      const { getDbPool } = await import("../services/db.js");
      const pool = getDbPool(databaseUrl);
      const feeBps = Number(process.env.PLATFORM_FEE_BPS || 0);

      const [valueRes, usersRes, popularRes] = await Promise.all([
        pool.query(`
          SELECT
            COALESCE(SUM(er.claimed_amount * COALESCE((a.metadata->>'latest_price_usd')::numeric, (a.metadata->>'avg_payout_usd')::numeric, 0)), 0)::numeric AS total_value_usd
          FROM eligibility_results er
          JOIN airdrops a ON a.id = er.airdrop_id
        `),
        pool.query(`
          SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE is_active = TRUE)::bigint AS active
          FROM users
        `),
        pool.query(`
          SELECT
            wallet_address,
            COUNT(*) FILTER (WHERE is_eligible = TRUE)::bigint AS eligible_hits
          FROM eligibility_results
          GROUP BY wallet_address
          ORDER BY eligible_hits DESC
          LIMIT 10
        `)
      ]);

      const totalValue = Number(valueRes.rows[0]?.total_value_usd || 0);
      const estRevenue = totalValue * (feeBps / 10000);

      return res.json({
        generatedAt: new Date().toISOString(),
        databaseConnected: true,
        totalValueFoundUsd: Number(totalValue.toFixed(2)),
        users: {
          total: Number(usersRes.rows[0]?.total || 0),
          active: Number(usersRes.rows[0]?.active || 0)
        },
        popularWallets: popularRes.rows.map((r) => ({
          wallet: r.wallet_address,
          eligibleHits: Number(r.eligible_hits || 0)
        })),
        revenue: {
          estPlatformRevenueUsd: Number(estRevenue.toFixed(2)),
          platformFeeBps: feeBps
        }
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/sla/status", (req, res) => {
    const targetUptime = 99.9;
    const uptimeSec = process.uptime();
    return res.json({
      generatedAt: new Date().toISOString(),
      sla: {
        targetUptimePercent: targetUptime,
        monitoring: "24/7 recommended",
        prioritySupport: true,
        legalCompliance: "configurable by deployment region"
      },
      runtime: {
        processUptimeSeconds: Math.floor(uptimeSec),
        status: "operational"
      }
    });
  });

  router.get("/private/check", async (req, res, next) => {
    try {
      const wallet = String(req.query.wallet || "").trim();
      if (!wallet || !isSupportedWalletAddress(wallet)) {
        return res.status(400).json({ error: "Valid wallet query param is required" });
      }
      const result = await checker.checkWallet(wallet, { includeTransfers: true });
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
