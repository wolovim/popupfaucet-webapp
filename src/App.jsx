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
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  return (
    <header>
      <div className="title-container">
        <div className="title-with-info">
          <h1>popupfaucet</h1>
          <button 
            className="info-link"
            onClick={() => setShowInfoModal(true)}
          >
            What is this?
          </button>
        </div>
      </div>
      <div className="header-controls">
        <ThemeToggle />
        <ConnectWallet />
      </div>
      
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={() => setShowInfoModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <p><span className="app-name">popupfaucet</span> <b>enables anyone to create and manage their own testnet faucets.</b></p>
              <p>
                Unlike traditional public faucets that need complex anti-abuse measures, popupfaucet
                relies on trust within small communities to distribute funds efficiently.
              </p>
              <p>
                If you know the name of a faucet, you can freely request funds from it.
              </p>
              <p>
                Create a faucet for your team, community, or workshop and distribute tokens
                without the constraints of public faucets.
              </p>
            </div>
          </div>
        </div>
      )}
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
      
      <footer className="app-footer">
        <p className="contract-info">PopupFaucet Contract: {contractAddress} ({networkName})</p>
        <div className="footer-content">
          <div className="footer-text">
            <span>vibed with 🖤 by</span>
            <span>EF Python Team</span>
          </div>
          <div className="footer-right">
            <img src="/snek.svg" alt="Snakey Logo" className="footer-logo" />
            <div className="social-links">
              <a href="https://github.com/ethereum/web3.py" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="https://snakecharmers.ethereum.org" target="_blank" rel="noopener noreferrer" aria-label="Blog">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="social-icon">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </a>
              <a href="https://warpcast.com/ethereumpython" target="_blank" rel="noopener noreferrer" aria-label="Farcaster">
                <svg width="20" height="20" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="social-icon">
                  <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z" fill="currentColor"/>
                  <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" fill="currentColor"/>
                  <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://x.com/EthereumPython" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
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