import { Router } from "express";
import { getDbPool } from "../services/db.js";

export function createAlertsRouter({ databaseUrl, dispatcher }) {
  const router = Router();
  const pool = getDbPool(databaseUrl);

  router.post("/subscribe", async (req, res, next) => {
    try {
      const {
        userId,
        airdropId = null,
        walletAddress = null,
        type = "eligibility_found",
        channel = "email",
        destination
      } = req.body || {};
      if (!userId || !destination) {
        return res.status(400).json({ error: "userId and destination are required" });
      }
      if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured" });

      const result = await pool.query(
        `
          INSERT INTO alerts (user_id, airdrop_id, wallet_address, type, channel, destination, is_enabled)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          RETURNING id, user_id, airdrop_id, wallet_address, type, channel, destination, is_enabled, created_at
        `,
        [userId, airdropId, walletAddress, type, channel, destination]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/test", async (req, res, next) => {
    try {
      const { channel, destination, message = "New airdrop opportunity detected." } = req.body || {};
      if (!channel || !destination) return res.status(400).json({ error: "channel and destination are required" });
      const result = await dispatcher.send({
        channel,
        destination,
        title: "Airdrop Checker Test Alert",
        message
      });
      return res.json({ ok: true, result });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
