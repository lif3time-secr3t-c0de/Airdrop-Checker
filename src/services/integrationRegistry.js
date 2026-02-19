import { INTEGRATIONS } from "../config/integrations.js";

function summarizeEnv(envKeys) {
  const configured = envKeys.filter((k) => Boolean(process.env[k]));
  return {
    configuredCount: configured.length,
    requiredCount: envKeys.length,
    missingKeys: envKeys.filter((k) => !configured.includes(k)),
    configuredKeys: configured
  };
}

function baseStatus(item) {
  const env = summarizeEnv(item.envKeys || []);
  return {
    ...item,
    configured: env.configuredCount > 0,
    env
  };
}

async function healthCheck(item) {
  if (!item.configured) {
    return { ok: false, state: "not_configured", latencyMs: null };
  }
  const start = Date.now();
  try {
    // Lightweight no-auth/public pings to avoid consuming key quotas in health calls.
    if (item.key === "coingecko") {
      const res = await fetch("https://api.coingecko.com/api/v3/ping");
      return { ok: res.ok, state: res.ok ? "reachable" : `http_${res.status}`, latencyMs: Date.now() - start };
    }
    if (item.key === "etherscan") {
      const res = await fetch("https://api.etherscan.io/api?module=stats&action=ethprice");
      return { ok: res.ok, state: res.ok ? "reachable" : `http_${res.status}`, latencyMs: Date.now() - start };
    }
    return { ok: true, state: "configured", latencyMs: Date.now() - start };
  } catch {
    return { ok: false, state: "unreachable", latencyMs: Date.now() - start };
  }
}

export class IntegrationRegistry {
  list() {
    return INTEGRATIONS.map(baseStatus);
  }

  summary() {
    const all = this.list();
    const configured = all.filter((x) => x.configured).length;
    return {
      total: all.length,
      configured,
      missing: all.length - configured
    };
  }

  async health() {
    const all = this.list();
    const results = [];
    for (const item of all) {
      results.push({
        ...item,
        health: await healthCheck(item)
      });
    }
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: results.length,
        configured: results.filter((x) => x.configured).length,
        healthy: results.filter((x) => x.health.ok).length
      },
      items: results
    };
  }
}
