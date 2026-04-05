import { useState, useEffect } from 'react';
import { Wallet, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  connectWallet,
  connectWithPrivateKey,
  isMetaMaskInstalled,
  formatAddress,
} from '@/lib/ethereum';
import { toast } from 'sonner';

interface MetaMaskButtonProps {
  onConnect?: (address: string) => void; // ✅ Make this optional
  className?: string;
}

// ✅ Add onConnect to the destructured props here
export function MetaMaskButton({ onConnect, className }: MetaMaskButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  
  // Hardcoded relayer key for the hackathon demo
  const [privateKey, setPrivateKey] = useState('0f3dbcf77dff7366c47c2b0fd1fe946f5d9be8c592e915dc5e9aaab304946e6b');

  // ✅ Auto-connect on mount using the private key
  useEffect(() => {
    if (!connectedAddress && privateKey) {
      handlePrivateKeyConnect();
    }
  }, []); // Run once on component mount

  const handleMetaMaskConnect = async () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await connectWallet();
      setConnectedAddress(result.address);
      setBalance(result.balance);
      
      // ✅ Safely check if onConnect was passed before calling it
      if (onConnect) onConnect(result.address); 
      
      toast.success('MetaMask connected to Sepolia!');
    } catch (error: any) {
      console.error('Connection error:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected');
      } else {
        toast.error(error.message || 'Failed to connect');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrivateKeyConnect = async () => {
    if (!privateKey.trim()) {
      toast.error('Please enter a private key');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await connectWithPrivateKey(privateKey);
      setConnectedAddress(result.address);
      setBalance(result.balance);
      
      // ✅ Safely check if onConnect was passed before calling it
      if (onConnect) onConnect(result.address); 
      
      toast.success('Relayer Wallet Connected!');
    } catch (error: any) {
      console.error('Private key error:', error);
      toast.error(error.message || 'Invalid private key');
    } finally {
      setIsConnecting(false);
    }
  };

  // ----------------------------------------------------
  // UI 1: Connected State
  // ----------------------------------------------------
  if (connectedAddress) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="glass-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-mono text-foreground">{formatAddress(connectedAddress)}</p>
              {balance && (
                <p className="text-xs text-muted-foreground">{parseFloat(balance).toFixed(4)} ETH</p>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-center text-success">Connected to Sepolia Testnet</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // UI 2: Disconnected State (Fallback if auto-connect fails)
  // ----------------------------------------------------
  return (
    <div className={cn("space-y-3", className)}>
       <Button 
        onClick={handleMetaMaskConnect} 
        disabled={isConnecting}
        className="w-full gap-2 bg-[#f6851b] hover:bg-[#e2761b] text-white"
      >
        {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
        Connect MetaMask
      </Button>
    </div>
  );
}