// Real-time Blockchain Implementation

export interface Transaction {
  id: string;
  voterId: string;
  candidateId: string;
  timestamp: number;
  signature: string;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}

export interface BlockchainState {
  chain: Block[];
  pendingTransactions: Transaction[];
  difficulty: number;
  miningReward: number;
}

// Simple hash function (SHA-256 simulation for demo)
export async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous hash for immediate use
export function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`;
}

// Calculate Merkle Root from transactions
export function calculateMerkleRoot(transactions: Transaction[]): string {
  if (transactions.length === 0) return '0'.repeat(64);
  
  let hashes = transactions.map(tx => 
    simpleHash(JSON.stringify(tx))
  );
  
  while (hashes.length > 1) {
    const newHashes: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      newHashes.push(simpleHash(left + right));
    }
    hashes = newHashes;
  }
  
  return hashes[0];
}

// Create Genesis Block
export function createGenesisBlock(): Block {
  const genesisData = {
    index: 0,
    timestamp: Date.now(),
    transactions: [],
    previousHash: '0'.repeat(64),
    nonce: 0,
    merkleRoot: '0'.repeat(64),
  };
  
  return {
    ...genesisData,
    hash: simpleHash(JSON.stringify(genesisData)),
  };
}

// Mine a new block (Proof of Work simulation)
export function mineBlock(
  index: number,
  transactions: Transaction[],
  previousHash: string,
  difficulty: number
): Block {
  const timestamp = Date.now();
  const merkleRoot = calculateMerkleRoot(transactions);
  let nonce = 0;
  let hash = '';
  
  const target = '0'.repeat(difficulty);
  
  // Mining loop (simplified for demo - limited iterations)
  while (nonce < 10000) {
    const blockData = JSON.stringify({
      index,
      timestamp,
      transactions,
      previousHash,
      nonce,
      merkleRoot,
    });
    
    hash = simpleHash(blockData);
    
    // Check if hash meets difficulty (starts with required zeros)
    if (hash.substring(2, 2 + difficulty) === target || nonce > 100) {
      break;
    }
    nonce++;
  }
  
  return {
    index,
    timestamp,
    transactions,
    previousHash,
    hash,
    nonce,
    merkleRoot,
  };
}

// Validate Block
export function isValidBlock(block: Block, previousBlock: Block): boolean {
  // Check index
  if (block.index !== previousBlock.index + 1) return false;
  
  // Check previous hash
  if (block.previousHash !== previousBlock.hash) return false;
  
  // Verify merkle root
  const calculatedMerkle = calculateMerkleRoot(block.transactions);
  if (block.merkleRoot !== calculatedMerkle) return false;
  
  return true;
}

// Validate entire chain
export function isValidChain(chain: Block[]): boolean {
  if (chain.length === 0) return false;
  
  for (let i = 1; i < chain.length; i++) {
    if (!isValidBlock(chain[i], chain[i - 1])) {
      return false;
    }
  }
  
  return true;
}

// Create a vote transaction
export function createVoteTransaction(
  voterId: string,
  candidateId: string
): Transaction {
  const timestamp = Date.now();
  const txData = `${voterId}:${candidateId}:${timestamp}`;
  
  return {
    id: simpleHash(txData).substring(0, 18),
    voterId,
    candidateId,
    timestamp,
    signature: simpleHash(`sig:${txData}:${Math.random()}`),
  };
}

// Blockchain storage key
const BLOCKCHAIN_KEY = 'voteshield_blockchain';

// Initialize blockchain
export function initializeBlockchain(): BlockchainState {
  const stored = localStorage.getItem(BLOCKCHAIN_KEY);
  
  if (stored) {
    return JSON.parse(stored);
  }
  
  const genesis = createGenesisBlock();
  const initialState: BlockchainState = {
    chain: [genesis],
    pendingTransactions: [],
    difficulty: 2,
    miningReward: 0,
  };
  
  localStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify(initialState));
  return initialState;
}

// Save blockchain state
export function saveBlockchain(state: BlockchainState): void {
  localStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify(state));
}

// Get blockchain state
export function getBlockchain(): BlockchainState {
  return initializeBlockchain();
}

// Add transaction to pending pool
export function addTransaction(transaction: Transaction): BlockchainState {
  const state = getBlockchain();
  state.pendingTransactions.push(transaction);
  saveBlockchain(state);
  return state;
}

// Mine pending transactions into a new block
export function minePendingTransactions(): { state: BlockchainState; newBlock: Block } {
  const state = getBlockchain();
  
  if (state.pendingTransactions.length === 0) {
    return { state, newBlock: state.chain[state.chain.length - 1] };
  }
  
  const previousBlock = state.chain[state.chain.length - 1];
  const newBlock = mineBlock(
    previousBlock.index + 1,
    [...state.pendingTransactions],
    previousBlock.hash,
    state.difficulty
  );
  
  state.chain.push(newBlock);
  state.pendingTransactions = [];
  
  saveBlockchain(state);
  
  return { state, newBlock };
}

// Get transaction by hash
export function getTransactionByHash(hash: string): { transaction: Transaction; block: Block } | null {
  const state = getBlockchain();
  
  for (const block of state.chain) {
    for (const tx of block.transactions) {
      if (tx.id === hash || tx.signature.includes(hash.substring(2, 10))) {
        return { transaction: tx, block };
      }
    }
  }
  
  return null;
}

// Get all votes for counting
export function getAllVotes(): Map<string, number> {
  const state = getBlockchain();
  const votes = new Map<string, number>();
  
  for (const block of state.chain) {
    for (const tx of block.transactions) {
      const current = votes.get(tx.candidateId) || 0;
      votes.set(tx.candidateId, current + 1);
    }
  }
  
  return votes;
}

// Check if voter has voted
export function hasVoterVoted(voterId: string): Transaction | null {
  const state = getBlockchain();
  
  // Check confirmed transactions
  for (const block of state.chain) {
    for (const tx of block.transactions) {
      if (tx.voterId === voterId) {
        return tx;
      }
    }
  }
  
  // Check pending transactions
  for (const tx of state.pendingTransactions) {
    if (tx.voterId === voterId) {
      return tx;
    }
  }
  
  return null;
}

// Get blockchain stats
export function getBlockchainStats() {
  const state = getBlockchain();
  const votes = getAllVotes();
  
  let totalVotes = 0;
  votes.forEach(count => totalVotes += count);
  
  return {
    blockHeight: state.chain.length,
    totalBlocks: state.chain.length,
    totalTransactions: totalVotes,
    pendingTransactions: state.pendingTransactions.length,
    difficulty: state.difficulty,
    isValid: isValidChain(state.chain),
    latestBlock: state.chain[state.chain.length - 1],
  };
}

// Reset blockchain (for demo)
export function resetBlockchain(): BlockchainState {
  localStorage.removeItem(BLOCKCHAIN_KEY);
  return initializeBlockchain();
}

// Format hash for display
export function formatHash(hash: string, length: number = 10): string {
  if (hash.length <= length + 6) return hash;
  return `${hash.substring(0, length + 2)}...${hash.substring(hash.length - 4)}`;
}

// Format timestamp
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${formattedHours}:${minutes} ${ampm}, ${day} ${month} ${year}`;
}
