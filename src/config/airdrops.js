export const AIRDROPS = [
  // Ethereum
  { key: "UNI", name: "Uniswap", chain: "ethereum", chainId: "1", tokenAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18, priceUsd: 10, avgAirdropUsd: 1200 },
  { key: "ENS", name: "ENS", chain: "ethereum", chainId: "1", tokenAddress: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72", decimals: 18, priceUsd: 30, avgAirdropUsd: 500 },
  { key: "DYDX", name: "dYdX", chain: "ethereum", chainId: "1", tokenAddress: "0x92d6c1e31e14520e676a687f0a93788b716beff5", decimals: 18, priceUsd: 2, avgAirdropUsd: 700 },
  { key: "1INCH", name: "1inch", chain: "ethereum", chainId: "1", tokenAddress: "0x111111111117dc0aa78b770fa6a738034120c302", decimals: 18, priceUsd: 0.5, avgAirdropUsd: 300 },
  { key: "AAVE", name: "Aave", chain: "ethereum", chainId: "1", tokenAddress: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", decimals: 18, priceUsd: 90, avgAirdropUsd: 1000 },
  { key: "COMP", name: "Compound", chain: "ethereum", chainId: "1", tokenAddress: "0xc00e94cb662c3520282e6f5717214004a7f26888", decimals: 18, priceUsd: 55, avgAirdropUsd: 600 },
  { key: "SUSHI", name: "SushiSwap", chain: "ethereum", chainId: "1", tokenAddress: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", decimals: 18, priceUsd: 1.2, avgAirdropUsd: 400 },
  { key: "CRV", name: "Curve", chain: "ethereum", chainId: "1", tokenAddress: "0xd533a949740bb3306d119cc777fa900ba034cd52", decimals: 18, priceUsd: 0.6, avgAirdropUsd: 800 },
  { key: "CVX", name: "Convex", chain: "ethereum", chainId: "1", tokenAddress: "0x4e3fbd56cd56c3e6dffa66b113c6185b4426bf8c", decimals: 18, priceUsd: 3.5, avgAirdropUsd: 500 },
  { key: "LOOKS", name: "LooksRare", chain: "ethereum", chainId: "1", tokenAddress: "0xf4d2888d29d722226fafa5d9b24f9164c092421e", decimals: 18, priceUsd: 0.1, avgAirdropUsd: 300 },
  { key: "BLUR", name: "Blur", chain: "ethereum", chainId: "1", tokenAddress: "0x5283d291dbcf85356a21ba090e6db59121208b44", decimals: 18, priceUsd: 0.3, avgAirdropUsd: 600 },
  { key: "ETHFI", name: "EtherFi", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 700 },
  { key: "REZ", name: "Renzo", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 300 },
  { key: "KELP", name: "Kelp", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 250 },
  { key: "SWELL", name: "Swell", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 300 },
  { key: "ENA", name: "Ethena", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 800 },

  // Arbitrum
  { key: "ARB", name: "Arbitrum", chain: "arbitrum", chainId: "42161", tokenAddress: "0x912ce59144191c1204e64559fe8253a0e49e6548", decimals: 18, priceUsd: 2, avgAirdropUsd: 1500 },
  { key: "GMX", name: "GMX", chain: "arbitrum", chainId: "42161", tokenAddress: "0xfc5a1a6eb076a6ca4a8574adfdf3f5f2c0f8b5f0", decimals: 18, priceUsd: 35, avgAirdropUsd: 900 },
  { key: "RDNT", name: "Radiant", chain: "arbitrum", chainId: "42161", tokenAddress: "0x3082cc23568ea640225c2467653db90e9250aaa0", decimals: 18, priceUsd: 0.2, avgAirdropUsd: 600 },
  { key: "MAGIC", name: "Treasure", chain: "arbitrum", chainId: "42161", tokenAddress: "0x539bde0d7dbd336b79148aa742883198bbf60342", decimals: 18, priceUsd: 0.8, avgAirdropUsd: 400 },

  // Optimism
  { key: "OP", name: "Optimism", chain: "optimism", chainId: "10", tokenAddress: "0x4200000000000000000000000000000000000042", decimals: 18, priceUsd: 4, avgAirdropUsd: 800 },
  { key: "VELO", name: "Velodrome", chain: "optimism", chainId: "10", tokenAddress: "0x9560e827af36c94d2ac33a39bce1fe78631088db", decimals: 18, priceUsd: 0.08, avgAirdropUsd: 300 },
  { key: "SONNE", name: "Sonne", chain: "optimism", chainId: "10", tokenAddress: "0x1db2466d9f5e10d7090e7152b68d62703a2245f0", decimals: 18, priceUsd: 0.05, avgAirdropUsd: 250 },

  // Base
  { key: "AERO", name: "Aerodrome", chain: "base", chainId: "8453", tokenAddress: "0x940181a94a35a4569e4529a3cdfb74e38fd98631", decimals: 18, priceUsd: 1.3, avgAirdropUsd: 450 },
  { key: "FRIEND", name: "Friend.tech", chain: "base", chainId: "8453", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 300 },

  // Polygon
  { key: "MATIC", name: "Polygon", chain: "polygon", chainId: "137", tokenAddress: null, decimals: 18, priceUsd: 0.8, avgAirdropUsd: 350 },
  { key: "QUICK", name: "QuickSwap", chain: "polygon", chainId: "137", tokenAddress: "0x831753dd7087cac61ab5644b308642cc1c33dc13", decimals: 18, priceUsd: 0.04, avgAirdropUsd: 200 },

  // BNB Chain
  { key: "CAKE", name: "PancakeSwap", chain: "bsc", chainId: "56", tokenAddress: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", decimals: 18, priceUsd: 2.7, avgAirdropUsd: 400 },
  { key: "BANANA", name: "ApeSwap", chain: "bsc", chainId: "56", tokenAddress: "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", decimals: 18, priceUsd: 0.02, avgAirdropUsd: 200 },

  // Solana (SolanaFM adapter)
  { key: "JTO", name: "Jito", chain: "solana", chainId: "0", tokenAddress: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwA9v2f9mCL", decimals: 9, priceUsd: 2.8, avgAirdropUsd: 400 },
  { key: "PYTH", name: "Pyth", chain: "solana", chainId: "0", tokenAddress: "HZ1JovNiVvGrGNiiYv5f3B8wLxbuKQ4u6r4s4s6Yv8o", decimals: 6, priceUsd: 0.7, avgAirdropUsd: 300 },
  { key: "JUP", name: "Jupiter", chain: "solana", chainId: "0", tokenAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6, priceUsd: 0.9, avgAirdropUsd: 500 },
  { key: "TNSR", name: "Tensor", chain: "solana", chainId: "0", tokenAddress: null, decimals: 6, priceUsd: 0.35, avgAirdropUsd: 400 },
  { key: "W", name: "Wormhole", chain: "solana", chainId: "0", tokenAddress: null, decimals: 6, priceUsd: 0.9, avgAirdropUsd: 600 },

  // Cosmos (Mintscan adapter placeholders)
  { key: "ATOM", name: "Cosmos Hub", chain: "cosmos", chainId: "0", tokenAddress: "uatom", decimals: 6, priceUsd: 8, avgAirdropUsd: 400 },
  { key: "OSMO", name: "Osmosis", chain: "cosmos", chainId: "0", tokenAddress: "uosmo", decimals: 6, priceUsd: 0.9, avgAirdropUsd: 350 },
  { key: "TIA", name: "Celestia", chain: "cosmos", chainId: "0", tokenAddress: "utia", decimals: 6, priceUsd: 10, avgAirdropUsd: 1000 },
  { key: "SAGA", name: "Saga", chain: "cosmos", chainId: "0", tokenAddress: null, decimals: 6, priceUsd: 0, avgAirdropUsd: 500 },

  // Other major historical entries
  { key: "APT", name: "Aptos", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 2000 },
  { key: "STRK", name: "StarkNet", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 1500 },
  { key: "ZK", name: "zkSync", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 1200 },
  { key: "ZRO", name: "LayerZero", chain: "ethereum", chainId: "1", tokenAddress: "0x6985884c4392d348587b19cb9eaaf157f13271cd", decimals: 18, priceUsd: 3, avgAirdropUsd: 2000 },
  { key: "EIGEN", name: "EigenLayer", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 1800 },
  { key: "MORE", name: "Additional Major Airdrops", chain: "ethereum", chainId: "1", tokenAddress: null, decimals: 18, priceUsd: 0, avgAirdropUsd: 0 }
];

export const AIRDROP_COUNT = AIRDROPS.length;
