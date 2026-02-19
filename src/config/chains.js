export const CHAIN_CONFIG = {
  ethereum: {
    key: "ethereum",
    type: "evm",
    name: "Ethereum",
    apiBase: "https://api.etherscan.io/api",
    apiKeyEnv: "ETHERSCAN_API_KEY"
  },
  arbitrum: {
    key: "arbitrum",
    type: "evm",
    name: "Arbitrum",
    apiBase: "https://api.arbiscan.io/api",
    apiKeyEnv: "ARBISCAN_API_KEY"
  },
  optimism: {
    key: "optimism",
    type: "evm",
    name: "Optimism",
    apiBase: "https://api-optimistic.etherscan.io/api",
    apiKeyEnv: "OPTIMISTIC_ETHERSCAN_API_KEY"
  },
  base: {
    key: "base",
    type: "evm",
    name: "Base",
    apiBase: "https://api.basescan.org/api",
    apiKeyEnv: "BASESCAN_API_KEY"
  },
  polygon: {
    key: "polygon",
    type: "evm",
    name: "Polygon",
    apiBase: "https://api.polygonscan.com/api",
    apiKeyEnv: "POLYGONSCAN_API_KEY"
  },
  bsc: {
    key: "bsc",
    type: "evm",
    name: "BNB Chain",
    apiBase: "https://api.bscscan.com/api",
    apiKeyEnv: "BSCSCAN_API_KEY"
  },
  solana: {
    key: "solana",
    type: "solana",
    name: "Solana",
    apiBase: "https://api.solana.fm/v0",
    apiKeyEnv: "SOLANAFM_API_KEY"
  },
  cosmos: {
    key: "cosmos",
    type: "cosmos",
    name: "Cosmos",
    apiBase: "https://api.mintscan.io",
    apiKeyEnv: "MINTSCAN_API_KEY"
  }
};

export function getChainConfig(chainKey) {
  return CHAIN_CONFIG[chainKey] || null;
}
