import { Router } from "express";
import { toCsv } from "../utils/csv.js";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function isSupportedWalletAddress(value) {
  return EVM_ADDRESS_RE.test(value) || SOLANA_ADDRESS_RE.test(value) || COSMOS_ADDRESS_RE.test(value);
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

function aggregate(walletsResults) {
  return walletsResults.reduce(
    (acc, row) => {
      acc.detectedAirdrops += row.detectedAirdrops;
      acc.claimEvents += row.claimEvents;
      acc.estimatedUsd += row.estimatedUsd;
      return acc;
    },
    { detectedAirdrops: 0, claimEvents: 0, estimatedUsd: 0 }
  );
}

export function createPortfolioRouter({ checker }) {
  const router = Router();

  router.post("/scan", async (req, res, next) => {
    try {
      const wallets = normalizeWallets(req.body?.wallets || []);
      const includeTransfers = req.body?.includeTransfers !== false;
      if (!wallets.length) return res.status(400).json({ error: "wallets[] is required" });
      if (wallets.length > 100) return res.status(400).json({ error: "Max 100 wallets per request" });

      const results = [];
      for (const wallet of wallets) {
        results.push(await checker.checkWallet(wallet, { includeTransfers }));
      }

      return res.json({
        generatedAt: new Date().toISOString(),
        walletsChecked: wallets.length,
        totals: aggregate(results),
        wallets: results
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/export.csv", async (req, res, next) => {
    try {
      const wallets = normalizeWallets(req.body?.wallets || []);
      const includeTransfers = req.body?.includeTransfers !== false;
      if (!wallets.length) return res.status(400).json({ error: "wallets[] is required" });

      const rows = [];
      for (const wallet of wallets) {
        const result = await checker.checkWallet(wallet, { includeTransfers });
        rows.push([
          wallet,
          result.detectedAirdrops,
          result.claimEvents,
          Number(result.estimatedUsd || 0).toFixed(2)
        ]);
      }

      const csv = toCsv(["wallet", "detected_airdrops", "claim_events", "estimated_usd"], rows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="portfolio_scan.csv"');
      return res.send(csv);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
