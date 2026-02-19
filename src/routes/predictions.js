import { Router } from "express";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function isSupportedWalletAddress(value) {
  return EVM_ADDRESS_RE.test(value) || SOLANA_ADDRESS_RE.test(value) || COSMOS_ADDRESS_RE.test(value);
}

function normalizeWallets(wallets) {
  const seen = new Set();
  const list = [];
  for (const wallet of wallets || []) {
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

function normalizeAirdropKeys(keys) {
  const seen = new Set();
  const out = [];
  for (const key of keys || []) {
    if (typeof key !== "string") continue;
    const value = key.trim().toUpperCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export function createPredictionRouter({ predictionEngine }) {
  const router = Router();

  router.post("/eligibility", async (req, res, next) => {
    try {
      const walletsInput = Array.isArray(req.body?.wallets) ? req.body.wallets : [];
      const airdropKeysInput = Array.isArray(req.body?.airdropKeys) ? req.body.airdropKeys : [];
      const forceRetrain = req.body?.forceRetrain === true;

      if (!walletsInput.length) {
        return res.status(400).json({ error: "wallets[] is required" });
      }
      const wallets = normalizeWallets(walletsInput);
      if (!wallets.length) {
        return res.status(400).json({ error: "No valid wallet addresses supplied" });
      }
      if (wallets.length > 50) {
        return res.status(400).json({ error: "Max 50 wallets per request" });
      }

      const airdropKeys = normalizeAirdropKeys(airdropKeysInput);
      const result = await predictionEngine.predict(wallets, { airdropKeys, forceRetrain });
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
