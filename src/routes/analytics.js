import { Router } from "express";
import { getDbPool } from "../services/db.js";

export function createAnalyticsRouter({ databaseUrl }) {
  const router = Router();
  const pool = getDbPool(databaseUrl);

  router.get("/historical", async (req, res, next) => {
    try {
      if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured" });
      const wallet = String(req.query.wallet || "").trim().toLowerCase();
      if (!wallet) return res.status(400).json({ error: "wallet query param is required" });

      const summaryRes = await pool.query(
        `
          SELECT
            COUNT(*)::bigint AS total_checks,
            COUNT(*) FILTER (WHERE er.is_eligible = TRUE)::bigint AS eligible_checks,
            COUNT(*) FILTER (WHERE er.is_eligible = FALSE)::bigint AS missed_count,
            COALESCE(SUM(
              CASE WHEN er.is_eligible = FALSE
                THEN COALESCE((a.metadata->>'avg_payout_usd')::numeric, 0)
                ELSE 0 END
            ), 0)::numeric AS missed_value_usd
          FROM eligibility_results er
          JOIN airdrops a ON a.id = er.airdrop_id
          WHERE LOWER(er.wallet_address) = $1
        `,
        [wallet]
      );

      const s = summaryRes.rows[0] || {};
      const missed = Number(s.missed_count || 0);
      const missedValue = Number(s.missed_value_usd || 0);
      const suggestions = [
        "Keep weekly activity instead of one-time bursts.",
        "Bridge and use at least 2 chains consistently.",
        "Use swaps + one DeFi position (LP/lend/stake) per target chain.",
        "Track snapshots and hold qualifying balances through windows."
      ];

      return res.json({
        generatedAt: new Date().toISOString(),
        wallet,
        totalChecks: Number(s.total_checks || 0),
        eligibleChecks: Number(s.eligible_checks || 0),
        missedAirdrops: missed,
        missedValueUsd: Number(missedValue.toFixed(2)),
        headline: `You missed ${missed} airdrops worth ~$${missedValue.toFixed(2)}.`,
        whatIf: `If activity had been more consistent, expected recoverable value could improve meaningfully.`,
        suggestions
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
