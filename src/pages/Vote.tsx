import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, QrCode, ShieldCheck, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/voting/Logo';
import { CountdownTimer } from '@/components/voting/CountdownTimer';
import { CandidateCard } from '@/components/voting/CandidateCard';
import { VoteModal } from '@/components/voting/VoteModal';
import { QRReceipt } from '@/components/voting/QRReceipt';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VoteRecord } from '@/lib/votingStore'; 
import { getEtherscanUrl } from '@/lib/ethereum';
import { toast } from 'sonner';
import {
  hasVoterVoted,
  getVoterVoteRecord,
  recordVoteInDatabase,
} from '@/lib/voteService';
import { hasVotedOnChain } from '@/lib/ethereum';

// ✅ Dynamic API URL for Vercel & Render Deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VoteDashboard() {
  const navigate = useNavigate();

  // User & Candidate States
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [voterName, setVoterName] = useState<string>('');
  const [Candidates, setCandidates] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Selection & UI States
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [userVote, setUserVote] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [electionEnded, setElectionEnded] = useState(false);

  // ✅ INITIAL LOAD: Decrypt User & Fetch Candidates from DB
  useEffect(() => {
    const initializePage = async () => {
      const user = localStorage.getItem('voteshield_user');
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);
      setIsLoading(true);

      try {
        // 1. Fetch Decrypted Voter Info from Secure Backend using API_URL
        const voterRes = await fetch(`${API_URL}/api/voter/${user}`);
        const voterData = await voterRes.json();
        if (voterData.success && voterData.voter) {
          setVoterName(voterData.voter.name);
        }

        // 2. Fetch Candidates from Database using API_URL
        const candRes = await fetch(`${API_URL}/api/candidates`);
        const candData = await candRes.json();
        if (candData.success) {
          setCandidates(candData.candidates);
        }

        // 3. Check Voting Status
        const voted = await hasVoterVoted(user);
        setHasVoted(voted);

        if (voted) {
          const record = await getVoterVoteRecord(user);
          setVoteRecord(record);
          setUserVote(record);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load secure session data");
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();

    // ✅ GLOBAL SYNC: Check Election Status from Database
    const syncElectionStatus = async () => {
      try {
        // Use API_URL here
        const res = await fetch(`${API_URL}/api/election-status`);
        const data = await res.json();
        
        if (data.success && data.status) {
          const { end_time, is_ended } = data.status;
          
          // Lock screen if admin clicked End OR if time is up
          if (is_ended || (end_time && Date.now() >= end_time)) {
            setElectionEnded(true);
          } else {
            setElectionEnded(false);
          }
        }
      } catch (err) {
        console.error("Election status sync failed");
      }
    };

    syncElectionStatus(); // Immediate check
    const interval = setInterval(syncElectionStatus, 3000); // Sync every 3 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  // ✅ HANDLE VOTE
  const handleVote = async (candidateId: string) => {
    if (!currentUser) return;

    if (electionEnded) {
      toast.error('Voting is closed! The election time has expired.');
      return;
    }

    const alreadyVotedOnChain = await hasVotedOnChain(currentUser);
    if (alreadyVotedOnChain) {
      toast.error('You have already voted! (Blockchain enforced)');
      return;
    }

    if (hasVoted) {
      toast.error('You have already voted!');
      return;
    }

    setSelectedCandidate(candidateId);
    setIsVoting(true);
  };

  // ✅ AFTER BLOCKCHAIN SUCCESS
  const handleVoteComplete = async (txResult: any) => {
    if (!currentUser) return;

    const success = await recordVoteInDatabase(
      currentUser,
      txResult.transactionHash,
      txResult.blockNumber
    );

    if (success) {
      setHasVoted(true);
      const record = await getVoterVoteRecord(currentUser);
      setVoteRecord(record);

      setUserVote({
        transactionHash: txResult.transactionHash,
        blockNumber: txResult.blockNumber,
        candidateId: selectedCandidate,
        timestamp: new Date().toISOString()
      });

      toast.success('Vote recorded successfully!');
    } else {
      toast.error('Blockchain success, DB failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const votedCandidateId = userVote?.candidateId;
  const getVotedCandidateName = () => {
    if (!votedCandidateId) return '';
    const candidate = Candidates.find((c: any) => c.id === votedCandidateId);
    return candidate?.name || '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <CountdownTimer />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* USER INFO BAR */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="glass-card px-4 py-2 flex items-center gap-2 border-primary/20">
              <ShieldCheck className="text-primary w-5 h-5" />
              <span className="font-medium">{voterName || 'Verified Voter'}</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-mono">{currentUser}</span>
            </div>

            {hasVoted && userVote && (
              <div className="glass-card px-4 py-2 flex items-center gap-2 border-success/40 bg-success/5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-mono">Block #{userVote.blockNumber || userVote.block_number}</span>
                <a href={getEtherscanUrl(userVote.transactionHash || userVote.tx_hash)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            )}
          </div>

          {hasVoted && (
            <Button variant="outline" onClick={() => setShowReceipt(true)} className="gap-2 border-primary/20">
              <QrCode className="w-4 h-4" /> View Digital Receipt
            </Button>
          )}
        </div>

        {/* ELECTION STATUS BANNER */}
        {electionEnded && (
          <div className="bg-destructive/10 border-2 border-destructive text-destructive px-6 py-6 rounded-2xl text-center mb-10 flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 font-bold text-2xl">
              <AlertCircle className="w-8 h-8" />
              ELECTION OFFICIALLY CLOSED
            </div>
            <p className="opacity-90 max-w-md">The voting window has closed. No further ballots can be submitted.</p>
          </div>
        )}

        {/* BALLOT TITLE */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Cast Your Ballot</h1>
          <p className="text-muted-foreground mt-2">Select one candidate to represent your department.</p>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading secure ballot...</p>
          </div>
        ) : (
          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 ${electionEnded ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            {Candidates.map((candidate: any) => (
              <CandidateCard
                key={candidate.id}
                id={candidate.id}
                name={candidate.name}
                role={candidate.role}
                hasVoted={hasVoted || electionEnded} 
                votedFor={votedCandidateId === candidate.id}
                onVote={handleVote}
              />
            ))}
          </div>
        )}

        {!isLoading && Candidates.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl opacity-50">
            <p>No candidates available in this election database.</p>
          </div>
        )}
      </main>

      {/* VOTE MODAL */}
      <VoteModal
        isOpen={isVoting}
        onClose={() => {
          setIsVoting(false);
          setSelectedCandidate(null);
        }}
        candidateName={Candidates.find((c: any) => c.id === selectedCandidate)?.name || ''}
        voterId={currentUser || ''}
        candidateId={selectedCandidate || ''}
        voteRecord={voteRecord}
        onComplete={handleVoteComplete}
      />

      {/* RECEIPT DIALOG */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="text-success w-5 h-5" /> Immutable Vote Receipt
            </DialogTitle>
            <DialogDescription>
              This is your official cryptographic receipt for your vote.
            </DialogDescription>
          </DialogHeader>
          {userVote && (
            <QRReceipt
              voteRecord={{
                status: "Confirmed",
                transactionHash: userVote.transactionHash || userVote.tx_hash,
                blockNumber: userVote.blockNumber || userVote.block_number,
                timestamp: userVote.timestamp || userVote.created_at || new Date().toISOString(),
                from: userVote.from || "Relayer Proxy", 
                to: "0x3c31042AF77155F1526DA16C75a84c267e989E48",
                candidateId: votedCandidateId || '',
              }}
              candidateName={getVotedCandidateName()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}