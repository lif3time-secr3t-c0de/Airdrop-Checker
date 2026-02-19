import { Router } from "express";
import { getDbPool } from "../services/db.js";
import { toCsv } from "../utils/csv.js";

export function createTaxRouter({ databaseUrl }) {
  const router = Router();
  const pool = getDbPool(databaseUrl);

  router.get("/report.csv", async (req, res, next) => {
    try {
      if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured" });
      const wallet = String(req.query.wallet || "").trim().toLowerCase();
      const year = Number(req.query.year || new Date().getUTCFullYear());
      if (!wallet) return res.status(400).json({ error: "wallet query param is required" });

      const start = `${year}-01-01T00:00:00.000Z`;
      const end = `${year + 1}-01-01T00:00:00.000Z`;

      const result = await pool.query(
        `
          SELECT
            a.project_key,
            a.project_name,
            er.checked_at AS eligibility_date,
            er.claimable_amount,
            er.claimed_amount,
            COALESCE((a.metadata->>'latest_price_usd')::numeric, (a.metadata->>'avg_payout_usd')::numeric, 0) AS fair_market_price_usd
          FROM eligibility_results er
          JOIN airdrops a ON a.id = er.airdrop_id
          WHERE LOWER(er.wallet_address) = $1
            AND er.checked_at >= $2::timestamptz
            AND er.checked_at < $3::timestamptz
            AND er.is_eligible = TRUE
          ORDER BY er.checked_at ASC
        `,
        [wallet, start, end]
      );

      const rows = result.rows.map((r) => {
        const price = Number(r.fair_market_price_usd || 0);
        const claimable = Number(r.claimable_amount || 0);
        const claimed = Number(r.claimed_amount || 0);
        const fmv = claimable * price;
        return [
          r.project_key,
          r.project_name,
          new Date(r.eligibility_date).toISOString(),
          claimable.toFixed(8),
          claimed.toFixed(8),
          price.toFixed(6),
          fmv.toFixed(2),
          "0.00", // cost basis baseline for airdrops
          fmv.toFixed(2)
        ];
      });

      const csv = toCsv(
        [
          "airdrop_key",
          "airdrop_name",
          "eligibility_date",
          "claimable_amount",
          "claimed_amount",
          "fair_market_price_usd",
          "fair_market_value_usd",
          "cost_basis_usd",
          "taxable_income_usd"
        ],
        rows
      );

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="airdrop_tax_${wallet}_${year}.csv"`);
      return res.send(csv);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
