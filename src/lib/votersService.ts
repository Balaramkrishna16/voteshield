import { supabase, Voter } from './supabaseClient';

// ✅ Check if voter is registered
export async function isVoterRegistered(voterId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('voters')
    .select('voter_id')
    .eq('voter_id', voterId)
    .eq('is_active', true)
    .limit(1); // ✅ FIXED

  if (error) {
    console.error('Error checking voter:', error);
    return false;
  }

  return data.length > 0;
}

// ✅ Get voter details
export async function getVoterById(voterId: string): Promise<Voter | null> {
  const cleanVoterId = voterId.trim();

  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .eq('voter_id', cleanVoterId)
    .limit(1); // ✅ FIXED

  if (error) {
    console.error('Supabase error:', error);
    return null;
  }

  return data[0] || null; // ✅ FIXED
}

// ✅ Get total voters
export async function getTotalRegisteredVoters(): Promise<number> {
  const { count, error } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    console.error('Error counting voters:', error);
    return 0;
  }

  return count || 0;
}

// ✅ Get voters by department
export async function getVotersByDepartment(department: string): Promise<Voter[]> {
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .eq('department', department)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching voters:', error);
    return [];
  }

  return data || [];
}

// ✅ Update wallet
export async function updateVoterWallet(
  voterId: string,
  walletAddress: string
): Promise<boolean> {
  const { error } = await supabase
    .from('voters')
    .update({ wallet_address: walletAddress })
    .eq('voter_id', voterId);

  if (error) {
    console.error('Error updating wallet:', error);
    return false;
  }

  return true;
}

// ✅ Department stats
export async function getDepartmentStats(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('voters')
    .select('department')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching department stats:', error);
    return {};
  }

  const stats: Record<string, number> = {};
  data.forEach((voter) => {
    stats[voter.department] = (stats[voter.department] || 0) + 1;
  });

  return stats;
}