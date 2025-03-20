import { createConfig, http } from 'wagmi';
import { optimismSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { SUPPORTED_CHAINS } from '../constants/contracts';

// Convert our supported chains to wagmi format
const chains = [optimismSepolia];

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports: {
    [optimismSepolia.id]: http(SUPPORTED_CHAINS['optimism-sepolia'].rpcUrls.default.http[0]),
  },
}); 