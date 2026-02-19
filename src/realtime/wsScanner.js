import { WebSocketServer } from "ws";

const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const COSMOS_ADDRESS_RE = /^[a-z]{2,20}1[0-9a-z]{38,74}$/i;

function isSupportedWalletAddress(value) {
  return EVM_ADDRESS_RE.test(value) || SOLANA_ADDRESS_RE.test(value) || COSMOS_ADDRESS_RE.test(value);
}

function normalizeWallets(wallets) {
  const seen = new Set();
  const out = [];
  for (const w of wallets || []) {
    if (typeof w !== "string") continue;
    const trimmed = w.trim();
    if (!isSupportedWalletAddress(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function sendJson(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function aggregate(wallets) {
  return wallets.reduce(
    (acc, row) => {
      acc.detectedAirdrops += row.detectedAirdrops;
      acc.claimEvents += row.claimEvents;
      acc.estimatedUsd += row.estimatedUsd;
      return acc;
    },
    { detectedAirdrops: 0, claimEvents: 0, estimatedUsd: 0 }
  );
}

export function setupRealtimeScanner({ server, checker, path = "/ws" }) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (!req.url || !req.url.startsWith(path)) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    let timer = null;
    let active = false;

    const clearLoop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      active = false;
    };

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(String(raw || "{}"));
        if (msg.type === "unsubscribe") {
          clearLoop();
          return sendJson(ws, { type: "unsubscribed" });
        }
        if (msg.type !== "subscribe_scan") return;

        const wallets = normalizeWallets(msg.wallets || []);
        if (!wallets.length) return sendJson(ws, { type: "error", error: "No valid wallets" });
        const includeTransfers = msg.includeTransfers !== false;
        const intervalMs = Math.max(10_000, Math.min(Number(msg.intervalMs || 30_000), 300_000));

        clearLoop();
        active = true;
        sendJson(ws, { type: "subscribed", wallets, intervalMs, includeTransfers });

        const run = async () => {
          if (!active || ws.readyState !== ws.OPEN) return;
          const results = [];
          for (const wallet of wallets) {
            results.push(await checker.checkWallet(wallet, { includeTransfers }));
          }
          sendJson(ws, {
            type: "scan_result",
            generatedAt: new Date().toISOString(),
            wallets: results,
            totals: aggregate(results)
          });
        };

        await run();
        timer = setInterval(run, intervalMs);
      } catch (error) {
        sendJson(ws, { type: "error", error: error.message || "Invalid message" });
      }
    });

    ws.on("close", () => clearLoop());
    sendJson(ws, { type: "ready", message: "Send {type:'subscribe_scan', wallets:[...]} to start" });
  });

  return wss;
}
