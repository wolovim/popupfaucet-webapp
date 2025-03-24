import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { POPUP_FAUCET_ABI } from '../constants/contracts';
import { useNetworkContext } from '../context/NetworkContext';
import { getContractAddress, SUPPORTED_NETWORKS } from '../constants/networks';
import '../styles/FaucetDetails.css';
import NetworkTypeahead from './NetworkTypeahead';

export default function FaucetDetails() {
  const { address } = useAccount();
  const { selectedNetwork, changeNetwork } = useNetworkContext();
  const contractAddress = getContractAddress(selectedNetwork);
  
  const [faucetName, setFaucetName] = useState('');
  const [currentFaucetName, setCurrentFaucetName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [faucetDetails, setFaucetDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [compactSearch, setCompactSearch] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  // Read contract data - only enabled when we have a currentFaucetName (after button click)
  const { data: faucetData, refetch, isError, error: readError, isLoading: isReadLoading } = useReadContract({
    address: contractAddress,
    abi: POPUP_FAUCET_ABI,
    functionName: 'get_faucet',
    args: currentFaucetName ? [currentFaucetName] : undefined,
    enabled: !!currentFaucetName,
  });

  // Write contract functions
  const { data: dripHash, writeContract: writeDrip, isPending: isDripPending } = useWriteContract();
  const { data: topupHash, writeContract: writeTopup, isPending: isTopupPending } = useWriteContract();
  const { data: pauseHash, writeContract: writePause, isPending: isPausePending } = useWriteContract();
  const { data: unpauseHash, writeContract: writeUnpause, isPending: isUnpausePending } = useWriteContract();
  const { data: withdrawHash, writeContract: writeWithdraw, isPending: isWithdrawPending } = useWriteContract();

  // Transaction receipts
  const { isLoading: isDripConfirming, isSuccess: isDripConfirmed } = useWaitForTransactionReceipt({ hash: dripHash });
  const { isLoading: isTopupConfirming, isSuccess: isTopupConfirmed } = useWaitForTransactionReceipt({ hash: topupHash });
  const { isLoading: isPauseConfirming, isSuccess: isPauseConfirmed } = useWaitForTransactionReceipt({ hash: pauseHash });
  const { isLoading: isUnpauseConfirming, isSuccess: isUnpauseConfirmed } = useWaitForTransactionReceipt({ hash: unpauseHash });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // Reset state when network changes
  useEffect(() => {
    setFaucetName('');
    setCurrentFaucetName('');
    setFaucetDetails(null);
    setError(null);
    setFetchAttempted(false);
    setCompactSearch(false);
    setShowTopup(false);
  }, [selectedNetwork]);

  useEffect(() => {
    if (faucetData) {
      try {
        if (faucetData.creator === '0x0000000000000000000000000000000000000000') {
          setError(`Faucet "${currentFaucetName}" does not exist`);
          setFaucetDetails(null);
        } else {
          const dripAmountValue = faucetData.drip_amount || 0n;
          const balanceValue = faucetData.balance || 0n;
          const dripAmountFormatted = formatEther(dripAmountValue);
          const balanceFormatted = formatEther(balanceValue);
          
          setFaucetDetails({
            dripAmount: dripAmountFormatted,
            balance: balanceFormatted,
            paused: Boolean(faucetData.paused),
            creator: faucetData.creator || '0x0000000000000000000000000000000000000000',
          });
          setError(null);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error formatting faucet data:", err);
        setError(`Error processing faucet data: ${err.message}`);
        setFaucetDetails(null);
        setLoading(false);
      }
    } else if (isError && fetchAttempted) {
      const errorMessage = readError?.message || '';
      
      if (errorMessage.includes('Faucet not found')) {
        setError(`No faucet found with the name "${currentFaucetName}"`);
      } else if (errorMessage.includes('reverted')) {
        setError(`Unable to retrieve faucet information. Please try again.`);
      } else {
        setError(`Error fetching faucet. Please try again.`);
      }
      
      console.error("Original error:", readError);
      setFaucetDetails(null);
      setLoading(false);
    }
  }, [faucetData, isError, readError, fetchAttempted, currentFaucetName]);

  useEffect(() => {
    if (faucetDetails) {
      setCompactSearch(true);
    }
  }, [faucetDetails]);

  // Refetch data after confirmed transactions
  useEffect(() => {
    if (isDripConfirmed || isTopupConfirmed || isPauseConfirmed || isUnpauseConfirmed || isWithdrawConfirmed) {
      refetch();
    }
  }, [isDripConfirmed, isTopupConfirmed, isPauseConfirmed, isUnpauseConfirmed, isWithdrawConfirmed, refetch]);

  // Modify the timeout effect
  useEffect(() => {
    let timeoutId;
    if (isReadLoading) {
      timeoutId = setTimeout(() => {
        console.log("Read operation taking too long, forcing reset");
        setLoading(false);
        // Also reset the read loading state indirectly by clearing currentFaucetName
        if (currentFaucetName) {
          setCurrentFaucetName('');
          setTimeout(() => setCurrentFaucetName(faucetName.trim()), 100);
        }
      }, 5000); // Reduced to 5 seconds for better UX
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isReadLoading, currentFaucetName, faucetName]);

  const handleNetworkChange = (e) => {
    changeNetwork(e.target.value);
    setFaucetName('');
    setCurrentFaucetName('');
    setFaucetDetails(null);
    setError(null);
    setFetchAttempted(false);
  };

  const handleFetchFaucet = async (e) => {
    e.preventDefault();
    if (!faucetName || faucetName.trim() === '') {
      setError("Please enter a faucet name");
      return;
    }
    
    setLoading(true);
    setError(null);
    setFetchAttempted(true);
    
    // Set the current faucet name to trigger the query
    setCurrentFaucetName(faucetName.trim());
  };

  const handleDrip = async () => {
    if (!currentFaucetName || !recipientAddress) return;
    
    setError(null);
    try {
      await writeDrip({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'drip',
        args: [currentFaucetName, recipientAddress],
      });
    } catch (err) {
      setError(`Error dripping: ${err.message}`);
      console.error('Error dripping:', err);
    }
  };

  const handleTopup = async () => {
    if (!currentFaucetName || !topupAmount) return;
    
    setError(null);
    try {
      await writeTopup({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'topup',
        args: [currentFaucetName],
        value: parseEther(topupAmount),
      });
    } catch (err) {
      setError(`Error topping up: ${err.message}`);
      console.error('Error topping up:', err);
    }
  };

  const handlePause = async () => {
    if (!currentFaucetName) return;
    
    setError(null);
    try {
      await writePause({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'pause',
        args: [currentFaucetName],
      });
    } catch (err) {
      setError(`Error pausing: ${err.message}`);
      console.error('Error pausing:', err);
    }
  };

  const handleUnpause = async () => {
    if (!currentFaucetName) return;
    
    setError(null);
    try {
      await writeUnpause({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'unpause',
        args: [currentFaucetName],
      });
    } catch (err) {
      setError(`Error unpausing: ${err.message}`);
      console.error('Error unpausing:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!currentFaucetName) return;
    
    setError(null);
    try {
      await writeWithdraw({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'withdraw_faucet',
        args: [currentFaucetName],
      });
    } catch (err) {
      setError(`Error withdrawing: ${err.message}`);
      console.error('Error withdrawing:', err);
    }
  };

  const handleNewSearch = () => {
    setShowTopup(false);
    setCompactSearch(false);
    setFaucetName('');
    setCurrentFaucetName('');
    setFaucetDetails(null);
    setFetchAttempted(false);
  };

  // Status messages for transaction states
  const getStatusMessage = () => {
    if (isDripPending || isDripConfirming) return "Processing drip transaction...";
    if (isTopupPending || isTopupConfirming) return "Processing top-up transaction...";
    if (isPausePending || isPauseConfirming) return "Processing pause transaction...";
    if (isUnpausePending || isUnpauseConfirming) return "Processing unpause transaction...";
    if (isWithdrawPending || isWithdrawConfirming) return "Processing withdrawal transaction...";
    
    if (isDripConfirmed) return "Drip successful!";
    if (isTopupConfirmed) return "Top-up successful!";
    if (isPauseConfirmed) return "Faucet paused successfully!";
    if (isUnpauseConfirmed) return "Faucet unpaused successfully!";
    if (isWithdrawConfirmed) return "Withdrawal successful!";
    
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="card faucet-details-card">
      <h2 className="card-title">Find a Faucet</h2>
      
      {faucetDetails && (
        <div className="search-controls">
          <button 
            onClick={handleNewSearch}
            className="new-search-button app-button secondary-button"
          >
            🔍 New Search
          </button>
        </div>
      )}
      
      <div className="card-description">
        Search for a faucet by name, then provide an address to drip funds to.
      </div>
      
      <div className="search-form">
        {!compactSearch && (
          <>
            <div className="form-group network-select-group">
              <label htmlFor="network-select">Select Network</label>
              <NetworkTypeahead 
                selectedNetwork={selectedNetwork}
                onChange={(networkKey) => {
                  changeNetwork(networkKey);
                  setFaucetName('');
                  setCurrentFaucetName('');
                  setFaucetDetails(null);
                  setError(null);
                  setFetchAttempted(false);
                }}
                id="network-select"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="faucet-name">Faucet Name</label>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleFetchFaucet(e);
              }}>
                <div className="search-input-container">
                  <input
                    id="faucet-name"
                    type="text"
                    value={faucetName}
                    onChange={(e) => setFaucetName(e.target.value)}
                    placeholder="Enter faucet name"
                    disabled={loading}
                  />
                  <button 
                    type="submit"
                    disabled={!faucetName.trim() || loading}
                    className="search-button app-button"
                  >
                    {loading ? <span className="loading-spinner">🌀</span> : '🔍'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {statusMessage && (
          <div className={`status-message ${statusMessage.includes("successful") ? "success-status" : "info-status"}`}>
            {statusMessage.includes("Processing") && <span className="processing-icon">⟳</span>}
            {statusMessage.includes("successful") && <span className="success-icon">✓</span>}
            {statusMessage}
          </div>
        )}
        
        {fetchAttempted && !faucetDetails && !loading && !error && !isReadLoading && (
          <div className="info-message">
            <span className="info-icon">ℹ️</span> No faucet found with this name.
          </div>
        )}
        
        {faucetDetails && (
          <div className="faucet-info-container">
            <div className="faucet-header">
              <h3 className="faucet-name">{currentFaucetName}</h3>
              <div className="wallet-connected faucet-status-pill">
                <span className="network-name">
                  {SUPPORTED_NETWORKS[selectedNetwork]?.name || selectedNetwork}
                </span>
                <span className={`status-badge ${faucetDetails.paused ? 'status-paused' : 'status-active'}`}>
                  {faucetDetails.paused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
            
            <div className="faucet-stats">
              <div className="stat-item">
                <span className="stat-icon">💧</span>
                <div className="stat-details">
                  <span className="stat-value">{faucetDetails.dripAmount} ETH</span>
                  <span className="stat-label">Drip</span>
                </div>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon">💰</span>
                <div className="stat-details">
                  <span className="stat-value">{faucetDetails.balance} ETH</span>
                  <span className="stat-label">Balance</span>
                </div>
              </div>
              
              <div className="stat-item">
                <span className="stat-icon">👤</span>
                <div className="stat-details">
                  <span className="stat-value address-value">
                    {faucetDetails.creator.substring(0, 6)}...{faucetDetails.creator.substring(38)}
                  </span>
                  <span className="stat-label">Creator</span>
                </div>
              </div>
            </div>
            
            <div className="actions-container">
              <div className="action-panels">
                <div className="drip-panel">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (recipientAddress) handleDrip();
                  }}>
                    <div className="drip-input-container">
                      <input
                        type="text"
                        className="drip-input"
                        placeholder="Enter recipient address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        required
                      />
                      <button 
                        type="submit"
                        className="drip-button primary-action-button app-button"
                        disabled={isDripPending || isDripConfirming || !recipientAddress}
                      >
                        {isDripPending || isDripConfirming ? 
                          <span className="loading-spinner">🌀</span> : 
                          <><span className="drip-icon">💧</span> Drip</>
                        }
                      </button>
                    </div>
                    <div className="drip-info">
                      {faucetDetails.dripAmount} ETH will be sent to your address on the {SUPPORTED_NETWORKS[selectedNetwork]?.name || selectedNetwork} network
                    </div>
                  </form>
                </div>
                
                {address && (
                  <div className="secondary-actions">
                    <button 
                      onClick={() => setShowTopup(!showTopup)} 
                      className="toggle-topup-button app-button secondary-button"
                    >
                      {showTopup ? 'Hide Top-up' : 'Funds running low?'}
                    </button>
                    
                    {showTopup && (
                      <div className="topup-panel">
                        <div className="topup-header">
                          <h5 className="topup-title">Top-up Faucet</h5>
                          <p className="topup-description">Add funds to keep this faucet running</p>
                        </div>
                        <div className="topup-input-container">
                          <input
                            type="text"
                            className="action-input"
                            placeholder="Amount in ETH"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                          />
                          <button 
                            onClick={handleTopup}
                            className="topup-button secondary-action-button app-button"
                            disabled={isTopupPending || isTopupConfirming || !topupAmount}
                          >
                            {isTopupPending || isTopupConfirming ? 
                              <span className="loading-spinner">🌀</span> : 
                              'Top-up'
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {address === faucetDetails.creator && (
              <div className="owner-section">
                <div className="owner-section-header">
                  <h4 className="owner-section-title">Owner Controls</h4>
                  <p className="owner-section-description">
                    As the creator of this faucet, you have access to additional controls.
                  </p>
                </div>
                
                <div className="owner-actions">
                  <div className="owner-buttons-row">
                    <button 
                      onClick={faucetDetails.paused ? handleUnpause : handlePause}
                      disabled={(faucetDetails.paused ? isUnpausePending || isUnpauseConfirming : isPausePending || isPauseConfirming)}
                      className={`owner-button app-button ${faucetDetails.paused ? 'success-button unpause-button' : 'warning-button pause-button'}`}
                    >
                      {faucetDetails.paused 
                        ? (isUnpausePending || isUnpauseConfirming ? <span className="loading-spinner">🌀</span> : <span>Unpause Faucet</span>) 
                        : (isPausePending || isPauseConfirming ? <span className="loading-spinner">🌀</span> : <span>Pause Faucet</span>)}
                    </button>
                    
                    <button 
                      onClick={handleWithdraw}
                      disabled={isWithdrawPending || isWithdrawConfirming}
                      className="owner-button withdraw-button app-button danger-button"
                    >
                      {isWithdrawPending || isWithdrawConfirming ? 
                        <span className="loading-spinner">🌀</span> : 
                        <span>Withdraw All Funds</span>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}