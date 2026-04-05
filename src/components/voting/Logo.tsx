import { Shield } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-effect">
          <Shield className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold gradient-text">VoteShield</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PSCMR College</span>
      </div>
    </div>
  );
}
