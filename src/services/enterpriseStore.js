import fs from "fs/promises";
import path from "path";

const DEFAULT_STATE = {
  branding: {
    brandName: "Airdrop Checker",
    logoUrl: "",
    primaryColor: "#38f08b",
    customDomain: "",
    hideVendorBranding: false,
    apiEnabled: true
  },
  customAirdrops: []
};

export class EnterpriseStore {
  constructor({ filePath = path.join(process.cwd(), "data", "enterprise-store.json") } = {}) {
    this.filePath = filePath;
    this.state = { ...DEFAULT_STATE };
    this.loaded = false;
  }

  async init() {
    if (this.loaded) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      this.state = {
        branding: { ...DEFAULT_STATE.branding, ...(parsed.branding || {}) },
        customAirdrops: Array.isArray(parsed.customAirdrops) ? parsed.customAirdrops : []
      };
    } catch {
      await this.persist();
    }
    this.loaded = true;
  }

  async persist() {
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf-8");
  }

  async getBranding() {
    await this.init();
    return { ...this.state.branding };
  }

  async setBranding(update) {
    await this.init();
    this.state.branding = {
      ...this.state.branding,
      ...update
    };
    await this.persist();
    return this.getBranding();
  }

  async listCustomAirdrops() {
    await this.init();
    return [...this.state.customAirdrops];
  }

  async upsertCustomAirdrop(item) {
    await this.init();
    const key = String(item.key || "").toUpperCase().trim();
    if (!key) throw new Error("Custom airdrop key is required");
    const payload = {
      key,
      name: String(item.name || key),
      tokenAddress: item.tokenAddress || null,
      chain: String(item.chain || "ethereum"),
      rule: item.rule || {},
      metadata: item.metadata || {},
      updatedAt: new Date().toISOString()
    };

    const idx = this.state.customAirdrops.findIndex((x) => x.key === key);
    if (idx >= 0) this.state.customAirdrops[idx] = payload;
    else this.state.customAirdrops.push(payload);
    await this.persist();
    return payload;
  }
}
