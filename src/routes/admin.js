import { Router } from "express";

function createAuthMiddleware(adminApiKey) {
  return function adminAuth(req, res, next) {
    if (!adminApiKey) return next();
    const provided = req.header("x-admin-key") || "";
    if (provided && provided === adminApiKey) return next();
    return res.status(401).json({ error: "Unauthorized" });
  };
}

export function createAdminRouter({ usageMetrics, adminDataService, adminApiKey = "" }) {
  const router = Router();
  const requireAdmin = createAuthMiddleware(adminApiKey);

  router.use(requireAdmin);

  router.get("/metrics", async (req, res, next) => {
    try {
      const [usage, business] = await Promise.all([
        Promise.resolve(usageMetrics.snapshot()),
        adminDataService.getSummary()
      ]);

      res.json({
        generatedAt: new Date().toISOString(),
        usage,
        business
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/usage/timeseries", (req, res) => {
    const hours = Math.max(1, Math.min(Number(req.query.hours || 24), 24));
    res.json({
      generatedAt: new Date().toISOString(),
      hours,
      points: usageMetrics.getHourlySeries(hours)
    });
  });

  return router;
}
