import { supabase, VoteRecord } from './supabaseClient';
import { getTransaction, getProvider } from './ethereum';
import { VOTESHIELD_CONTRACT_ADDRESS, VOTESHIELD_ABI } from './config';
import { ethers } from 'ethers';

// 📞 GET PHONE NUMBER
export async function getPhoneNumber(voterId: string) {
  const { data, error } = await supabase
    .from("voters")
    .select("phone_number")
    .eq("voter_id", voterId.trim())
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error("Supabase Error:", error.message);
    return null;
  }

  return data?.phone_number || null;
}


// 🧠 COUNT VOTES FROM BLOCKCHAIN (FINAL FIX)
export async function countVotesFromBlockchain(): Promise<{
  [candidateId: string]: number;
  total: number;
}> {
  try {
    const provider = getProvider();

    const contract = new ethers.Contract(
      VOTESHIELD_CONTRACT_ADDRESS,
      VOTESHIELD_ABI,
      provider
    );

    const filter = contract.filters.Voted();
    const events = await contract.queryFilter(filter, 0, 'latest');

    // 🔥 FIX: Removed hardcoded alice/bob/carol. Now it accepts ANY dynamic candidate ID.
    const counts: { [candidateId: string]: number } = {};
    let total = 0;

    for (const event of events) {
      try {
        const args = (event as any).args;

        if (!args || args.length < 2) continue;

        // Force string conversion to ensure it matches DB IDs perfectly
        const candidateId = String(args[1]); 

        // 🔥 FIX: Dynamically add the candidate to the count object if they don't exist yet
        if (!counts[candidateId]) {
          counts[candidateId] = 0;
        }

        counts[candidateId]++;
        total++;

      } catch (err) {
        console.error("Event parsing error:", err);
      }
    }

    return { ...counts, total };

  } catch (error) {
    console.error('Blockchain count error:', error);
    return { total: 0 };
  }
}


// 📝 RECORD VOTE (WITH SAFE DUPLICATE CHECK)
export async function recordVoteInDatabase(
  voterId: string,
  txHash: string,
  blockNumber: number
): Promise<boolean> {

  const cleanId = voterId.trim();

  // ✅ Prevent duplicate voting
  const alreadyVoted = await hasVoterVoted(cleanId);
  if (alreadyVoted) {
    console.warn("Duplicate vote prevented");
    return false;
  }

  const { error } = await supabase
    .from('votes')
    .insert([
      {
        voter_id: cleanId,
        tx_hash: txHash,
        block_number: blockNumber
      }
    ]);

  if (error) {
    console.error('Insert vote error:', error.message);
    return false;
  }

  return true;
}


// ✅ CHECK IF VOTER HAS VOTED (NO 406)
export async function hasVoterVoted(voterId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('votes')
    .select('voter_id')
    .eq('voter_id', voterId.trim())
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Vote check error:', error.message);
    return false;
  }

  return !!data;
}


// ✅ GET VOTE RECORD
export async function getVoterVoteRecord(
  voterId: string
): Promise<VoteRecord | null> {

  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('voter_id', voterId.trim())
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Fetch vote error:', error.message);
    return null;
  }

  return data;
}


// 🔗 GET ALL TX HASHES
export async function getAllVoteTxHashes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('tx_hash')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Fetch tx hashes error:', error.message);
    return [];
  }

  return data?.map(record => record.tx_hash) || [];
}


// 🔍 VERIFY VOTE FROM BLOCKCHAIN
export async function verifyVoteFromBlockchain(txHash: string) {
  try {
    const tx = await getTransaction(txHash);

    if (!tx || !tx.voteData) {
      return { isValid: false };
    }

    const { data, error } = await supabase
      .from('votes')
      .select('voter_id')
      .eq('tx_hash', txHash)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Verification DB error:', error.message);
      return { isValid: false };
    }

    if (!data) {
      return { isValid: false };
    }

    return {
      isValid: true,
      voterId: tx.voteData.voterId,
      candidateId: tx.voteData.candidateId,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp
    };

  } catch (error) {
    console.error('Verify vote error:', error);
    return null;
  }
}


// 📊 GET VOTING STATS
export async function getVotingStats() {
  const { count: totalVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  const { count: totalVoters } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const votes = totalVotes || 0;
  const voters = totalVoters || 0;

  return {
    totalRegisteredVoters: voters,
    totalVotesCast: votes,
    turnoutPercentage:
      voters > 0 ? parseFloat(((votes / voters) * 100).toFixed(2)) : 0
  };
}