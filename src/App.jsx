import { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { config } from './config/wagmiConfig';
import ConnectWallet from './components/ConnectWallet';
import CreateFaucet from './components/CreateFaucet';
import FaucetDetails from './components/FaucetDetails';
import { POPUP_FAUCET_ABI, OP_SEPOLIA_FAUCET_ADDRESS } from './constants/contracts';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

// Create a client
const queryClient = new QueryClient();

function AppHeader() {
  const [faucetCount, setFaucetCount] = useState(null);
  
  const { data: countData, isError, isLoading } = useReadContract({
    address: OP_SEPOLIA_FAUCET_ADDRESS,
    abi: POPUP_FAUCET_ABI,
    functionName: 'faucet_count',
  });
  
  useEffect(() => {
    if (countData !== undefined) {
      setFaucetCount(Number(countData));
    }
  }, [countData]);

  return (
    <header>
      <div className="title-container">
        <h1>popupfaucet</h1>
        {faucetCount !== null ? (
          <span className="faucet-count">
            {isLoading ? 
              <span className="loading-spinner">⟳</span> : 
              `${faucetCount} faucets created`
            }
          </span>
        ) : isLoading ? (
          <span className="faucet-count">
            <span className="loading-spinner">⟳</span> Loading...
          </span>
        ) : null}
      </div>
      <div className="header-controls">
        <ThemeToggle />
        <ConnectWallet />
      </div>
    </header>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup' or 'create'
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <AppHeader />
          
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'lookup' ? 'active' : ''}`}
              onClick={() => setActiveTab('lookup')}
            >
              Use a Faucet
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
            <p>PopupFaucet Contract: {OP_SEPOLIA_FAUCET_ADDRESS} (Optimism Sepolia)</p>
          </footer>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App; 