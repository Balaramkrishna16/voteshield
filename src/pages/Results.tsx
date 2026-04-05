import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Shield, RefreshCw, ArrowLeft } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { countVotesFromBlockchain } from '@/lib/voteService';
import { getTotalRegisteredVoters } from '@/lib/votersService';
import { Logo } from '@/components/voting/Logo';
import { Button } from '@/components/ui/button';

// ✅ Dynamic API URL for Vercel & Render Deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CANDIDATE_COLORS: Record<string, string> = {
  alice: '#8b5cf6', 
  bob: '#3b82f6',   
  carol: '#10b981', 
};

export default function Results() {
  const navigate = useNavigate();
  
  const [candidates, setCandidates] = useState<any[]>([]);
  const [voteData, setVoteData] = useState<{ [key: string]: number; total: number }>({ total: 0 });
  const [totalVoters, setTotalVoters] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [winner, setWinner] = useState<string | null>(null);

  const fetchResults = async () => {
    setIsRefreshing(true);
    try {
      const candRes = await fetch(`${API_URL}/api/candidates`);
      const candData = await candRes.json();
      let currentCandidates = [];
      if (candData.success) {
        setCandidates(candData.candidates);
        currentCandidates = candData.candidates;
      }

      const onChainCounts = await countVotesFromBlockchain();
      setVoteData(onChainCounts);
      
      const dbTotalVoters = await getTotalRegisteredVoters();
      setTotalVoters(dbTotalVoters);
      
      let currentWinner = null;
      let maxVotes = 0;
      
      currentCandidates.forEach((c: any) => {
        const count = onChainCounts[c.id] || 0;
        if (count > maxVotes) {
          maxVotes = count;
          currentWinner = c.id;
        }
      });
      
      setWinner(maxVotes > 0 ? currentWinner : null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const chartData = candidates.map((c: any, index: number) => ({
    name: c.name,
    votes: voteData[c.id] || 0,
    color: CANDIDATE_COLORS[c.id] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
  }));

  const turnoutPercentage = totalVoters > 0 
    ? ((voteData.total / totalVoters) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <header className="relative border-b bg-background/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" onClick={fetchResults} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 z-10 text-center">
        
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Official Election Results</h1>
        <p className="text-muted-foreground mb-12">Permanently verified on the Ethereum Sepolia Blockchain.</p>

        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="glass-card px-6 py-4 flex items-center gap-4 min-w-[220px] border-primary/20">
            <div className="p-3 rounded-full bg-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Total Votes Cast</p>
              <p className="text-2xl font-bold">{voteData.total}</p>
            </div>
          </div>
          
          <div className="glass-card px-6 py-4 flex items-center gap-4 min-w-[220px] border-success/20">
            <div className="p-3 rounded-full bg-success/20">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Voter Turnout</p>
              <p className="text-2xl font-bold">{turnoutPercentage}%</p>
            </div>
          </div>
        </div>

        <div className="inline-block glass-card p-10 rounded-3xl border-4 border-yellow-400/50 mb-12 animate-in zoom-in duration-500 w-full max-w-2xl mx-auto shadow-xl shadow-yellow-500/5">
          <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-400 drop-shadow-lg" />
          <h2 className="text-xl font-bold mb-2 text-muted-foreground uppercase tracking-widest">Projected Winner</h2>
          
          <p className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent py-2">
            {winner ? candidates.find((c: any) => c.id === winner)?.name : "Calculating Votes..."}
          </p>

          {winner && voteData.total > 0 && (
            <p className="text-2xl mt-4 opacity-90 font-medium">
              {voteData[winner]} votes (
              {((voteData[winner] / voteData.total) * 100).toFixed(1)}%)
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          <div className="glass-card p-6 h-[400px] border-border/50">
            <h3 className="text-lg font-bold mb-6 text-left border-l-4 border-primary pl-3">Vote Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 h-[400px] border-border/50">
            <h3 className="text-lg font-bold mb-6 text-left border-l-4 border-primary pl-3">Vote Share %</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="45%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="votes" animationBegin={200}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      </main>
    </div>
  );
}