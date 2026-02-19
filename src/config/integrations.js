export const INTEGRATIONS = [
  {
    key: "etherscan",
    name: "Etherscan",
    category: "explorer",
    freeTierLimit: "5 calls/sec",
    envKeys: ["ETHERSCAN_API_KEY"],
    docsUrl: "https://docs.etherscan.io/"
  },
  {
    key: "coingecko",
    name: "CoinGecko",
    category: "market-data",
    freeTierLimit: "50 calls/min",
    envKeys: ["COINGECKO_API_KEY"],
    docsUrl: "https://www.coingecko.com/en/api/documentation"
  },
  {
    key: "the_graph",
    name: "The Graph",
    category: "indexing",
    freeTierLimit: "100k queries/mo",
    envKeys: ["THEGRAPH_API_KEY"],
    docsUrl: "https://thegraph.com/docs/"
  },
  {
    key: "moralis",
    name: "Moralis",
    category: "web3-data",
    freeTierLimit: "40k calls/mo",
    envKeys: ["MORALIS_API_KEY"],
    docsUrl: "https://docs.moralis.com/"
  },
  {
    key: "covalent",
    name: "Covalent",
    category: "web3-data",
    freeTierLimit: "100k calls/mo",
    envKeys: ["COVALENT_API_KEY"],
    docsUrl: "https://www.covalenthq.com/docs/"
  },
  {
    key: "alchemy",
    name: "Alchemy",
    category: "rpc",
    freeTierLimit: "300M compute units/mo",
    envKeys: ["ALCHEMY_API_KEY"],
    docsUrl: "https://docs.alchemy.com/"
  },
  {
    key: "infura",
    name: "Infura",
    category: "rpc",
    freeTierLimit: "100k requests/day",
    envKeys: ["INFURA_API_KEY"],
    docsUrl: "https://docs.infura.io/"
  },
  {
    key: "quicknode",
    name: "QuickNode",
    category: "rpc",
    freeTierLimit: "25k requests/mo",
    envKeys: ["QUICKNODE_API_KEY"],
    docsUrl: "https://www.quicknode.com/docs"
  },
  {
    key: "bscscan",
    name: "BscScan",
    category: "explorer",
    freeTierLimit: "10 calls/sec",
    envKeys: ["BSCSCAN_API_KEY"],
    docsUrl: "https://docs.bscscan.com/"
  },
  {
    key: "polygonscan",
    name: "Polygonscan",
    category: "explorer",
    freeTierLimit: "5 calls/sec",
    envKeys: ["POLYGONSCAN_API_KEY"],
    docsUrl: "https://docs.polygonscan.com/"
  },
  {
    key: "arbiscan",
    name: "Arbiscan",
    category: "explorer",
    freeTierLimit: "5 calls/sec",
    envKeys: ["ARBISCAN_API_KEY"],
    docsUrl: "https://docs.arbiscan.io/"
  },
  {
    key: "optimistic_etherscan",
    name: "Optimistic Etherscan",
    category: "explorer",
    freeTierLimit: "5 calls/sec",
    envKeys: ["OPTIMISTIC_ETHERSCAN_API_KEY"],
    docsUrl: "https://docs.etherscan.io/"
  },
  {
    key: "basescan",
    name: "Basescan",
    category: "explorer",
    freeTierLimit: "5 calls/sec",
    envKeys: ["BASESCAN_API_KEY"],
    docsUrl: "https://docs.basescan.org/"
  },
  {
    key: "solanafm",
    name: "SolanaFM",
    category: "explorer",
    freeTierLimit: "1000 requests/day",
    envKeys: ["SOLANAFM_API_KEY"],
    docsUrl: "https://docs.solana.fm/"
  },
  {
    key: "flipside",
    name: "Flipside Crypto",
    category: "analytics",
    freeTierLimit: "10k queries/mo",
    envKeys: ["FLIPSIDE_API_KEY"],
    docsUrl: "https://docs.flipsidecrypto.xyz/"
  },
  {
    key: "dune",
    name: "Dune Analytics",
    category: "analytics",
    freeTierLimit: "100k credits/mo",
    envKeys: ["DUNE_API_KEY"],
    docsUrl: "https://dune.com/docs/api/"
  }
];
