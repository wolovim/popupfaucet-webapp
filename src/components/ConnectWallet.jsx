import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  if (isConnected && address) {
    return (
      <div className="wallet-connect">
        <div className="wallet-connected">
          <span className="wallet-address">{formatAddress(address)}</span>
          <button 
            onClick={() => disconnect()} 
            className="disconnect-button"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="wallet-connect">
      <button 
        onClick={() => connect({ connector: injected() })}
        className="connect-button"
      >
        Connect Wallet
      </button>
    </div>
  );
} 