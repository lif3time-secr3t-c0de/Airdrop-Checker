import { Router } from "express";
import { AIRDROPS } from "../config/airdrops.js";
import { CHAIN_CONFIG } from "../config/chains.js";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function isSupportedWalletAddress(value) {
  return EVM_ADDRESS_RE.test(value) || SOLANA_ADDRESS_RE.test(value) || COSMOS_ADDRESS_RE.test(value);
}

function normalizeWallets(wallets) {
  const seen = new Set();
  const list = [];

  for (const wallet of wallets) {
    if (typeof wallet !== "string") continue;
    const trimmed = wallet.trim();
    if (!isSupportedWalletAddress(trimmed)) continue;
    const lc = trimmed.toLowerCase();
    if (seen.has(lc)) continue;
    seen.add(lc);
    list.push(trimmed);
  }
  return list;
}

function createResponseKey(wallets, includeTransfers) {
  return `check:${includeTransfers ? "1" : "0"}:${wallets.map((w) => w.toLowerCase()).sort().join(",")}`;
}

export function createAirdropRouter({ checker, responseCache, responseCacheTtlMs = 120_000 }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json({
      count: AIRDROPS.length,
      items: AIRDROPS
    });
  });

  router.get("/chains", (req, res) => {
    const chains = Object.values(CHAIN_CONFIG).map((chain) => ({
      key: chain.key,
      name: chain.name,
      type: chain.type,
      apiBase: chain.apiBase
    }));
    res.json({ count: chains.length, items: chains });
  });

  router.post("/check", async (req, res, next) => {
    try {
      const walletsInput = Array.isArray(req.body?.wallets) ? req.body.wallets : [];
      const includeTransfers = req.body?.includeTransfers !== false;

      if (!walletsInput.length) {
        return res.status(400).json({ error: "wallets[] is required" });
      }

      const wallets = normalizeWallets(walletsInput);
      if (!wallets.length) {
        return res.status(400).json({ error: "No valid wallet addresses supplied" });
      }
      if (wallets.length > 25) {
        return res.status(400).json({ error: "Max 25 wallets per request" });
      }

      const cacheKey = createResponseKey(wallets, includeTransfers);
      const payload = await responseCache.getOrSet(
        cacheKey,
        async () => {
          const walletsResult = [];
          for (const wallet of wallets) {
            walletsResult.push(await checker.checkWallet(wallet, { includeTransfers }));
          }

          const totals = walletsResult.reduce(
            (acc, item) => {
              acc.detectedAirdrops += item.detectedAirdrops;
              acc.claimEvents += item.claimEvents;
              acc.estimatedUsd += item.estimatedUsd;
              return acc;
            },
            { detectedAirdrops: 0, claimEvents: 0, estimatedUsd: 0 }
          );

          return {
            walletsChecked: walletsResult.length,
            includeTransfers,
            totals,
            wallets: walletsResult,
            generatedAt: new Date().toISOString()
          };
        },
        responseCacheTtlMs
      );

      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
