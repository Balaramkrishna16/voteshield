import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, ArrowLeft, Hash, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/voting/Logo';
import { verifyVote, VoteRecord } from '@/lib/votingStore';

export default function Verify() {
  const navigate = useNavigate();
  const [transactionHash, setTransactionHash] = useState('');
  const [searchResult, setSearchResult] = useState<VoteRecord | null | 'not_found'>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [votedfor, setVotedFor] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!transactionHash.trim()) return;
    
    setIsSearching(true);
    // Simulate network delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const result = await verifyVote(transactionHash.trim());
    setSearchResult(result?.tx || 'not_found');
    setVotedFor(result?.dat || null);
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/10 via-background to-background" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Search className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Verify Your Vote
          </h1>
          <p className="text-muted-foreground">
            Enter your transaction hash to verify your vote was recorded on the blockchain
          </p>
        </div>

        {/* Search Box */}
        <div className="glass-card p-6 mb-8">
          <div className="flex gap-3">
            <Input
              placeholder="Enter transaction hash (0x...)"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              className="bg-muted border-border font-mono"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search Result */}
        {searchResult && searchResult !== 'not_found' && (
          <div className="glass-card p-6 fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">Vote Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  Your vote was successfully recorded on the blockchain
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Hash className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Transaction Hash</p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {searchResult.hash}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Block Number</p>
                  <p className="font-medium text-foreground">{searchResult.blockNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Voted For</p>
                  <p className="font-medium text-foreground">
                    {votedfor}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success text-center">
                  ✓ Block #{searchResult.blockNumber} • Immutably recorded on Ethereum
                </p>
              </div>
            </div>
          </div>
        )}

        {searchResult === 'not_found' && (
          <div className="glass-card p-6 fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive">Vote Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  No vote was found with this transaction hash
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Can't find your transaction hash? Check your vote receipt or contact support.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return to Voting Portal
          </Button>
        </div>
      </main>
    </div>
  );
}