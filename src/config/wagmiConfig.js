import { createConfig, http } from 'wagmi';
import { optimismSepolia, baseSepolia, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const chains = [optimismSepolia, baseSepolia, sepolia];

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports: {
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
}); 