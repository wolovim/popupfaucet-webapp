import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { POPUP_FAUCET_ABI } from '../constants/contracts';
import { useNetworkContext } from '../context/NetworkContext';
import { getContractAddress, SUPPORTED_NETWORKS } from '../constants/networks';
import '../styles/CreateFaucet.css';
import NetworkTypeahead from './NetworkTypeahead';

console.log('Current ABI:', POPUP_FAUCET_ABI);

export default function CreateFaucet() {
  const { isConnected } = useAccount();
  const { selectedNetwork, changeNetwork } = useNetworkContext();
  const contractAddress = getContractAddress(selectedNetwork);
  
  const [name, setName] = useState('');
  const [dripAmount, setDripAmount] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [nameToCheck, setNameToCheck] = useState('');
  const [nameAvailable, setNameAvailable] = useState(null);
  
  const { data: hash, isPending, error, writeContract } = useWriteContract();
  
  const { data: faucetData, isLoading: isCheckingName, isError: nameCheckFailed } = useReadContract({
    address: contractAddress,
    abi: POPUP_FAUCET_ABI,
    functionName: 'get_faucet',
    args: nameToCheck ? [nameToCheck] : undefined,
    enabled: !!nameToCheck,
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    });

  // Reset form when network changes
  useEffect(() => {
    setName('');
    setDripAmount('');
    setInitialBalance('');
    setNameAvailable(null);
  }, [selectedNetwork]);

  // Name checking logic
  useEffect(() => {
    if (!name.trim()) {
      setNameAvailable(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setNameToCheck(name.trim());
    }, 500);
    
    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    if (!nameToCheck) return;
    
    if (!isCheckingName) {
      // Check if the creator address is empty (0x0000...0000)
      if (faucetData && faucetData.creator !== '0x0000000000000000000000000000000000000000') {
        setNameAvailable(false); // Faucet exists
      } else {
        setNameAvailable(true); // Faucet doesn't exist or has empty creator
      }
      
      setNameToCheck('');
    }
  }, [faucetData, nameToCheck, isCheckingName, nameCheckFailed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !dripAmount || !initialBalance) {
      alert('Please fill in all fields');
      return;
    }
    
    if (nameAvailable === false) {
      alert('This faucet name is already taken. Please choose another name.');
      return;
    }
    
    try {
      await writeContract({
        address: contractAddress,
        abi: POPUP_FAUCET_ABI,
        functionName: 'create',
        args: [name, parseEther(dripAmount)],
        value: parseEther(initialBalance),
      });
    } catch (err) {
      console.error('Error creating faucet:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="card create-faucet-card">
        <h2>Create New Faucet</h2>
        <div className="info-message">
          <span className="info-icon">ℹ️</span> Please connect your wallet to create a faucet.
        </div>
      </div>
    );
  }

  return (
    <div className="card create-faucet-card">
      <h2>Create New Faucet</h2>
      
      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group network-select-group">
          <label htmlFor="create-network-select">Select Network</label>
          <NetworkTypeahead 
            selectedNetwork={selectedNetwork}
            onChange={changeNetwork}
            id="create-network-select"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Faucet Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a unique name"
            required
            className={
              isCheckingName 
                ? 'name-checking-border' 
                : nameAvailable !== null 
                  ? (nameAvailable ? 'name-available' : 'name-taken') 
                  : ''
            }
          />
          <span className="form-info">Choose a unique name for your faucet</span>
          {name && (
            <div className="name-status">
              {isCheckingName ? (
                <span className="name-checking">
                  <span className="loading-spinner">🌀</span> Checking availability...
                </span>
              ) : nameAvailable === true ? (
                <span className="name-available-message">✓ Name is available</span>
              ) : nameAvailable === false ? (
                <span className="name-taken-message">✗ Name is already taken</span>
              ) : null}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="dripAmount">Drip Amount (ETH)</label>
          <input
            id="dripAmount"
            type="text"
            value={dripAmount}
            onChange={(e) => setDripAmount(e.target.value)}
            placeholder="0.01"
            required
          />
          <span className="form-info">Amount of ETH to send per drip</span>
        </div>
        
        <div className="form-group">
          <label htmlFor="initialBalance">Initial Balance (ETH)</label>
          <input
            id="initialBalance"
            type="text"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0.1"
            required
          />
          <span className="form-info">Initial amount to fund the faucet with</span>
        </div>
        
        <button 
          type="submit" 
          className="create-button app-button"
          disabled={isPending || isConfirming}
        >
          {isPending || isConfirming ? (
            <>
              <span className="loading-spinner">🌀</span>
              {isConfirming ? 'Confirming...' : 'Creating...'}
            </>
          ) : (
            'Create Faucet'
          )}
        </button>
        
        {isConfirmed && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            Faucet created successfully!
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <span className="error-icon">✗</span>
            Error: {error.message || 'Failed to create faucet'}
          </div>
        )}
      </form>
    </div>
  );
} 