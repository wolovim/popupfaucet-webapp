import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { POPUP_FAUCET_ABI, OP_SEPOLIA_FAUCET_ADDRESS } from '../constants/contracts';
import '../styles/CreateFaucet.css';

export default function CreateFaucet() {
  const { isConnected } = useAccount();
  const [name, setName] = useState('');
  const [dripAmount, setDripAmount] = useState('');
  const [dripInterval, setDripInterval] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [nameToCheck, setNameToCheck] = useState('');
  const [nameAvailable, setNameAvailable] = useState(null);
  
  const { data: hash, isPending, error, writeContract } = useWriteContract();
  
  const { data: faucetData, isLoading: isCheckingName, isError: nameCheckFailed } = useReadContract({
    address: OP_SEPOLIA_FAUCET_ADDRESS,
    abi: POPUP_FAUCET_ABI,
    functionName: 'get_faucet',
    args: nameToCheck ? [nameToCheck] : undefined,
    enabled: !!nameToCheck,
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash,
    });

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
      if (faucetData) {
        setNameAvailable(false);
      } else if (nameCheckFailed) {
        setNameAvailable(true);
      }
      
      setNameToCheck('');
    }
  }, [faucetData, nameToCheck, isCheckingName, nameCheckFailed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !dripAmount || !dripInterval || !initialBalance) {
      alert('Please fill in all fields');
      return;
    }
    
    if (nameAvailable === false) {
      alert('This faucet name is already taken. Please choose another name.');
      return;
    }
    
    try {
      await writeContract({
        address: OP_SEPOLIA_FAUCET_ADDRESS,
        abi: POPUP_FAUCET_ABI,
        functionName: 'create',
        args: [name, parseEther(dripAmount), dripInterval],
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
          <label htmlFor="dripInterval">Drip Interval (seconds)</label>
          <input
            id="dripInterval"
            type="number"
            value={dripInterval}
            onChange={(e) => setDripInterval(e.target.value)}
            placeholder="86400"
            required
          />
          <span className="form-info">Time between allowed drips (86400 = 1 day)</span>
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
          <span className="form-info">Starting balance for your faucet</span>
        </div>
        
        <button 
          type="submit" 
          disabled={isPending || isConfirming || nameAvailable === false}
          className="create-button"
        >
          {isPending ? 
            <span className="loading-spinner">🌀 Confirming...</span> : 
            isConfirming ? 
            <span className="loading-spinner">🌀 Creating...</span> : 
            <span>✨ Create Faucet</span>
          }
        </button>
        
        {error && <div className="error">{error.message}</div>}
        {isConfirmed && <div className="success">Faucet created successfully!</div>}
      </form>
    </div>
  );
} 