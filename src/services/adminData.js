import { Pool } from "pg";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class AdminDataService {
  constructor(databaseUrl) {
    this.enabled = Boolean(databaseUrl);
    this.pool = this.enabled
      ? new Pool({
          connectionString: databaseUrl,
          max: 5,
          idleTimeoutMillis: 10_000
        })
      : null;
  }

  async getSummary() {
    if (!this.enabled || !this.pool) {
      return {
        databaseConnected: false,
        users: { total: 0, active: 0 },
        earnings: { claimableUsd: 0, claimedUsd: 0, eligibleResults: 0 },
        alerts: { total: 0, enabled: 0 }
      };
    }

    const client = await this.pool.connect();
    try {
      const [usersRes, earningsRes, alertsRes] = await Promise.all([
        client.query(`
          SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE is_active = TRUE)::bigint AS active
          FROM users
        `),
        client.query(`
          SELECT
            COALESCE(SUM(er.claimable_amount * COALESCE((a.metadata->>'latest_price_usd')::numeric, 0)), 0)::numeric AS claimable_usd,
            COALESCE(SUM(er.claimed_amount * COALESCE((a.metadata->>'latest_price_usd')::numeric, 0)), 0)::numeric AS claimed_usd,
            COUNT(*) FILTER (WHERE er.is_eligible = TRUE)::bigint AS eligible_results
          FROM eligibility_results er
          JOIN airdrops a ON a.id = er.airdrop_id
        `),
        client.query(`
          SELECT
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE is_enabled = TRUE)::bigint AS enabled
          FROM alerts
        `)
      ]);

      return {
        databaseConnected: true,
        users: {
          total: toNumber(usersRes.rows[0]?.total),
          active: toNumber(usersRes.rows[0]?.active)
        },
        earnings: {
          claimableUsd: toNumber(earningsRes.rows[0]?.claimable_usd),
          claimedUsd: toNumber(earningsRes.rows[0]?.claimed_usd),
          eligibleResults: toNumber(earningsRes.rows[0]?.eligible_results)
        },
        alerts: {
          total: toNumber(alertsRes.rows[0]?.total),
          enabled: toNumber(alertsRes.rows[0]?.enabled)
        }
      };
    } catch (error) {
      return {
        databaseConnected: false,
        warning: `Admin metrics fallback: ${error.message || "query failed"}`,
        users: { total: 0, active: 0 },
        earnings: { claimableUsd: 0, claimedUsd: 0, eligibleResults: 0 },
        alerts: { total: 0, enabled: 0 }
      };
    } finally {
      client.release();
    }
  }
}
