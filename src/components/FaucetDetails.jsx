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
  
  // New states for server drip functionality
  const [serverDripLoading, setServerDripLoading] = useState(false);
  const [serverDripSuccess, setServerDripSuccess] = useState(false);
  const [serverDripError, setServerDripError] = useState(null);
  const [serverDripTxHash, setServerDripTxHash] = useState(null);

  // New states for cooldown timer
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // New state for updating drip amount
  const [newDripAmount, setNewDripAmount] = useState('');

  // Add a new state to track the last successful update
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState(null);

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
  const { data: updateDripHash, writeContract: writeUpdateDrip, isPending: isUpdateDripPending } = useWriteContract();

  // Transaction receipts
  const { isLoading: isDripConfirming, isSuccess: isDripConfirmed } = useWaitForTransactionReceipt({ hash: dripHash });
  const { isLoading: isTopupConfirming, isSuccess: isTopupConfirmed } = useWaitForTransactionReceipt({ hash: topupHash });
  const { isLoading: isPauseConfirming, isSuccess: isPauseConfirmed } = useWaitForTransactionReceipt({ hash: pauseHash });
  const { isLoading: isUnpauseConfirming, isSuccess: isUnpauseConfirmed } = useWaitForTransactionReceipt({ hash: unpauseHash });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } = useWaitForTransactionReceipt({ hash: withdrawHash });
  const { isLoading: isUpdateDripConfirming, isSuccess: isUpdateDripConfirmed } = useWaitForTransactionReceipt({ hash: updateDripHash });

  // Reset state when network changes
  useEffect(() => {
    setFaucetName('');
    setCurrentFaucetName('');
    setFaucetDetails(null);
    setError(null);
    setFetchAttempted(false);
    setCompactSearch(false);
    setShowTopup(false);
    setNewDripAmount('');
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
    if (isDripConfirmed || isTopupConfirmed || isPauseConfirmed || isUnpauseConfirmed || isWithdrawConfirmed || isUpdateDripConfirmed) {
      refetch();
    }
  }, [isDripConfirmed, isTopupConfirmed, isPauseConfirmed, isUnpauseConfirmed, isWithdrawConfirmed, isUpdateDripConfirmed, refetch]);

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

  // Add useEffect for cooldown timer
  useEffect(() => {
    let intervalId;
    
    if (cooldownActive && cooldownSeconds > 0) {
      intervalId = setInterval(() => {
        setCooldownSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
    } else if (cooldownSeconds === 0 && cooldownActive) {
      setCooldownActive(false);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cooldownActive, cooldownSeconds]);

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

  const handleServerDrip = async () => {
    if (!currentFaucetName || !recipientAddress) return;
    
    setServerDripLoading(true);
    setServerDripSuccess(false);
    setServerDripError(null);
    setServerDripTxHash(null);
    
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL;
      if (!serverUrl) {
        throw new Error('Server URL is not configured. Please check your environment variables.');
      }
      
      const response = await fetch(`${serverUrl}/drip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: currentFaucetName,
          network: selectedNetwork,
          address: recipientAddress,
        }),
      });
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      setServerDripSuccess(true);
      setServerDripTxHash(data.tx_hash);
      
      // Start cooldown timer
      setCooldownSeconds(20);
      setCooldownActive(true);
      
      // Refetch faucet details after successful drip
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (err) {
      console.error('Server drip error:', err);
      
      // Provide more helpful error messages for common issues
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setServerDripError('Network error: Unable to connect to the server. Please check your connection or the server might be down.');
      } else if (err.message.includes('CORS')) {
        setServerDripError('CORS error: The server is not configured to accept requests from this domain.');
      } else {
        setServerDripError(err.message || 'Failed to process drip request');
      }
    } finally {
      setServerDripLoading(false);
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

  const handleUpdateDripAmount = async () => {
    if (!currentFaucetName || !newDripAmount) return;
    
    setError(null);
    setLastSuccessfulUpdate(null);
    
    try {
      await writeUpdateDrip({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'set_drip_amount',
        args: [currentFaucetName, parseEther(newDripAmount)],
      });
    } catch (err) {
      setError(`Error updating drip amount: ${err.message}`);
      console.error('Error updating drip amount:', err);
    }
  };

  const handleNewSearch = () => {
    setShowTopup(false);
    setCompactSearch(false);
    setFaucetName('');
    setCurrentFaucetName('');
    setFaucetDetails(null);
    setFetchAttempted(false);
    
    // Clear server drip states
    setServerDripSuccess(false);
    setServerDripError(null);
    setServerDripTxHash(null);
    setCooldownActive(false);
    setCooldownSeconds(0);
  };

  const getStatusMessage = () => {
    if (serverDripSuccess) return "Drip successful!";
    if (serverDripLoading) return "Processing drip request via server...";
    if (serverDripError) return `Drip error: ${serverDripError}`;
    
    if (isDripPending || isDripConfirming) return "Processing drip transaction...";
    if (isTopupPending || isTopupConfirming) return "Processing top-up transaction...";
    if (isPausePending || isPauseConfirming) return "Processing pause transaction...";
    if (isUnpausePending || isUnpauseConfirming) return "Processing unpause transaction...";
    if (isWithdrawPending || isWithdrawConfirming) return "Processing withdrawal transaction...";
    if (isUpdateDripPending || isUpdateDripConfirming) return "Processing drip amount update...";
    
    if (isDripConfirmed) return "Drip successful!";
    if (isTopupConfirmed) return "Top-up successful!";
    if (isPauseConfirmed) return "Faucet paused successfully!";
    if (isUnpauseConfirmed) return "Faucet unpaused successfully!";
    if (isWithdrawConfirmed) return "Withdrawal successful!";
    if (isUpdateDripConfirmed) return "Drip amount updated successfully!";
    
    return null;
  };

  const statusMessage = getStatusMessage();

  // Update the effect to track successful updates
  useEffect(() => {
    if (isUpdateDripConfirmed && !lastSuccessfulUpdate) {
      // Set the last successful update to the current timestamp
      setLastSuccessfulUpdate(Date.now());
      
      // Set a timeout to clear the success state after 3 seconds
      const timer = setTimeout(() => {
        setNewDripAmount('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isUpdateDripConfirmed, lastSuccessfulUpdate]);

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
            {statusMessage.includes("Processing") && <span className="processing-icon">🌀</span>}
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
                    if (recipientAddress && !cooldownActive) {
                      // Use server drip by default, fall back to on-chain if user is connected
                      handleServerDrip();
                    }
                  }}>
                    <div className="drip-input-container">
                      <input
                        type="text"
                        className="drip-input"
                        placeholder="Enter recipient address"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        required
                        disabled={serverDripLoading || cooldownActive}
                      />
                      <button 
                        type="submit"
                        className="drip-button primary-action-button app-button"
                        disabled={serverDripLoading || !recipientAddress || cooldownActive}
                      >
                        {serverDripLoading ? (
                          <span className="loading-spinner">🌀</span>
                        ) : cooldownActive ? (
                          <span className="cooldown-text">{cooldownSeconds}s</span>
                        ) : (
                          <><span className="drip-icon">💧</span> Drip</>
                        )}
                      </button>
                    </div>
                    <div className="drip-info">
                      {cooldownActive 
                        ? `You may drip again, but please only take what you need!` 
                        : `${faucetDetails.dripAmount} ETH will be sent to your address on the ${SUPPORTED_NETWORKS[selectedNetwork]?.name || selectedNetwork} network`}
                    </div>
                    {serverDripSuccess && (
                      <div className="server-drip-success">
                        <a 
                          href={`${SUPPORTED_NETWORKS[selectedNetwork]?.blockExplorers?.default?.url}/tx/${serverDripTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          View transaction
                        </a>
                      </div>
                    )}
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
                  
                  <div className="update-drip-container">
                    <div className="update-drip-header">
                      <h5 className="update-drip-title">Update Drip Amount</h5>
                      <p className="update-drip-description">Change how much ETH users receive per drip</p>
                    </div>
                    <div className="update-drip-input-container">
                      <input
                        type="text"
                        className="action-input"
                        placeholder="New amount in ETH"
                        value={newDripAmount}
                        onChange={(e) => setNewDripAmount(e.target.value)}
                      />
                      <button 
                        onClick={handleUpdateDripAmount}
                        className="update-drip-button secondary-action-button app-button"
                        disabled={isUpdateDripPending || isUpdateDripConfirming || !newDripAmount}
                      >
                        {isUpdateDripPending || isUpdateDripConfirming ? (
                          <span className="loading-spinner">🌀</span>
                        ) : lastSuccessfulUpdate ? (
                          <span className="success-icon">✓</span>
                        ) : (
                          'Update'
                        )}
                      </button>
                    </div>
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