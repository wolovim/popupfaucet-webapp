import { createConfig, http } from 'wagmi';
import { optimismSepolia, baseSepolia, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { SUPPORTED_NETWORKS } from '../constants/networks';

// Convert our supported chains to wagmi format
const chains = [optimismSepolia, baseSepolia, sepolia];

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports: {
    [optimismSepolia.id]: http(SUPPORTED_NETWORKS['optimism-sepolia'].rpcUrls.default.http[0]),
    [baseSepolia.id]: http(SUPPORTED_NETWORKS['base-sepolia'].rpcUrls.default.http[0]),
    [sepolia.id]: http(SUPPORTED_NETWORKS['sepolia'].rpcUrls.default.http[0]),
  },
}); 