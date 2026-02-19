import { getChainConfig } from "../config/chains.js";
import { ExplorerClient } from "./explorerClient.js";

function formatUnits(rawValue, decimals) {
  const raw = BigInt(rawValue || "0");
  const base = 10n ** BigInt(decimals || 18);
  const whole = raw / base;
  const fraction = raw % base;
  if (fraction === 0n) return whole.toString();
  const padded = fraction.toString().padStart(Number(decimals || 18), "0").replace(/0+$/, "");
  return `${whole.toString()}.${padded.slice(0, 8)}`;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function notSupportedResult(airdrop, reason) {
  return {
    key: airdrop.key,
    name: airdrop.name,
    chain: airdrop.chain || "unknown",
    chainId: airdrop.chainId,
    tokenAddress: airdrop.tokenAddress || null,
    detected: false,
    balance: 0,
    claimedAmount: 0,
    claimEvents: 0,
    estimatedUsd: 0,
    unsupported: true,
    reason
  };
}

export class MultiChainScanner {
  constructor({ cache, cacheTtlMs = 180_000 }) {
    this.cache = cache;
    this.cacheTtlMs = cacheTtlMs;
    this.explorerClients = new Map();
  }

  getExplorerClient(chainKey) {
    const config = getChainConfig(chainKey);
    if (!config || config.type !== "evm") return null;
    if (this.explorerClients.has(chainKey)) return this.explorerClients.get(chainKey);
    const apiKey = process.env[config.apiKeyEnv] || process.env.ETHERSCAN_API_KEY || "";
    const client = new ExplorerClient({ apiBase: config.apiBase, apiKey });
    this.explorerClients.set(chainKey, client);
    return client;
  }

  async scanAirdrop(wallet, airdrop, includeTransfers = true) {
    const chainKey = airdrop.chain || "ethereum";
    const chainConfig = getChainConfig(chainKey);
    if (!chainConfig) return notSupportedResult(airdrop, "unknown-chain");

    try {
      if (chainConfig.type === "evm") {
        return await this.scanEvm(wallet, airdrop, includeTransfers, chainConfig);
      }
      if (chainConfig.type === "solana") {
        return await this.scanSolana(wallet, airdrop, includeTransfers, chainConfig);
      }
      if (chainConfig.type === "cosmos") {
        return await this.scanCosmos(wallet, airdrop, chainConfig);
      }
      return notSupportedResult(airdrop, "unsupported-provider");
    } catch (error) {
      return notSupportedResult(
        airdrop,
        `scan-error:${chainConfig.key}:${String(error?.message || "unknown").slice(0, 80)}`
      );
    }
  }

  async scanEvm(wallet, airdrop, includeTransfers, chainConfig) {
    if (!airdrop.tokenAddress) return notSupportedResult(airdrop, "missing-token-address");

    const client = this.getExplorerClient(chainConfig.key);
    if (!client) return notSupportedResult(airdrop, "missing-explorer-client");

    const balanceCacheKey = [
      "tb",
      chainConfig.key,
      wallet.toLowerCase(),
      airdrop.tokenAddress.toLowerCase()
    ].join(":");

    const balanceRaw = await this.cache.getOrSet(
      balanceCacheKey,
      () => client.getTokenBalance({ address: wallet, contractAddress: airdrop.tokenAddress }),
      this.cacheTtlMs
    );

    let incomingTransfers = [];
    if (includeTransfers) {
      const txCacheKey = [
        "tt",
        chainConfig.key,
        wallet.toLowerCase(),
        airdrop.tokenAddress.toLowerCase()
      ].join(":");

      const transfers = await this.cache.getOrSet(
        txCacheKey,
        () => client.getTokenTransfers({ address: wallet, contractAddress: airdrop.tokenAddress, offset: 100 }),
        this.cacheTtlMs
      );

      const lcWallet = wallet.toLowerCase();
      incomingTransfers = transfers.filter((tx) => String(tx.to || "").toLowerCase() === lcWallet);
    }

    const balance = toNumber(formatUnits(balanceRaw, airdrop.decimals));
    const claimRaw = incomingTransfers.reduce((sum, tx) => sum + BigInt(tx.value || "0"), 0n);
    const claimedAmount = toNumber(formatUnits(claimRaw, airdrop.decimals));
    const claimEvents = incomingTransfers.length;
    const detected = balance > 0 || claimEvents > 0;
    const estimatedUsd = claimedAmount * (airdrop.priceUsd || 0);

    return {
      key: airdrop.key,
      name: airdrop.name,
      chain: chainConfig.key,
      chainId: airdrop.chainId,
      tokenAddress: airdrop.tokenAddress,
      detected,
      balance,
      claimedAmount,
      claimEvents,
      estimatedUsd
    };
  }

  async scanSolana(wallet, airdrop, includeTransfers, chainConfig) {
    // SolanaFM requires different address/token semantics than EVM. This adapter is best-effort.
    if (!airdrop.tokenAddress) return notSupportedResult(airdrop, "missing-solana-mint");
    const apiKey = process.env[chainConfig.apiKeyEnv] || "";
    if (!apiKey) return notSupportedResult(airdrop, "missing-solanafm-api-key");

    const cacheKey = ["solana", wallet, airdrop.tokenAddress, includeTransfers ? "1" : "0"].join(":");
    const result = await this.cache.getOrSet(
      cacheKey,
      async () => {
        const headers = { accept: "application/json", "x-api-key": apiKey };
        const url = `${chainConfig.apiBase}/accounts/${wallet}/transfers`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`SolanaFM HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json?.result?.data) ? json.result.data : [];
        const tokenTransfers = list.filter((tx) => String(tx?.tokenAddress || "").toLowerCase() === airdrop.tokenAddress.toLowerCase());
        const claimedAmount = tokenTransfers.reduce((sum, tx) => sum + toNumber(tx?.amount || 0), 0);
        const claimEvents = includeTransfers ? tokenTransfers.length : 0;
        return { claimedAmount, claimEvents };
      },
      this.cacheTtlMs
    ).catch(() => ({ claimedAmount: 0, claimEvents: 0, unsupported: true }));

    return {
      key: airdrop.key,
      name: airdrop.name,
      chain: chainConfig.key,
      chainId: airdrop.chainId,
      tokenAddress: airdrop.tokenAddress,
      detected: result.claimedAmount > 0 || result.claimEvents > 0,
      balance: 0,
      claimedAmount: toNumber(result.claimedAmount),
      claimEvents: toNumber(result.claimEvents),
      estimatedUsd: toNumber(result.claimedAmount) * (airdrop.priceUsd || 0),
      unsupported: Boolean(result.unsupported)
    };
  }

  async scanCosmos(wallet, airdrop, chainConfig) {
    // Mintscan schemas vary by chain/token; return structured unsupported until per-chain mappers are configured.
    return notSupportedResult(airdrop, `cosmos-adapter-not-configured:${chainConfig.key}:${wallet.slice(0, 8)}`);
  }
}
