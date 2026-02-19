import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { AIRDROP_COUNT } from "./config/airdrops.js";
import { AIRDROPS } from "./config/airdrops.js";
import { createCheckLimiter } from "./middleware/rateLimit.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAirdropRouter } from "./routes/airdrops.js";
import { createAlertsRouter } from "./routes/alerts.js";
import { createAnalyticsRouter } from "./routes/analytics.js";
import { createEnterpriseRouter } from "./routes/enterprise.js";
import { createIntegrationsRouter } from "./routes/integrations.js";
import { createPortfolioRouter } from "./routes/portfolio.js";
import { createPredictionRouter } from "./routes/predictions.js";
import { createTaxRouter } from "./routes/tax.js";
import { AdminDataService } from "./services/adminData.js";
import { AirdropChecker } from "./services/airdropChecker.js";
import { AlertsDispatcher } from "./services/alertsDispatcher.js";
import { BulkScanService } from "./services/bulkScanService.js";
import { EnterpriseStore } from "./services/enterpriseStore.js";
import { IntegrationRegistry } from "./services/integrationRegistry.js";
import { MultiChainScanner } from "./services/multiChainScanner.js";
import { AirdropPredictionEngine } from "./services/predictionEngine.js";
import { createUsageMetricsMiddleware, UsageMetrics } from "./services/usageMetrics.js";
import { TTLCache } from "./utils/cache.js";

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 180);
const CHECK_ROUTE_MAX_PER_MINUTE = Number(process.env.CHECK_ROUTE_MAX_PER_MINUTE || 30);
const PREDICTION_ROUTE_MAX_PER_MINUTE = Number(process.env.PREDICTION_ROUTE_MAX_PER_MINUTE || 20);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL || "";

const cacheTtlMs = CACHE_TTL_SECONDS * 1000;
const apiCache = new TTLCache(cacheTtlMs);
const responseCache = new TTLCache(120_000);
const scanner = new MultiChainScanner({
  cache: apiCache,
  cacheTtlMs
});
const checker = new AirdropChecker({
  scanner
});
const usageMetrics = new UsageMetrics();
const adminDataService = new AdminDataService(DATABASE_URL);
const alertsDispatcher = new AlertsDispatcher();
const enterpriseStore = new EnterpriseStore();
const integrationRegistry = new IntegrationRegistry();
const bulkScanService = new BulkScanService({
  checker,
  maxWallets: Number(process.env.BULK_SCAN_MAX_WALLETS || 10000),
  concurrency: Number(process.env.BULK_SCAN_CONCURRENCY || 10)
});
const predictionEngine = new AirdropPredictionEngine({
  databaseUrl: DATABASE_URL,
  airdrops: AIRDROPS
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(createUsageMetricsMiddleware(usageMetrics));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    airdrops: AIRDROP_COUNT
  });
});

app.use("/api/airdrops/check", createCheckLimiter(CHECK_ROUTE_MAX_PER_MINUTE));
app.use("/api/predictions/eligibility", createCheckLimiter(PREDICTION_ROUTE_MAX_PER_MINUTE));

app.use(
  "/api/airdrops",
  createAirdropRouter({
    checker,
    responseCache,
    responseCacheTtlMs: 120_000
  })
);

app.use(
  "/api/admin",
  createAdminRouter({
    usageMetrics,
    adminDataService,
    adminApiKey: ADMIN_API_KEY
  })
);

app.use("/api/predictions", createPredictionRouter({ predictionEngine }));
app.use("/api/portfolio", createPortfolioRouter({ checker }));
app.use("/api/alerts", createAlertsRouter({ databaseUrl: DATABASE_URL, dispatcher: alertsDispatcher }));
app.use("/api/analytics", createAnalyticsRouter({ databaseUrl: DATABASE_URL }));
app.use("/api/tax", createTaxRouter({ databaseUrl: DATABASE_URL }));
app.use("/api/integrations", createIntegrationsRouter({ registry: integrationRegistry }));
app.use(
  "/api/enterprise",
  createEnterpriseRouter({
    checker,
    bulkScanService,
    enterpriseStore,
    databaseUrl: DATABASE_URL,
    adminApiKey: process.env.ENTERPRISE_API_KEY || ADMIN_API_KEY
  })
);

app.post("/api/admin/predictions/train", async (req, res, next) => {
  try {
    if (ADMIN_API_KEY) {
      const key = req.header("x-admin-key") || "";
      if (key !== ADMIN_API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
    await predictionEngine.trainModel();
    return res.json({
      ok: true,
      model: predictionEngine.modelInfo
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  const message = error?.message || "Unexpected server error";
  const status = Number(error?.statusCode || error?.status || 500);
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
});

const cleanupTimer = setInterval(() => {
  apiCache.cleanup();
  responseCache.cleanup();
}, 60_000);
cleanupTimer.unref();

app.locals.checker = checker;
app.locals.predictionEngine = predictionEngine;
app.locals.usageMetrics = usageMetrics;

export default app;
