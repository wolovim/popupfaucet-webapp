import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmiConfig';
import ConnectWallet from './components/ConnectWallet';
import CreateFaucet from './components/CreateFaucet';
import FaucetDetails from './components/FaucetDetails';
import { NetworkProvider, useNetworkContext } from './context/NetworkContext';
import { getContractAddress, getNetworkName } from './constants/networks';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

const queryClient = new QueryClient();

function AppHeader() {
  return (
    <header>
      <div className="title-container">
        <h1>popupfaucet</h1>
      </div>
      <div className="header-controls">
        <ThemeToggle />
        <ConnectWallet />
      </div>
    </header>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup' or 'create'
  const { selectedNetwork } = useNetworkContext();
  
  const contractAddress = getContractAddress(selectedNetwork) || "Not available";
  const networkName = getNetworkName(selectedNetwork) || "Not available";

  return (
    <>
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'lookup' ? 'active' : ''}`}
          onClick={() => setActiveTab('lookup')}
        >
          Use Faucet
        </button>
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Faucet
        </button>
      </div>
      
      <main className="tab-content">
        {activeTab === 'lookup' ? (
          <FaucetDetails />
        ) : (
          <CreateFaucet />
        )}
      </main>
      
      <footer>
        <p>PopupFaucet Contract: {contractAddress} ({networkName})</p>
      </footer>
    </>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <div className="app">
            <AppHeader />
            <AppContent />
          </div>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App; 