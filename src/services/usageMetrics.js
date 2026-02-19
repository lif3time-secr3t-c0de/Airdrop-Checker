const HOUR_MS = 60 * 60 * 1000;
const WINDOW_HOURS = 24;

function createEmptyBucket(startMs) {
  return {
    startMs,
    total: 0,
    errors: 0
  };
}

export class UsageMetrics {
  constructor() {
    this.startedAtMs = Date.now();
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.routeCounts = new Map();
    this.statusCounts = new Map();
    this.hourlyBuckets = new Map();
  }

  record(path, statusCode) {
    const now = Date.now();
    const hourStart = Math.floor(now / HOUR_MS) * HOUR_MS;
    const routeKey = path || "unknown";
    const statusKey = String(statusCode || 0);

    this.totalRequests += 1;
    if (statusCode >= 400) this.totalErrors += 1;
    this.routeCounts.set(routeKey, (this.routeCounts.get(routeKey) || 0) + 1);
    this.statusCounts.set(statusKey, (this.statusCounts.get(statusKey) || 0) + 1);

    const bucket = this.hourlyBuckets.get(hourStart) || createEmptyBucket(hourStart);
    bucket.total += 1;
    if (statusCode >= 400) bucket.errors += 1;
    this.hourlyBuckets.set(hourStart, bucket);
    this.cleanup();
  }

  cleanup() {
    const minStart = Date.now() - WINDOW_HOURS * HOUR_MS;
    for (const key of this.hourlyBuckets.keys()) {
      if (key < minStart) this.hourlyBuckets.delete(key);
    }
  }

  getTopRoutes(limit = 10) {
    return [...this.routeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([route, count]) => ({ route, count }));
  }

  getHourlySeries(hours = 24) {
    const clamped = Math.max(1, Math.min(hours, WINDOW_HOURS));
    const out = [];
    const now = Date.now();
    const currentHour = Math.floor(now / HOUR_MS) * HOUR_MS;

    for (let i = clamped - 1; i >= 0; i -= 1) {
      const start = currentHour - i * HOUR_MS;
      const bucket = this.hourlyBuckets.get(start) || createEmptyBucket(start);
      out.push({
        hourStart: new Date(start).toISOString(),
        total: bucket.total,
        errors: bucket.errors
      });
    }
    return out;
  }

  snapshot() {
    const uptimeSeconds = Math.floor((Date.now() - this.startedAtMs) / 1000);
    return {
      uptimeSeconds,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate: this.totalRequests ? this.totalErrors / this.totalRequests : 0,
      statusCodes: [...this.statusCounts.entries()].map(([code, count]) => ({ code, count })),
      topRoutes: this.getTopRoutes(10),
      last24h: this.getHourlySeries(24)
    };
  }
}

export function createUsageMetricsMiddleware(metrics) {
  return function usageMetricsMiddleware(req, res, next) {
    res.on("finish", () => {
      metrics.record(req.path, res.statusCode);
    });
    next();
  };
}
