import { createConfig, http } from 'wagmi';
import { optimismSepolia, baseSepolia, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const hoodi = defineChain({
  id: 560048,
  name: 'Hoodi',
  nativeCurrency: { name: 'Hoodi', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://0xrpc.io/hoodi'] } },
  blockExplorers: { default: { name: 'Hoodi Explorer', url: 'https://eth-hoodi.blockscout.com' } },
});

const chains = [optimismSepolia, baseSepolia, sepolia, hoodi];

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports: {
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [hoodi.id]: http(),
  },
}); 