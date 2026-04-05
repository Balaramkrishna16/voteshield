import { CheckCircle2, Copy, ExternalLink, Clock, Hash, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEtherscanUrl } from '@/lib/ethereum';
import { toast } from 'sonner';

export function QRReceipt({ voteRecord, candidateName }: { voteRecord: any, candidateName: string }) {
  
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // ✅ NEW: Download Receipt Function
  const handleDownloadReceipt = () => {
    const receiptContent = `
=========================================
          VOTESECURE ELECTION RECEIPT
=========================================
Candidate Voted For : ${candidateName}

--- TRANSACTION DETAILS ---
Status            : ${voteRecord.status}
Transaction Hash  : ${voteRecord.transactionHash}
Block Number      : ${voteRecord.blockNumber}
Timestamp         : ${new Date(voteRecord.timestamp).toLocaleString()}

--- BLOCKCHAIN ROUTING ---
From (Relayer)    : ${voteRecord.from}
To (Contract)     : ${voteRecord.to}

=========================================
Verify your vote immutability on Etherscan:
${getEtherscanUrl(voteRecord.transactionHash)}
=========================================
    `.trim();

    // Create a Blob from the text
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `VoteSecure_Receipt_Block${voteRecord.blockNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded successfully!');
  };

  return (
    <div className="space-y-4">
      {/* Voted For Banner */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <p className="text-sm text-muted-foreground mb-1">Successfully Voted For</p>
        <p className="text-xl font-bold text-primary">{candidateName}</p>
      </div>

      {/* Transaction Details */}
      <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
        
        {/* 1. Status */}
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            {voteRecord.status}
          </span>
        </div>

        {/* 2. Transaction Hash */}
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Transaction Hash</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{formatAddress(voteRecord.transactionHash)}</span>
            <button onClick={() => copyToClipboard(voteRecord.transactionHash)} className="text-muted-foreground hover:text-foreground">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Block */}
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Block</span>
          <span className="text-sm font-medium">{voteRecord.blockNumber}</span>
        </div>

        {/* 4. Timestamp */}
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Timestamp</span>
          <span className="text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {new Date(voteRecord.timestamp).toLocaleString()}
          </span>
        </div>

        {/* 5. From */}
        <div className="flex justify-between items-center py-2 border-b border-border/50">
          <span className="text-sm text-muted-foreground">From (Relayer)</span>
          <span className="text-sm font-mono text-muted-foreground">{formatAddress(voteRecord.from)}</span>
        </div>

        {/* 6. To */}
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">To (Contract)</span>
          <span className="text-sm font-mono flex items-center gap-1.5">
             <Shield className="w-3.5 h-3.5 text-primary" />
            {formatAddress(voteRecord.to)}
          </span>
        </div>

      </div>

      {/* Buttons: Download & Etherscan */}
      <div className="flex gap-3 mt-4">
        <Button 
          variant="secondary" 
          className="flex-1 gap-2" 
          onClick={handleDownloadReceipt}
        >
          <Download className="w-4 h-4" /> Download
        </Button>
        
        <Button 
          variant="outline" 
          className="flex-1 gap-2" 
          onClick={() => window.open(getEtherscanUrl(voteRecord.transactionHash), '_blank')}
        >
          Etherscan <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}