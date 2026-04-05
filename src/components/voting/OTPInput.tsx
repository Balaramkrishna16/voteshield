import { useState , useEffect} from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Check, Send, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {getPhoneNumber} from '@/lib/voteService'
interface OTPInputProps {
  onVerify: () => void;
  number: string;
  disabled?: boolean;
}
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export function OTPInput({ onVerify, number, disabled,voterId }: OTPInputProps) {
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber,setPhoneNumber] = useState('')
  const formattedPhone = `+91${phoneNumber}`;
useEffect(() => {
  async function loadPhone() {
    const number = await getPhoneNumber(voterId);
    if (number) setPhoneNumber(number);
  }
  loadPhone();
}, [voterId]);
  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }

    setIsSending(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('OTP sent to your phone!');
        setIsSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      toast.error('Network error. Check backend');
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Enter full OTP');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone, otp }),
      });

      const data = await res.json();

      if (data.valid) {
        toast.success('Phone verified!');
        onVerify();
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {phoneNumber ? formattedPhone : 'Enter phone to get OTP'}
        </span>
        <Button
          size="sm"
          variant={isSent ? 'outline' : 'default'}
          onClick={sendOTP}
          disabled={ !phoneNumber || isSent}
          className="gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Sending...
            </>
          ) : isSent ? (
            <>
              <Check className="w-3 h-3 text-success" />
              Sent
            </>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Send OTP
            </>
          )}
        </Button>
      </div>

      {isSent && (
        <div className="flex flex-col items-center gap-4">
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={6}
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={verifyOTP}
            disabled={otp.length !== 6 }
            className={cn('w-full gap-2')}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
