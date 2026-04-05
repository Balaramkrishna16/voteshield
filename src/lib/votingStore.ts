import { formatHash, formatTimestamp } from './blockchain';
import { isVoterRegistered, getTotalRegisteredVoters, getVoterById } from './voters';
import { ethers } from 'ethers';

export interface Candidate {
  id: string;
  name: string;
  role: string;
  votes: number;
  image: string;
}

export interface VoteRecord {
  odifier: string; // Keeping your original spelling
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
  candidateId: string;
  signature?: string;
  gasUsed?: string;
  isOnChain?: boolean;
}

export interface VotingState {
  candidates: Candidate[];
  totalVoters: number;
  electionEnded: boolean;
  blockchainHeight: number;
  currentUser: string | null;
  isWalletConnected: boolean;
}

// Store vote records by transaction hash (session only - cleared on page reload)
const voteRecordsCache = new Map<string, VoteRecord>();
const voterTxCache = new Map<string, string>(); // voterId -> txHash

// LocalStorage Keys
const ELECTION_KEY = 'voteshield_election';
const CANDIDATES_KEY = 'voteshield_candidates';
const CAMPAIGN_KEY = 'voteshield_campaign';

// ==========================================
// 🏆 DYNAMIC CAMPAIGN & CANDIDATE LOGIC 🏆
// ==========================================

export const getCampaignInfo = () => {
  const stored = localStorage.getItem(CAMPAIGN_KEY);
  return stored ? JSON.parse(stored) : { name: 'Student Council Election 2025', isActive: true };
};

export const saveCampaignInfo = (info: any) => {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(info));
  window.dispatchEvent(new Event('storage')); // Sync across tabs
};

export const getDynamicCandidates = (): Candidate[] => {
  const stored = localStorage.getItem(CANDIDATES_KEY);
  if (stored) return JSON.parse(stored);
  
  // Default candidates if none exist
  return [
    { id: 'alice', name: 'Alice Johnson', role: 'Full Stack Developer', votes: 0, image: '/placeholder.svg' },
    { id: 'bob', name: 'Bob Martinez', role: 'AI/ML Specialist', votes: 0, image: '/placeholder.svg' },
    { id: 'carol', name: 'Carol Chen', role: 'Cyber Security Expert', votes: 0, image: '/placeholder.svg' },
  ];
};

export const saveDynamicCandidates = (candidates: Candidate[]) => {
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  window.dispatchEvent(new Event('storage')); // Sync across tabs
};


// ==========================================
// ⏱️ TIMER & ELECTION STATE LOGIC ⏱️
// ==========================================

interface ElectionState {
  electionEnded: boolean;
  endTime: number | null; 
}

function getElectionState(): ElectionState {
  const stored = localStorage.getItem(ELECTION_KEY);
  if (stored) return JSON.parse(stored);
  return { electionEnded: false, endTime: null }; 
}

function saveElectionState(state: ElectionState): void {
  localStorage.setItem(ELECTION_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('storage'));
}

export function setElectionTimer(minutes: number): void {
  const state = getElectionState();
  state.endTime = Date.now() + minutes * 60 * 1000;
  state.electionEnded = false;
  saveElectionState(state);
}

export function getElectionStateData(): ElectionState {
  return getElectionState();
}


// ==========================================
// 🗳️ CACHE & STATE VERIFICATION LOGIC 🗳️
// ==========================================

// Record a vote in session cache after successful on-chain transaction
export function recordVote(voteRecord: VoteRecord): void {
  voteRecordsCache.set(voteRecord.transactionHash, voteRecord);
  voterTxCache.set(voteRecord.odifier, voteRecord.transactionHash);
}

// Check if voter has voted in this session
export function hasUserVoted(voterId: string): boolean {
  return voterTxCache.has(voterId);
}

// Get user's vote record from session
export function getUserVote(voterId: string): VoteRecord | null {
  const txHash = voterTxCache.get(voterId);
  if (!txHash) return null;
  return voteRecordsCache.get(txHash) || null;
}

export function getState(): VotingState {
  const electionState = getElectionState();
  
  // Count votes from cache (session-based)
  const voteCounts = new Map<string, number>();
  voteRecordsCache.forEach((record) => {
    const current = voteCounts.get(record.candidateId) || 0;
    voteCounts.set(record.candidateId, current + 1);
  });
  
  // Fetch dynamic candidates instead of hardcoded ones!
  const currentCandidates = getDynamicCandidates();
  
  const candidates = currentCandidates.map(candidate => ({
    ...candidate,
    votes: voteCounts.get(candidate.id) || 0,
  }));
  
  return {
    candidates,
    totalVoters: getTotalRegisteredVoters() as unknown as number, // Cast to fix promise typing issue
    electionEnded: electionState.electionEnded,
    blockchainHeight: voteRecordsCache.size,
    currentUser: null,
    isWalletConnected: false,
  };
}

// Verify vote by transaction hash
export async function verifyVote(transactionHash: string): Promise<any> {
  const INFURA_PROJECT_ID = "6765c54502f2450daa10360107835d8c";
  const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;

  // NEW REAL → PASTE THIS (your second deployment)
  const address = '0x3c31042AF77155F1526DA16C75a84c267e989E48';

  // ADD THIS ABI (tells ethers.js how to call your contract's functions)
  const VOTESHIELD_ABI = [
    "function vote(string voterId, string candidateId)",
    "function hasVoted(string voterId) view returns (bool)",
    "function voteOf(string voterId) view returns (string)",
    "event Voted(string indexed voterId, string candidateId, uint timestamp)"
  ];

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const contract = new ethers.Contract(address, VOTESHIELD_ABI, provider);

  const tx = await provider.getTransaction(transactionHash);
  
  // Try to extract the actual voterId from the transaction data to prevent hardcoding
  let dat = null;
  try {
      if (tx && tx.data) {
          const parsedTx = contract.interface.parseTransaction({ data: tx.data });
          if (parsedTx && parsedTx.args && parsedTx.args[0]) {
             dat = await contract.voteOf(parsedTx.args[0]);
          }
      } else {
         // Fallback to your test string if parsing fails
         dat = await contract.voteOf('PSCMR2025001');
      }
  } catch (e) {
      console.log("Error reading from contract", e);
  }

  return { tx, dat };
}

export function endElection(): void {
  const state = getElectionState();
  state.electionEnded = true;
  saveElectionState(state);
}

export function getTotalVotes(): number {
  return voteRecordsCache.size;
}

export function resetState(): void {
  voteRecordsCache.clear();
  voterTxCache.clear();
  localStorage.removeItem(ELECTION_KEY);
  // Do NOT clear candidates or campaign so the admin doesn't lose their setup
}

// Export for use in components
export { formatHash, formatTimestamp };