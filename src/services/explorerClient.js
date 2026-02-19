function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ExplorerClient {
  constructor({ apiBase, apiKey = "", timeoutMs = 15_000, retries = 2 }) {
    this.apiBase = apiBase;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
    this.retries = retries;
  }

  async request(params, retryLeft = this.retries) {
    if (!this.apiKey) {
      throw new Error("Explorer API key missing");
    }

    const query = buildQuery({ ...params, apikey: this.apiKey });
    const url = `${this.apiBase}?${query}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (String(json.status) === "1") return json.result;
      const resultText = String(json.result || json.message || "");
      if (resultText.toLowerCase().includes("no transactions found")) return [];

      if (retryLeft > 0 && /rate limit|max rate|too many requests/i.test(resultText)) {
        await wait(400);
        return this.request(params, retryLeft - 1);
      }

      throw new Error(resultText || "Explorer API error");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getTokenBalance({ address, contractAddress }) {
    const result = await this.request({
      module: "account",
      action: "tokenbalance",
      address,
      contractaddress: contractAddress,
      tag: "latest"
    });
    return typeof result === "string" ? result : "0";
  }

  async getTokenTransfers({ address, contractAddress, offset = 100 }) {
    const result = await this.request({
      module: "account",
      action: "tokentx",
      address,
      contractaddress: contractAddress,
      page: "1",
      offset: String(offset),
      sort: "asc"
    });
    return Array.isArray(result) ? result : [];
  }
}
