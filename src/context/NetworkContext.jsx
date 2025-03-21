import { createContext, useState, useContext, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { SUPPORTED_NETWORKS } from '../constants/networks';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Default to the first network in our supported list
  const [selectedNetwork, setSelectedNetwork] = useState(
    Object.keys(SUPPORTED_NETWORKS)[0]
  );

  // When user changes networks in their wallet, update our selected network if it's supported
  useEffect(() => {
    if (chain) {
      const matchedNetwork = Object.entries(SUPPORTED_NETWORKS).find(
        ([_, networkConfig]) => networkConfig.id === chain.id
      );
      
      if (matchedNetwork) {
        setSelectedNetwork(matchedNetwork[0]);
      }
    }
  }, [chain]);

  // Handle network change from our UI
  const changeNetwork = async (networkKey) => {
    setSelectedNetwork(networkKey);
    
    // If user is connected to wallet, also switch the network in their wallet
    if (switchChain) {
      const networkId = SUPPORTED_NETWORKS[networkKey].id;
      switchChain({ chainId: networkId });
    }
  };

  return (
    <NetworkContext.Provider value={{ selectedNetwork, changeNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkContext() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
} 