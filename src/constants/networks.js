export const SUPPORTED_NETWORKS = {
  "optimism-sepolia": {
    id: 11155420,
    name: "Optimism Sepolia",
    network: "optimism-sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_OP_SEPOLIA_URL],
      },
      public: {
        http: ["https://sepolia.optimism.io"],
      },
    },
    blockExplorers: {
      default: {
        name: "Optimism Sepolia Explorer",
        url: "https://sepolia-optimism.etherscan.io",
      },
    },
    contractAddress: import.meta.env.VITE_OP_SEPOLIA_FAUCET_ADDRESS,
  },
  "base-sepolia": {
    id: 84532,
    name: "Base Sepolia",
    network: "base-sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_BASE_SEPOLIA_URL],
      },
      public: {
        http: ["https://sepolia.base.org"],
      },
    },
    blockExplorers: {
      default: {
        name: "Base Sepolia Explorer",
        url: "https://sepolia.basescan.org",
      },
    },
    contractAddress: import.meta.env.VITE_BASE_SEPOLIA_FAUCET_ADDRESS,
  },
  "sepolia": {
    id: 11155111,
    name: "Sepolia",
    network: "sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_SEPOLIA_URL],
      },
      public: {
        http: ["https://rpc.sepolia.org"],
      },
    },
    blockExplorers: {
      default: {
        name: "Sepolia Explorer",
        url: "https://sepolia.etherscan.io",
      },
    },
    contractAddress: import.meta.env.VITE_SEPOLIA_FAUCET_ADDRESS,
  },
};

export function getNetworkConfig(networkKey) {
  return SUPPORTED_NETWORKS[networkKey] || SUPPORTED_NETWORKS["optimism-sepolia"];
}

export function getContractAddress(networkKey) {
  const network = getNetworkConfig(networkKey);
  return network.contractAddress;
} 