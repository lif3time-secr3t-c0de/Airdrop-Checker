async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return true;
}

export class AlertsDispatcher {
  async send({ channel, destination, message, title = "Airdrop Alert" }) {
    const ch = String(channel || "").toLowerCase();
    if (ch === "discord" || ch === "webhook") {
      await postJson(destination, { content: `${title}\n${message}` });
      return { delivered: true, channel: ch };
    }

    if (ch === "telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN || "";
      if (!token) return { delivered: false, channel: ch, reason: "missing-telegram-bot-token" };
      const chatId = destination;
      await postJson(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: `${title}\n${message}`
      });
      return { delivered: true, channel: ch };
    }

    if (ch === "email" || ch === "sms" || ch === "push") {
      return { delivered: false, channel: ch, reason: "provider-not-configured" };
    }

    return { delivered: false, channel: ch, reason: "unknown-channel" };
  }
}
