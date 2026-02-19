import { AIRDROPS } from "../config/airdrops.js";
import { asyncPool } from "../utils/asyncPool.js";

export class AirdropChecker {
  constructor({ scanner, perWalletConcurrency = 6 }) {
    this.scanner = scanner;
    this.perWalletConcurrency = perWalletConcurrency;
  }

  async checkWallet(wallet, { includeTransfers = true } = {}) {
    const checks = await asyncPool(this.perWalletConcurrency, AIRDROPS, (drop) =>
      this.checkSingleAirdrop(wallet, drop, includeTransfers)
    );

    const matches = checks.filter((item) => item.detected);
    const detectedAirdrops = matches.length;
    const claimEvents = matches.reduce((sum, item) => sum + item.claimEvents, 0);
    const estimatedUsd = matches.reduce((sum, item) => sum + item.estimatedUsd, 0);

    return {
      wallet,
      detectedAirdrops,
      claimEvents,
      estimatedUsd,
      matches
    };
  }

  async checkSingleAirdrop(wallet, airdrop, includeTransfers) {
    return this.scanner.scanAirdrop(wallet, airdrop, includeTransfers);
  }
}
