import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { OP_SEPOLIA_FAUCET_ADDRESS, POPUP_FAUCET_ABI } from '../constants/contracts';
import '../styles/FaucetStats.css';

export default function FaucetStats() {
  const [faucetCount, setFaucetCount] = useState(null);
  
  // Read the faucet count from the contract
  const { data: countData, isError, isLoading } = useReadContract({
    address: OP_SEPOLIA_FAUCET_ADDRESS,
    abi: POPUP_FAUCET_ABI,
    functionName: 'faucet_count',
  });
  
  // Update the faucet count when data changes
  useEffect(() => {
    if (countData !== undefined) {
      console.log("Faucet count data:", countData);
      setFaucetCount(Number(countData));
    }
  }, [countData]);
  
  return (
    <div className="stats-container">
      <h2>
        PopupFaucet
        {faucetCount !== null ? (
          <span className="faucet-count">
            {isLoading ? 
              <span className="loading-spinner">⟳</span> : 
              `${faucetCount} faucets created`
            }
          </span>
        ) : isError ? (
          <span className="faucet-count error">Error loading count</span>
        ) : (
          <span className="faucet-count">
            <span className="loading-spinner">⟳</span> Loading...
          </span>
        )}
      </h2>
      <p className="stats-description">
        Create and manage Ethereum faucets with customizable drip amounts and intervals.
      </p>
    </div>
  );
} 