import { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatHash, VoteRecord } from '@/lib/votingStore';
import { submitVoteTransaction, getEtherscanUrl } from '@/lib/ethereum';

// ✅ Added the missing API_URL definition here!
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  voterId: string;
  candidateId: string;
  voteRecord?: VoteRecord | null;
  onComplete?: (voteRecord?: VoteRecord) => void;
}

type Stage = 'confirm' | 'pin' | 'signing' | 'submitting' | 'success' | 'error';

export function VoteModal({
  isOpen,
  onClose,
  candidateName,
  voterId,
  candidateId,
  voteRecord: externalVoteRecord,
  onComplete,
}: VoteModalProps) {

  const [stage, setStage] = useState<Stage>('confirm');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [voteRecord, setVoteRecord] = useState<VoteRecord | null>(null);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStage('confirm');
      setProgress(0);
      setVoteRecord(null);
      setError('');
      setPin('');
      setPinError('');
    }
  }, [isOpen]);

  // 🔐 VERIFY PIN
  const verifyPin = async () => {
    if (!pin || pin.length !== 4) {
      setPinError('Enter valid 4-digit PIN');
      return;
    }

    setLoadingPin(true);

    try {
      const res = await fetch(`${API_URL}/api/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          voterId: voterId.trim(),
          pin: pin.trim()
        })
      });

      const data = await res.json();

      // ✅ FIXED CONDITION
      if (data.success && data.valid) {
        setPin('');
        setPinError('');
        handleSubmit();
      } else {
        setPinError(data.message || "Invalid PIN");
      }

    } catch (err) {
      console.error(err);
      setPinError("Server error. Try again.");
    } finally {
      setLoadingPin(false);
    }
  };

  // 🚀 SUBMIT VOTE
  const handleSubmit = async () => {
    setStage('signing');
    setProgress(10);

    let interval: any;

    try {
      setStage('submitting');
      setProgress(30);

      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 90));
      }, 500);

      const txResult = await submitVoteTransaction(voterId, candidateId);

      clearInterval(interval);
      setProgress(100);

      const record: VoteRecord = {
        voterId,
        timestamp: new Date().toLocaleString(),
        transactionHash: txResult.transactionHash,
        blockNumber: txResult.blockNumber,
        candidateId,
        gasUsed: txResult.gasUsed,
        isOnChain: true,
      };

      setVoteRecord(record);
      setStage('success');

      onComplete?.(record);

    } catch (err: any) {
      if (interval) clearInterval(interval);

      console.error(err);

      if (err.code === 4001) {
        setError("Transaction rejected in wallet");
      } else {
        setError(err.message || 'Transaction failed');
      }

      setStage('error');
    }
  };

  const handleCopy = () => {
    const record = voteRecord || externalVoteRecord;
    if (record) {
      navigator.clipboard.writeText(record.transactionHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayRecord = voteRecord || externalVoteRecord;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>

      <DialogContent className="sm:max-w-md p-6">

        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {stage === 'confirm' && 'Confirm Your Vote'}
            {stage === 'pin' && 'Enter Security PIN'}
            {stage === 'signing' && 'Sign Transaction'}
            {stage === 'submitting' && 'Submitting Vote'}
            {stage === 'success' && 'Vote Successful'}
            {stage === 'error' && 'Error'}
          </DialogTitle>

          <DialogDescription>
            Secure blockchain voting process
          </DialogDescription>

        </DialogHeader>

        <div className="mt-6 flex flex-col items-center gap-4">

          {stage === 'confirm' && (
            <>
              <Lock className="w-10 h-10 text-primary" />
              <p>Voting for <b>{candidateName}</b></p>

              <div className="flex gap-3 w-full">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStage('pin')} className="flex-1">
                  Continue
                </Button>
              </div>
            </>
          )}

          {stage === 'pin' && (
            <>
              <Lock className="w-10 h-10 text-primary" />
              <p>Enter your 4-digit PIN</p>

              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                maxLength={4}
                className="w-full p-2 border rounded text-center text-foreground bg-background"
              />

              {pinError && (
                <p className="text-red-500 text-sm">{pinError}</p>
              )}

              <div className="flex gap-3 w-full">
                <Button onClick={() => setStage('confirm')} className="flex-1">
                  Back
                </Button>
                <Button onClick={verifyPin} disabled={loadingPin} className="flex-1">
                  {loadingPin ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </>
          )}

          {(stage === 'signing' || stage === 'submitting') && (
            <>
              <Loader2 className="animate-spin text-primary w-8 h-8" />
              <p>Please wait...</p>
              <Progress value={progress} className="w-full" />
            </>
          )}

          {stage === 'success' && displayRecord && (
            <>
              <CheckCircle className="text-green-500 w-12 h-12" />
              <p>Vote recorded successfully!</p>

              <Button
                onClick={() =>
                  window.open(getEtherscanUrl(displayRecord.transactionHash))
                }
                className="w-full"
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                View on Etherscan
              </Button>
            </>
          )}

          {stage === 'error' && (
            <>
              <AlertTriangle className="text-red-500 w-12 h-12" />
              <p>{error}</p>

              <Button onClick={handleSubmit} className="w-full">
                Try Again
              </Button>
            </>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}