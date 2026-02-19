import { Router } from "express";

export function createIntegrationsRouter({ registry }) {
  const router = Router();

  router.get("/catalog", (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      summary: registry.summary(),
      items: registry.list()
    });
  });

  router.get("/status", async (req, res, next) => {
    try {
      const report = await registry.health();
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
