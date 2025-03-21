import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_NETWORKS } from '../constants/networks';
import '../styles/NetworkTypeahead.css';

export default function NetworkTypeahead({ selectedNetwork, onChange, id }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  
  const selectedNetworkConfig = SUPPORTED_NETWORKS[selectedNetwork];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleNetworkSelect = (networkKey) => {
    onChange(networkKey);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };
  
  const filteredNetworks = Object.entries(SUPPORTED_NETWORKS).filter(([_, network]) => 
    network.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="network-typeahead" ref={dropdownRef}>
      <div className="typeahead-selected" onClick={toggleDropdown}>
        <span className="selected-network-name">{selectedNetworkConfig.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="typeahead-dropdown">
          <input
            ref={inputRef}
            type="text"
            className="typeahead-search"
            placeholder="Search networks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            id={id ? `${id}-search` : undefined}
          />
          
          <div className="typeahead-options">
            {filteredNetworks.length > 0 ? (
              filteredNetworks.map(([key, network]) => (
                <div
                  key={key}
                  className={`typeahead-option ${selectedNetwork === key ? 'selected' : ''}`}
                  onClick={() => handleNetworkSelect(key)}
                >
                  <span className="network-name">{network.name}</span>
                  {selectedNetwork === key && <span className="selected-check">✓</span>}
                </div>
              ))
            ) : (
              <div className="no-results">No networks found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 