export const OP_SEPOLIA_FAUCET_ADDRESS = import.meta.env.VITE_OP_SEPOLIA_FAUCET_ADDRESS;
export const BASE_SEPOLIA_FAUCET_ADDRESS = import.meta.env.VITE_BASE_SEPOLIA_FAUCET_ADDRESS;
export const SEPOLIA_FAUCET_ADDRESS = import.meta.env.VITE_SEPOLIA_FAUCET_ADDRESS;

export const POPUP_FAUCET_ABI = [
  {
      "name": "Create",
      "inputs": [
          {
              "name": "hash",
              "type": "bytes32",
              "indexed": false
          },
          {
              "name": "balance",
              "type": "uint256",
              "indexed": false
          },
          {
              "name": "owner",
              "type": "address",
              "indexed": false
          }
      ],
      "anonymous": false,
      "type": "event"
  },
  {
      "name": "Drip",
      "inputs": [
          {
              "name": "hash",
              "type": "bytes32",
              "indexed": false
          },
          {
              "name": "amount",
              "type": "uint256",
              "indexed": false
          },
          {
              "name": "dest",
              "type": "address",
              "indexed": false
          }
      ],
      "anonymous": false,
      "type": "event"
  },
  {
      "name": "Topup",
      "inputs": [
          {
              "name": "hash",
              "type": "bytes32",
              "indexed": false
          },
          {
              "name": "amount",
              "type": "uint256",
              "indexed": false
          }
      ],
      "anonymous": false,
      "type": "event"
  },
  {
      "name": "OwnershipTransferred",
      "inputs": [
          {
              "name": "previous_owner",
              "type": "address",
              "indexed": true
          },
          {
              "name": "new_owner",
              "type": "address",
              "indexed": true
          }
      ],
      "anonymous": false,
      "type": "event"
  },
  {
      "stateMutability": "payable",
      "type": "function",
      "name": "create",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          },
          {
              "name": "drip_amount",
              "type": "uint256"
          },
          {
              "name": "drip_interval",
              "type": "uint256"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "pause",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "unpause",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "drip",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          },
          {
              "name": "dest",
              "type": "address"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "payable",
      "type": "function",
      "name": "topup",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "set_drip_amount",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          },
          {
              "name": "amount",
              "type": "uint256"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "set_drip_interval",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          },
          {
              "name": "interval",
              "type": "uint256"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "withdraw_faucet",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "get_faucet",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "tuple",
              "components": [
                  {
                      "name": "drip_amount",
                      "type": "uint256"
                  },
                  {
                      "name": "drip_interval",
                      "type": "uint256"
                  },
                  {
                      "name": "balance",
                      "type": "uint256"
                  },
                  {
                      "name": "paused",
                      "type": "bool"
                  },
                  {
                      "name": "creator",
                      "type": "address"
                  }
              ]
          }
      ]
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "get_balance",
      "inputs": [
          {
              "name": "name",
              "type": "string"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ]
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "update_drip_sponsor",
      "inputs": [
          {
              "name": "new_sponsor",
              "type": "address"
          }
      ],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "withdraw_all",
      "inputs": [],
      "outputs": []
  },
  {
      "stateMutability": "nonpayable",
      "type": "function",
      "name": "get_owner",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address"
          }
      ]
  },
  {
      "stateMutability": "view",
      "type": "function",
      "name": "faucets",
      "inputs": [
          {
              "name": "arg0",
              "type": "bytes32"
          }
      ],
      "outputs": [
          {
              "name": "",
              "type": "tuple",
              "components": [
                  {
                      "name": "drip_amount",
                      "type": "uint256"
                  },
                  {
                      "name": "drip_interval",
                      "type": "uint256"
                  },
                  {
                      "name": "balance",
                      "type": "uint256"
                  },
                  {
                      "name": "paused",
                      "type": "bool"
                  },
                  {
                      "name": "creator",
                      "type": "address"
                  }
              ]
          }
      ]
  },
  {
      "stateMutability": "view",
      "type": "function",
      "name": "faucet_count",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ]
  },
  {
      "stateMutability": "view",
      "type": "function",
      "name": "drip_sponsor",
      "inputs": [],
      "outputs": [
          {
              "name": "",
              "type": "address"
          }
      ]
  },
  {
      "stateMutability": "nonpayable",
      "type": "constructor",
      "inputs": [
          {
              "name": "_sponsor",
              "type": "address"
          }
      ],
      "outputs": []
  }
];
console.log(import.meta.env.VITE_OP_SEPOLIA_URL);
export const SUPPORTED_CHAINS = {
  "optimism-sepolia": {
    id: 11155420,
    name: "Optimism Sepolia",
    network: "optimism-sepolia",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [import.meta.env.VITE_OP_SEPOLIA_URL],
      },
      public: {
        // http: [import.meta.env.VITE_OP_SEPOLIA_URL],
      },
    },
    blockExplorers: {
      default: {
        name: "Optimism Sepolia Explorer",
        url: "https://sepolia-optimism.etherscan.io",
      },
    },
  },
  // Add more chains as needed
}; 