import "dotenv/config";
import http from "http";
import app from "./app.js";
import { setupRealtimeScanner } from "./realtime/wsScanner.js";

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);
setupRealtimeScanner({
  server,
  checker: app.locals.checker,
  path: "/ws"
});

server.listen(PORT, () => {
  console.log(`Airdrop backend listening on http://localhost:${PORT}`);
});
