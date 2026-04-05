import { useState } from 'react';
import { User, Vote, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  id: string;
  name: string;
  role: string;
  votes?: number;
  showVotes?: boolean;
  isWinner?: boolean;
  hasVoted?: boolean;
  votedFor?: boolean;
  onVote?: (id: string) => void;
  disabled?: boolean;
}

export function CandidateCard({
  id,
  name,
  role,
  votes = 0,
  showVotes = false,
  isWinner = false,
  hasVoted = false,
  votedFor = false,
  onVote,
  disabled = false,
}: CandidateCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'glass-card p-6 transition-all duration-300',
        isHovered && !disabled && 'scale-[1.02] glow-effect',
        isWinner && 'ring-2 ring-success',
        votedFor && 'ring-2 ring-primary'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col items-center text-center gap-4">
        {/* Avatar */}
        <div className={cn(
          'relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center',
          isWinner && 'from-success/30 to-success/10'
        )}>
          <User className="w-12 h-12 text-muted-foreground" />
          {isWinner && (
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <span className="text-lg">👑</span>
            </div>
          )}
          {votedFor && (
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="text-xl font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>

        {/* Vote Count (only shown when election ends or in admin) */}
        {showVotes && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Votes</span>
              <span className="text-lg font-bold text-foreground">{votes}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-1000',
                  isWinner ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${Math.min((votes / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Vote Button */}
        {!showVotes && onVote && (
          <Button
            onClick={() => onVote(id)}
            disabled={disabled || hasVoted}
            className={cn(
              'w-full gap-2 transition-all',
              votedFor && 'bg-success hover:bg-success/90'
            )}
            variant={votedFor ? 'default' : 'default'}
          >
            {votedFor ? (
              <>
                <Check className="w-4 h-4" />
                Voted
              </>
            ) : hasVoted ? (
              'Already Voted'
            ) : (
              <>
                <Vote className="w-4 h-4" />
                Vote
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
