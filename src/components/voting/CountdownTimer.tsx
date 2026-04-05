import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<string>('LOADING...');
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/election-status`);
        const data = await res.json();
        if (data.success && data.status) {
          setEndTime(data.status.end_time);
          setIsEnded(data.status.is_ended);
        }
      } catch (err) {
        console.error("Timer failed to sync with global database");
      }
    };

    fetchStatus(); 
    const syncInterval = setInterval(fetchStatus, 3000); 
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (isEnded) {
      setTimeLeft('ELECTION ENDED');
      return;
    }

    if (!endTime) {
      setTimeLeft('NOT STARTED');
      return;
    }

    const tick = () => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    tick(); 
    const tickInterval = setInterval(tick, 1000); 
    return () => clearInterval(tickInterval);
  }, [endTime, isEnded]);

  return (
    <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border border-border">
      <Clock className="w-4 h-4 text-primary animate-pulse" />
      <span className="font-mono font-bold tracking-wider text-primary">{timeLeft}</span>
    </div>
  );
}