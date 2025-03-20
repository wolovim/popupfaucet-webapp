import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { OP_SEPOLIA_FAUCET_ADDRESS, POPUP_FAUCET_ABI } from '../constants/contracts';
import '../styles/FaucetDetails.css';

export default function FaucetDetails() {
  const { address } = useAccount();
  const [faucetName, setFaucetName] = useState('');
  const [currentFaucetName, setCurrentFaucetName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [faucetDetails, setFaucetDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [compactSearch, setCompactSearch] = useState(false);

  // Read contract data - only enabled when we have a currentFaucetName (after button click)
  const { data: faucetData, refetch, isError, error: readError, isLoading: isReadLoading } = useReadContract({
    address: OP_SEPOLIA_FAUCET_ADDRESS,
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

  // Update faucet details when data changes
  useEffect(() => {
    if (faucetData) {
      try {
        // Check if the faucet exists (creator address is not zero)
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
            dripInterval: Number(faucetData.drip_interval || 0n),
            balance: balanceFormatted,
            paused: Boolean(faucetData.paused),
            creator: faucetData.creator || '0x0000000000000000000000000000000000000000',
          });
          setError(null);
        }
      } catch (err) {
        console.error("Error formatting faucet data:", err);
        setError(`Error processing faucet data: ${err.message}`);
        setFaucetDetails(null);
      }
    } else if (isError && fetchAttempted) {
      // Check for specific error messages
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
    }
  }, [faucetData, isError, readError, fetchAttempted, currentFaucetName, isReadLoading, loading]);

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

  // Modify the button to add a timeout for isReadLoading
  useEffect(() => {
    let timeoutId;
    if (isReadLoading) {
      timeoutId = setTimeout(() => {
        console.log("Read operation taking too long, forcing reset");
        setLoading(false);
      }, 10000); // 10 second timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isReadLoading]);

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
    
    try {
      await refetch();
    } catch (err) {
      setError(`Error fetching faucet: ${err.message}`);
      console.error('Error fetching faucet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrip = async () => {
    if (!currentFaucetName || !recipientAddress) return;
    
    setError(null);
    try {
      await writeDrip({
        address: OP_SEPOLIA_FAUCET_ADDRESS,
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
        address: OP_SEPOLIA_FAUCET_ADDRESS,
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
        address: OP_SEPOLIA_FAUCET_ADDRESS,
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
        address: OP_SEPOLIA_FAUCET_ADDRESS,
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
        address: OP_SEPOLIA_FAUCET_ADDRESS,
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
      <div className="card-description">
        Search for a faucet by name, then provide an address to drip funds to.
      </div>
      
      {compactSearch ? (
        <div className="compact-search">
          <button 
            onClick={handleNewSearch}
            className="new-search-button app-button secondary-button"
          >
            🔍 New Search
          </button>
        </div>
      ) : (
        <form onSubmit={handleFetchFaucet} className="search-form">
          <div className="form-group search-group">
            <input
              id="faucetName"
              type="text"
              value={faucetName}
              onChange={(e) => setFaucetName(e.target.value)}
              placeholder="Enter faucet name"
              className="search-input"
              required
            />
            <button 
              type="submit" 
              disabled={loading || !faucetName || (fetchAttempted && isReadLoading)}
              className="search-button app-button"
            >
              {(fetchAttempted && isReadLoading) || loading ? 
                <span className="loading-spinner">🌀</span> : 
                <span className="search-icon">🔍</span>
              }
            </button>
          </div>
        </form>
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
            <span className={`faucet-status ${faucetDetails.paused ? 'status-paused' : 'status-active'}`}>
              {faucetDetails.paused ? 'Paused' : 'Active'}
            </span>
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
              <span className="stat-icon">⏱️</span>
              <div className="stat-details">
                <span className="stat-value">{faucetDetails.dripInterval} sec</span>
                <span className="stat-label">Interval</span>
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
              <div className="action-panel-row">
                <div className="action-panel">
                  <input
                    type="text"
                    className="action-input"
                    placeholder="Enter recipient address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                  />
                  <button 
                    onClick={handleDrip}
                    className="action-button drip-button app-button"
                    disabled={isDripPending || isDripConfirming}
                  >
                    {isDripPending || isDripConfirming ? 
                      <span className="loading-spinner">🌀</span> : 
                      'Drip'
                    }
                  </button>
                </div>
                
                <div className="action-panel">
                  <input
                    type="text"
                    className="action-input"
                    placeholder="Amount in ETH"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    required
                  />
                  <button 
                    onClick={handleTopup}
                    className="action-button topup-button app-button"
                    disabled={isTopupPending || isTopupConfirming}
                  >
                    {isTopupPending || isTopupConfirming ? 
                      <span className="loading-spinner">🌀</span> : 
                      'Top-up'
                    }
                  </button>
                </div>
              </div>
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
  );
} 