import { useState, useEffect } from 'react';
import { Blocks, Hash, Clock, Link, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLatestBlockNumber, getBlock as getEthBlock, isMetaMaskInstalled } from '@/lib/ethereum';
import { getBlockchain, Block, formatHash } from '@/lib/blockchain';

interface DisplayBlock {
  number: number;
  hash: string;
  timestamp: string;
  transactions: number;
  isRealBlock?: boolean;
}

interface BlockchainVisualizerProps {
  className?: string;
  useRealBlockchain?: boolean;
}

export function BlockchainVisualizer({ className, useRealBlockchain = true }: BlockchainVisualizerProps) {
  const [blocks, setBlocks] = useState<DisplayBlock[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [latestBlock, setLatestBlock] = useState(0);

  // Fetch real Sepolia blocks
  const fetchRealBlocks = async () => {

    try {
      const blockNumber = await getLatestBlockNumber();

      setLatestBlock(blockNumber);
      setIsLive(true);

      const blockPromises = [];
      for (let i = 8; i >= 0; i--) {
        blockPromises.push(getEthBlock(blockNumber - i));
      }

      const blockData = await Promise.all(blockPromises);
      const now = Date.now();

      const formattedBlocks: DisplayBlock[] = blockData
        .filter((b): b is NonNullable<typeof b> => b !== null)
        .map((b) => ({
          number: b.number,
          hash: `${b.hash.slice(0, 6)}...${b.hash.slice(-4)}`,
          timestamp: formatTimestamp(b.timestamp, now),
          transactions: b.transactions,
          isRealBlock: true,
        }));

      setBlocks(formattedBlocks);
    } catch (error) {
      console.error('Failed to fetch real blocks:', error);
    }
  };



  const formatTimestamp = (blockTimestamp: number, now: number): string => {
    const diff = Math.floor(now / 1000 - blockTimestamp);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const formatLocalTimestamp = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  useEffect(() => {
    if (useRealBlockchain) {
      fetchRealBlocks();
      const interval = setInterval(fetchRealBlocks, 12000);
      return () => clearInterval(interval);
    } else {
      // const interval = setInterval(fetchLocalBlocks, 2000);
      return () => clearInterval(interval);
    }
  }, [useRealBlockchain]);

  return (
    <div className={cn('glass-card p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Blocks className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {isLive ? 'Sepolia Blockchain' : 'Local Blockchain'}
        </h3>
        <div className="ml-auto flex items-center gap-2">
          {isLive ? (
            <>
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success">Live on Sepolia</span>
            </>
          ) : (
            <>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isRefreshing ? "bg-warning animate-ping" : "bg-primary animate-pulse"
              )} />
              <span className="text-xs text-muted-foreground">Local</span>
            </>
          )}
          {isLive && (
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {latestBlock > 0 && (
        <div className="text-xs text-muted-foreground mb-3">
          Latest Block: <span className="font-mono text-foreground">#{latestBlock.toLocaleString()}</span>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {blocks.map((block, index) => (
          <div key={`${block.number}-${index}`} className="flex items-center gap-2">
            <div
              className={cn(
                'blockchain-block min-w-[150px] flex-shrink-0 transition-all',
                index === blocks.length - 1 && 'ring-2 ring-primary/50 pulse-glow'
              )}
            >
              <div className="flex items-center gap-1 mb-2">
                <Hash className="w-3 h-3 text-primary" />
                <span className="text-primary font-medium">
                  #{block.number.toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground text-[10px] truncate font-mono">
                  {block.hash}
                </div>
                
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {block.timestamp}
                </div>
                
                <div className="flex items-center gap-1 text-[10px]">
                  <FileText className="w-3 h-3 text-success" />
                  <span className="text-success">
                    {block.transactions} txn{block.transactions !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {block.isRealBlock && (
                <div className="mt-2 pt-2 border-t border-border/30 text-[9px] text-success">
                  ✓ On-chain
                </div>
              )}
            </div>
            
            {index < blocks.length - 1 && (
              <div className="flex items-center">
                <div className="w-4 h-px bg-gradient-to-r from-primary/50 to-primary" />
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-primary/50" />
              </div>
            )}
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {isMetaMaskInstalled() 
            ? 'Connect wallet to see live Sepolia blocks' 
            : 'No blocks yet. Cast a vote to create the first block!'}
        </div>
      )}
    </div>
  );
}
