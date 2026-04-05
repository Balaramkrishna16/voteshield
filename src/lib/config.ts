// src/lib/config.ts
// 0xc3ce57034fd253cc2507ccf2ec816d6460f8790d0e98ffe1949d9da9cfb65f56
// 0x475715bcd56a4fe39fa0446e3aad1c977962cbcdd3f68a1d7ceb9c46a27bdf6c
// Vote data type identifier
// src/lib/config.ts
export const INFURA_PROJECT_ID = "6765c54502f2450daa10360107835d8c";
export const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;

// OLD FAKE → DELETE THIS
// export const VOTESHIELD_CONTRACT_ADDRESS = '0x9fde349ff8e87d2b6dd9c0577c3b260821b91ffa';

// NEW REAL → PASTE THIS (your second deployment)
export const VOTESHIELD_CONTRACT_ADDRESS = '0x3c31042AF77155F1526DA16C75a84c267e989E48';

// ADD THIS ABI (tells ethers.js how to call your contract's functions)
export const VOTESHIELD_ABI = [
  "function vote(string voterId, string candidateId)",
  "function hasVoted(string voterId) view returns (bool)",
  "function voteOf(string voterId) view returns (string)",
  "event Voted(string indexed voterId, string candidateId, uint timestamp)"
];

export const VOTESHIELD_VOTE_TYPE = 'VOTESHIELD_VOTE_V1'; // Keep for compatibility