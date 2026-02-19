#!/usr/bin/env python3
"""
Fetch token prices from CoinGecko and update airdrops.metadata in PostgreSQL.

Usage:
  python scripts/update_token_prices.py
  python scripts/update_token_prices.py --dry-run
  python scripts/update_token_prices.py --limit 20

Environment:
  DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
  COINGECKO_API_BASE=https://api.coingecko.com/api/v3
  COINGECKO_API_KEY=... (optional, for pro setups)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Iterable, List, Optional, Tuple

import psycopg
import requests


COINGECKO_API_BASE = os.getenv("COINGECKO_API_BASE", "https://api.coingecko.com/api/v3").rstrip("/")
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "").strip()
REQUEST_TIMEOUT_SECONDS = 25
PRICE_BATCH_SIZE = 100
SLEEP_BETWEEN_BATCHES_SECONDS = 1.1


# Use this for deterministic mapping when symbol collisions exist.
SYMBOL_ID_OVERRIDES: Dict[str, str] = {
    "uni": "uniswap",
    "ens": "ethereum-name-service",
    "op": "optimism",
    "arb": "arbitrum",
    "gmx": "gmx",
    "ldo": "lido-dao",
    "ape": "apecoin",
    "blur": "blur",
    "looks": "looksrare",
    "cow": "cow-protocol",
    "1inch": "1inch",
    "pendle": "pendle",
    "safe": "safe",
    "pyth": "pyth-network",
    "magic": "magic",
    "rdnt": "radiant-capital",
}


def build_headers() -> Dict[str, str]:
    headers = {"accept": "application/json"}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY
    return headers


def chunks(values: List[str], size: int) -> Iterable[List[str]]:
    for i in range(0, len(values), size):
        yield values[i : i + size]


def fetch_airdrops(conn: psycopg.Connection, limit: Optional[int]) -> List[dict]:
    query = """
        SELECT
          id,
          project_key,
          project_name,
          token_symbol,
          metadata,
          metadata->>'coingecko_id' AS coingecko_id
        FROM airdrops
        WHERE token_symbol IS NOT NULL
        ORDER BY id ASC
    """
    if limit:
        query += " LIMIT %s"
        with conn.cursor() as cur:
            cur.execute(query, (limit,))
            rows = cur.fetchall()
    else:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    out = []
    for row in rows:
        out.append(
            {
                "id": row[0],
                "project_key": row[1],
                "project_name": row[2],
                "token_symbol": row[3],
                "metadata": row[4] or {},
                "coingecko_id": row[5],
            }
        )
    return out


def fetch_coins_list(session: requests.Session) -> List[dict]:
    url = f"{COINGECKO_API_BASE}/coins/list"
    resp = session.get(url, params={"include_platform": "false"}, timeout=REQUEST_TIMEOUT_SECONDS)
    resp.raise_for_status()
    return resp.json()


def resolve_coin_id(
    symbol: str, coins_by_symbol: Dict[str, List[dict]]
) -> Tuple[Optional[str], str]:
    symbol_lc = symbol.strip().lower()
    if not symbol_lc:
        return None, "empty-symbol"

    if symbol_lc in SYMBOL_ID_OVERRIDES:
        return SYMBOL_ID_OVERRIDES[symbol_lc], "override"

    candidates = coins_by_symbol.get(symbol_lc, [])
    if len(candidates) == 1:
        return candidates[0]["id"], "unique-symbol"
    if len(candidates) > 1:
        return None, f"ambiguous:{len(candidates)}"
    return None, "not-found"


def fetch_prices(session: requests.Session, coin_ids: List[str]) -> Dict[str, dict]:
    prices: Dict[str, dict] = {}
    for batch in chunks(coin_ids, PRICE_BATCH_SIZE):
        url = f"{COINGECKO_API_BASE}/simple/price"
        params = {
            "ids": ",".join(batch),
            "vs_currencies": "usd",
            "include_last_updated_at": "true",
        }
        resp = session.get(url, params=params, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        payload = resp.json()
        for coin_id, entry in payload.items():
            prices[coin_id] = entry
        time.sleep(SLEEP_BETWEEN_BATCHES_SECONDS)
    return prices


def update_row(
    conn: psycopg.Connection,
    airdrop_id: int,
    coingecko_id: str,
    price_usd: Decimal,
    updated_at_iso: str,
) -> None:
    # Keep everything in metadata to avoid schema changes.
    query = """
        UPDATE airdrops
        SET metadata = jsonb_strip_nulls(
          COALESCE(metadata, '{}'::jsonb)
          || jsonb_build_object(
            'coingecko_id', %s,
            'latest_price_usd', %s::numeric,
            'price_source', 'coingecko',
            'price_updated_at', %s
          )
        )
        WHERE id = %s
    """
    with conn.cursor() as cur:
        cur.execute(query, (coingecko_id, str(price_usd), updated_at_iso, airdrop_id))


def main() -> int:
    parser = argparse.ArgumentParser(description="Update token prices from CoinGecko into PostgreSQL.")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print changes without writing DB.")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of airdrops to process.")
    args = parser.parse_args()

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        print("ERROR: DATABASE_URL is required.", file=sys.stderr)
        return 1

    session = requests.Session()
    session.headers.update(build_headers())

    try:
        with psycopg.connect(database_url) as conn:
            airdrops = fetch_airdrops(conn, args.limit)
            if not airdrops:
                print("No airdrops with token_symbol found.")
                return 0

            coins = fetch_coins_list(session)
            coins_by_symbol: Dict[str, List[dict]] = defaultdict(list)
            for coin in coins:
                symbol = str(coin.get("symbol", "")).lower()
                if symbol:
                    coins_by_symbol[symbol].append(coin)

            resolved = []
            unresolved = []
            for row in airdrops:
                if row["coingecko_id"]:
                    resolved.append((row, row["coingecko_id"], "metadata"))
                    continue
                coin_id, reason = resolve_coin_id(row["token_symbol"], coins_by_symbol)
                if coin_id:
                    resolved.append((row, coin_id, reason))
                else:
                    unresolved.append((row, reason))

            if unresolved:
                print(f"Unresolved {len(unresolved)} airdrops:")
                for row, reason in unresolved:
                    print(f"  - id={row['id']} key={row['project_key']} symbol={row['token_symbol']} ({reason})")

            unique_coin_ids = sorted({coin_id for _, coin_id, _ in resolved})
            if not unique_coin_ids:
                print("No resolvable CoinGecko IDs.")
                return 0

            price_map = fetch_prices(session, unique_coin_ids)
            now_iso = datetime.now(timezone.utc).isoformat()

            updated = 0
            skipped = 0
            for row, coin_id, source in resolved:
                entry = price_map.get(coin_id, {})
                usd_value = entry.get("usd")
                if usd_value is None:
                    skipped += 1
                    print(f"SKIP id={row['id']} key={row['project_key']} coin_id={coin_id} no USD price")
                    continue

                usd = Decimal(str(usd_value))
                if args.dry_run:
                    print(
                        f"DRY-RUN id={row['id']} key={row['project_key']} "
                        f"symbol={row['token_symbol']} coin_id={coin_id} source={source} usd={usd}"
                    )
                else:
                    update_row(conn, row["id"], coin_id, usd, now_iso)
                updated += 1

            if args.dry_run:
                print(f"Dry-run complete. Would update {updated} rows, skipped {skipped}.")
            else:
                conn.commit()
                print(f"Done. Updated {updated} rows, skipped {skipped}.")

            return 0
    except requests.RequestException as exc:
        print(f"HTTP error: {exc}", file=sys.stderr)
        return 2
    except psycopg.Error as exc:
        print(f"Database error: {exc}", file=sys.stderr)
        return 3
    except Exception as exc:  # Defensive final guard
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
