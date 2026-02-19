import crypto from "crypto";

function nowIso() {
  return new Date().toISOString();
}

function aggregateTotals(results) {
  return results.reduce(
    (acc, row) => {
      acc.detectedAirdrops += row.detectedAirdrops || 0;
      acc.claimEvents += row.claimEvents || 0;
      acc.estimatedUsd += row.estimatedUsd || 0;
      return acc;
    },
    { detectedAirdrops: 0, claimEvents: 0, estimatedUsd: 0 }
  );
}

async function runConcurrent(limit, items, worker, onTick) {
  const out = new Array(items.length);
  let cursor = 0;

  async function work() {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
      if (onTick) onTick(i + 1, items.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => work()));
  return out;
}

export class BulkScanService {
  constructor({ checker, maxWallets = 10000, concurrency = 10, ttlMs = 2 * 60 * 60 * 1000 }) {
    this.checker = checker;
    this.maxWallets = maxWallets;
    this.concurrency = concurrency;
    this.ttlMs = ttlMs;
    this.jobs = new Map();
  }

  createJob(wallets, options = {}) {
    if (!Array.isArray(wallets) || wallets.length === 0) {
      throw new Error("wallets[] is required");
    }
    if (wallets.length > this.maxWallets) {
      throw new Error(`Max ${this.maxWallets} wallets per job`);
    }
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const job = {
      id,
      status: "queued",
      createdAt: nowIso(),
      startedAt: null,
      completedAt: null,
      expiresAt: new Date(createdAt + this.ttlMs).toISOString(),
      progress: { completed: 0, total: wallets.length, percent: 0 },
      options: {
        includeTransfers: options.includeTransfers !== false
      },
      results: null,
      error: null
    };
    this.jobs.set(id, job);
    this.executeJob(id, wallets).catch((err) => {
      const ref = this.jobs.get(id);
      if (!ref) return;
      ref.status = "failed";
      ref.error = err.message || "bulk scan failed";
      ref.completedAt = nowIso();
    });
    return {
      jobId: id,
      status: job.status,
      createdAt: job.createdAt,
      totalWallets: wallets.length
    };
  }

  async executeJob(jobId, wallets) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    job.status = "running";
    job.startedAt = nowIso();

    const rows = await runConcurrent(
      this.concurrency,
      wallets,
      (wallet) => this.checker.checkWallet(wallet, { includeTransfers: job.options.includeTransfers }),
      (completed, total) => {
        const ref = this.jobs.get(jobId);
        if (!ref) return;
        ref.progress = {
          completed,
          total,
          percent: Number(((completed / total) * 100).toFixed(2))
        };
      }
    );

    const totals = aggregateTotals(rows);
    job.results = {
      generatedAt: nowIso(),
      walletsChecked: wallets.length,
      totals,
      wallets: rows
    };
    job.status = "completed";
    job.completedAt = nowIso();
    this.cleanup();
  }

  getJob(jobId) {
    this.cleanup();
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return {
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      expiresAt: job.expiresAt,
      progress: job.progress,
      error: job.error
    };
  }

  getJobResults(jobId) {
    this.cleanup();
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (job.status !== "completed" || !job.results) return null;
    return job.results;
  }

  cleanup() {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (new Date(job.expiresAt).getTime() < now) this.jobs.delete(id);
    }
  }
}
