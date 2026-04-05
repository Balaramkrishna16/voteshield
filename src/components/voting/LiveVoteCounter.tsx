import { useState, useEffect } from 'react';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { getTotalVotes } from '@/lib/votingStore';
import { getBlockchainStats } from '@/lib/blockchain';
import { getTotalRegisteredVoters } from '@/lib/voters';
import { cn } from '@/lib/utils';

interface LiveVoteCounterProps {
  encrypted?: boolean;
  className?: string;
}

export function LiveVoteCounter({ encrypted = true, className }: LiveVoteCounterProps) {
  const [count, setCount] = useState(getTotalVotes());
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState(getBlockchainStats());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentCount = getTotalVotes();
      const currentStats = getBlockchainStats();
      
      if (currentCount !== count) {
        setIsUpdating(true);
        setCount(currentCount);
        setTimeout(() => setIsUpdating(false), 500);
      }
      
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [count]);

  const totalVoters = getTotalRegisteredVoters();
  const turnoutPercent = totalVoters > 0 ? ((count / totalVoters) * 100).toFixed(1) : '0';

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {encrypted ? 'Total Votes (On-Chain)' : 'Total Votes'}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-3xl font-bold text-foreground transition-all',
                isUpdating && 'text-primary scale-110'
              )}
            >
              {count}
            </span>
            {isUpdating && (
              <TrendingUp className="w-4 h-4 text-success animate-bounce" />
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{totalVoters}</p>
          <p className="text-[10px] text-muted-foreground">Registered</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-success">{turnoutPercent}%</p>
          <p className="text-[10px] text-muted-foreground">Turnout</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-primary" />
            <p className="text-lg font-bold font-mono text-foreground">{stats.blockHeight}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Blocks</p>
        </div>
      </div>
    </div>
  );
}
