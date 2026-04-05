// Real Ethereum Sepolia Integration with Private Key Support
import { ethers } from 'ethers';
import { SEPOLIA_RPC_URL, VOTESHIELD_CONTRACT_ADDRESS, VOTESHIELD_ABI } from './config';
// Sepolia chain configuration
export const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex
export const SEPOLIA_CHAIN_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [SEPOLIA_RPC_URL],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

// Global state
let provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let connectedAddress: string | null = null;

// Storage key for private key (encrypted in real app)
const PRIVATE_KEY_STORAGE = 'voteshield_pk';

// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

// Get JSON-RPC provider (always available)
export function getProvider(): ethers.JsonRpcProvider | ethers.BrowserProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  }
  return provider;
}

// Connect via MetaMask
export async function connectWallet(): Promise<{ address: string; balance: string }> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask not installed');
  }

  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  // Switch to Sepolia if needed
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_CHAIN_CONFIG],
        });
      } else {
        throw err;
      }
    }
  }

  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  connectedAddress = accounts[0];

  const balance = ethers.formatEther(await provider.getBalance(connectedAddress));
  return { address: connectedAddress, balance };
}

// Connect with private key (for MetaMask issues)
export async function connectWithPrivateKey(privateKey: string): Promise<{ address: string; balance: string }> {
  const trimmedKey = privateKey.trim();
  if (!trimmedKey) {
    throw new Error('Private key is required');
  }

  const formattedKey = trimmedKey.startsWith('0x') ? trimmedKey : `0x${trimmedKey}`;
  
  try {
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(formattedKey, provider);
    
    // Verify it's Sepolia
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      throw new Error('RPC not connected to Sepolia');
    }

    signer = wallet;
    connectedAddress = await wallet.getAddress();
    
    const balance = ethers.formatEther(await provider.getBalance(connectedAddress));
    
    // Save to localStorage (in production, encrypt this!)
    localStorage.setItem(PRIVATE_KEY_STORAGE, formattedKey);
    
    return { address: connectedAddress, balance };
  } catch (err: any) {
    if (err.message?.includes('invalid')) {
      throw new Error('Invalid private key format');
    }
    throw err;
  }
}
export async function hasVotedOnChain(voterId: string): Promise<boolean> {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(VOTESHIELD_CONTRACT_ADDRESS, VOTESHIELD_ABI, provider);
    const data = await contract.hasVoted(voterId);
    console.log("log data",contract)
    return data;
  } catch (error) {
    console.error('Failed to check hasVoted on-chain:', error);
    return false; // Fallback—treat as not voted if query fails
  }
}

// NEW: Submit vote to REAL contract (this calls vote() function)
export async function submitVoteTransaction(voterId: string, candidateId: string) {
   provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet('0f3dbcf77dff7366c47c2b0fd1fe946f5d9be8c592e915dc5e9aaab304946e6b', provider);
    
    // Verify it's Sepolia
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111n) {
      throw new Error('RPC not connected to Sepolia');
    }

    signer = wallet;

  // DOUBLE-CHECK: Even if Supabase is hacked, blockchain blocks double-votes
  const alreadyVoted = await hasVotedOnChain(voterId);
  if (alreadyVoted) {
    throw new Error('You have already voted! (Enforced by blockchain)');
  }

  try {
    const contract = new ethers.Contract(VOTESHIELD_CONTRACT_ADDRESS, VOTESHIELD_ABI, signer);
    
    // CALL THE REAL vote() FUNCTION
    const tx = await contract.vote(voterId, candidateId, {
      gasLimit: 100000, // Prevent gas estimation issues
    });
    
    console.log('Vote transaction submitted:', tx.hash);

    const receipt = await tx.wait();
    console.log('Vote confirmed in block:', receipt.blockNumber);

    // Check for events/logs (your vote emitted the Voted event)
    const event = receipt.logs.find(log => log.fragment?.name === 'Voted');
    if (event) {
      console.log('Vote event emitted:', event.args);
    }

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString() || '0',
    };
  } catch (error: any) {
    if (error.reason?.includes('Already voted')) {
      throw new Error('Already voted! Blockchain protection activated.');
    }
    console.error('Vote submission failed:', error);
    throw error;
  }
}
// Load saved private key
export async function loadSavedWallet(): Promise<{ address: string; balance: string } | null> {
  const savedKey = localStorage.getItem(PRIVATE_KEY_STORAGE);
  if (!savedKey) return null;
  
  try {
    return await connectWithPrivateKey(savedKey);
  } catch {
    localStorage.removeItem(PRIVATE_KEY_STORAGE);
    return null;
  }
}

// Clear saved wallet
export function clearSavedWallet(): void {
  localStorage.removeItem(PRIVATE_KEY_STORAGE);
  signer = null;
  connectedAddress = null;
}

// Get connected address
export async function getConnectedAddress(): Promise<string | null> {
  if (connectedAddress) return connectedAddress;
  
  // Check for saved private key wallet
  const saved = await loadSavedWallet();
  if (saved) return saved.address;
  
  // Check MetaMask
  if (isMetaMaskInstalled()) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch {
      return null;
    }
  }
  
  return null;
}

// Encode vote data for transaction
function encodeVoteData(voterId: string, candidateId: string): string {
  const data = {
    type: VOTESHIELD_VOTE_TYPE,
    voterId,
    candidateId,
    timestamp: Date.now(),
    version: '1.0',
  };
  
  return ethers.hexlify(ethers.toUtf8Bytes(JSON.stringify(data)));
}

// Decode vote data from transaction
export function decodeVoteData(hexData: string): {
  type: string;
  voterId: string;
  candidateId: string;
  timestamp: number;
} | null {
  try {
    const jsonString = ethers.toUtf8String(hexData);
    const data = JSON.parse(jsonString);
    if (data.type === VOTESHIELD_VOTE_TYPE || data.type === 'VOTESHIELD_VOTE') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Check if voter has already voted on-chain by verifying transaction
export async function verifyVoteOnChain(txHash: string): Promise<{
  isValid: boolean;
  voterId?: string;
  candidateId?: string;
  blockNumber?: number;
  timestamp?: number;
}> {
  try {
    const tx = await getTransaction(txHash);
    if (!tx || !tx.voteData) {
      return { isValid: false };
    }
    
    return {
      isValid: true,
      voterId: tx.voteData.voterId,
      candidateId: tx.voteData.candidateId,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
    };
  } catch (err) {
    console.error('Error verifying vote:', err);
    return { isValid: false };
  }
}

// Submit vote transaction to Sepolia
// export async function submitVoteTransaction(
//   voterId: string,
//   candidateId: string
// ): Promise<{
//   transactionHash: string;
//   blockNumber: number;
//   from: string;
//   gasUsed: string;
//   isOnChain: boolean;
// }> {
//   if (!signer) {
//     throw new Error('Wallet not connected. Please connect MetaMask or enter private key.');
//   }

//   const address = await signer.getAddress();
//   const voteData = encodeVoteData(voterId, candidateId);

//   // Send transaction to the VoteShield marker address
//   const tx = await signer.sendTransaction({
//     to: VOTESHIELD_CONTRACT_ADDRESS,
//     value: 0,
//     data: voteData,
//     gasLimit: 100000,
//   });

//   console.log('Vote transaction submitted:', tx.hash);

//   // Wait for confirmation
//   const receipt = await tx.wait();
  
//   if (!receipt) {
//     throw new Error('Transaction failed - no receipt');
//   }

//   console.log('Vote confirmed in block:', receipt.blockNumber);

//   return {
//     transactionHash: receipt.hash,
//     blockNumber: receipt.blockNumber,
//     from: receipt.from,
//     gasUsed: receipt.gasUsed.toString(),
//     isOnChain: true,
//   };
// }

// Get transaction details
export async function getTransaction(txHash: string): Promise<{
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  timestamp: number;
  data: string;
  voteData?: {
    voterId: string;
    candidateId: string;
    timestamp: number;
  };
} | null> {
  try {
    const p = getProvider();
    const tx = await p.getTransaction(txHash);
    if (!tx) return null;

    const block = await p.getBlock(tx.blockNumber!);
    const voteData = decodeVoteData(tx.data);

    return {
      hash: tx.hash,
      blockNumber: tx.blockNumber || 0,
      from: tx.from,
      to: tx.to || '',
      timestamp: block?.timestamp || 0,
      data: tx.data,
      voteData: voteData ? {
        voterId: voteData.voterId,
        candidateId: voteData.candidateId,
        timestamp: voteData.timestamp,
      } : undefined,
    };
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return null;
  }
}

// Get latest block number
export async function getLatestBlockNumber(): Promise<number> {
  try {
    return await getProvider().getBlockNumber();
  } catch {
    return 0;
  }
}

// Get block details
export async function getBlock(blockNumber: number): Promise<{
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
} | null> {
  try {
    const block = await getProvider().getBlock(blockNumber);
    if (!block) return null;

    return {
      number: block.number,
      hash: block.hash || '',
      timestamp: block.timestamp,
      transactions: block.transactions.length,
    };
  } catch {
    return null;
  }
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Get Etherscan URL
export function getEtherscanUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

// Listen for account changes (MetaMask only)
export function onAccountsChanged(callback: (accounts: string[]) => void): void {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', callback);
  }
}

// Listen for chain changes
export function onChainChanged(callback: (chainId: string) => void): void {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('chainChanged', callback);
  }
}

// Remove listeners
export function removeListeners(): void {
  if (isMetaMaskInstalled()) {
    window.ethereum.removeAllListeners?.('accountsChanged');
    window.ethereum.removeAllListeners?.('chainChanged');
  }
}

// Declare ethereum on window
declare global {
  interface Window {
    ethereum: any;
  }
}
