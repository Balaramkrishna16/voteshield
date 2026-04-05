import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, Lock, BarChart3, Users, Blocks, Database, 
  Shield, Clock, Trophy, LayoutDashboard, Settings, Plus, Trash2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Logo } from '@/components/voting/Logo';
import { BlockchainVisualizer } from '@/components/voting/BlockchainVisualizer';
import { getBlockchainStats, isValidChain, getBlockchain } from '@/lib/blockchain';
import { countVotesFromBlockchain } from '@/lib/voteService';
import { getTotalRegisteredVoters } from '@/lib/votersService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ✅ Dynamic API URL for Vercel & Render Deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ADMIN_PASSWORD = 'admin'; 

export default function Admin() {
  const navigate = useNavigate();
  
  // Auth & UI State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaign'>('dashboard');
  
  // Election State
  const [showResults, setShowResults] = useState(false);
  const [blockchainStats, setBlockchainStats] = useState(getBlockchainStats());
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number; total: number }>({ total: 0 });
  const [totalVoters, setTotalVoters] = useState<number>(0);
  const [timerMinutes, setTimerMinutes] = useState('60');

  // Database-backed Campaign State
  const [campaignName, setCampaignName] = useState('Loading...');
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateRole, setNewCandidateRole] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
      fetchGlobalElectionData(); 
    }
  }, [isAuthenticated]);

  const fetchDashboardStats = async () => {
    try {
      setTotalVoters(await getTotalRegisteredVoters());
      setVoteCounts(await countVotesFromBlockchain());
      setBlockchainStats(getBlockchainStats());
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchGlobalElectionData = async () => {
    try {
      // Fetch Campaign Name
      const campRes = await fetch(`${API_URL}/api/campaign`);
      const campData = await campRes.json();
      if (campData.campaign) setCampaignName(campData.campaign.name);

      // Fetch Candidates
      const candRes = await fetch(`${API_URL}/api/candidates`);
      const candData = await candRes.json();
      if (candData.candidates) setCandidatesList(candData.candidates);

      // Fetch Election End Status to sync UI
      const statusRes = await fetch(`${API_URL}/api/election-status`);
      const statusData = await statusRes.json();
      if (statusData.success && statusData.status?.is_ended) {
        setShowResults(true);
      }
    } catch (err) {
      console.error("Failed to load database election data", err);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowLoginDialog(false);
      toast.success('Admin authenticated');
    } else {
      toast.error('Invalid password');
    }
  };

  // ================= GLOBAL TIMER & END STATUS =================

  const handleStartTimer = async () => {
    const expiryTime = Date.now() + Number(timerMinutes) * 60 * 1000;
    try {
      const res = await fetch(`${API_URL}/api/election-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_time: expiryTime, is_ended: false })
      });
      if (res.ok) {
        toast.success(`Timer synced globally for ${timerMinutes} minutes!`);
      } else {
        toast.error("Ensure backend is running and table exists.");
      }
    } catch (error) {
      toast.error("Failed to sync timer");
    }
  };

  const handleEndElection = async () => {
    if (confirm("End election for all voters immediately?")) {
      try {
        const res = await fetch(`${API_URL}/api/election-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_ended: true })
        });
        if (res.ok) {
          setShowResults(true);
          confetti();
          toast.error("Election Ended Globally 🔒");
        }
      } catch (error) {
        toast.error("Failed to end election");
      }
    }
  };

  // ================= CAMPAIGN MANAGEMENT (DATABASE) =================

  const handleUpdateCampaign = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaign`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: campaignName })
      });
      if (res.ok) toast.success('Global Campaign updated!');
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidateName || !newCandidateRole) return toast.error('Fill all fields');
    const newId = newCandidateName.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    try {
      const res = await fetch(`${API_URL}/api/candidates`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: newCandidateName, role: newCandidateRole })
      });

      if (res.ok) {
        setNewCandidateName('');
        setNewCandidateRole('');
        fetchGlobalElectionData(); 
        toast.success('Candidate permanently added!');
      }
    } catch (error) {
      toast.error('Failed to add candidate');
    }
  };

  const handleRemoveCandidate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGlobalElectionData(); 
        toast.success('Candidate permanently removed');
      }
    } catch (error) {
      toast.error('Failed to remove candidate');
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle><Lock className="inline w-5 h-5 mr-2" /> Admin Login</DialogTitle>
            <DialogDescription>
              Access restricted to election administrators. Enter password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
            />
            <Button onClick={handleLogin} className="w-full">Authenticate</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      {/* Header */}
      <header className="relative border-b bg-background/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
            <Logo />
          </div>
          <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
            <Button variant={activeTab === 'dashboard' ? 'default' : 'ghost'} onClick={() => setActiveTab('dashboard')} size="sm" className="gap-2">
              <LayoutDashboard className="w-4 h-4"/> Dashboard
            </Button>
            <Button variant={activeTab === 'campaign' ? 'default' : 'ghost'} onClick={() => setActiveTab('campaign')} size="sm" className="gap-2">
              <Settings className="w-4 h-4"/> Campaign Setup
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 z-10">
        
        {/* ================= DASHBOARD TAB ================= */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Live Election Dashboard</h1>
                <p className="text-muted-foreground">Global Campaign: <span className="text-primary font-bold">{campaignName}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/verify')}><Shield className="w-4 h-4 mr-2" /> Verify</Button>
                <Button variant="secondary" onClick={() => navigate('/results')}><BarChart3 className="w-4 h-4 mr-2" /> Results</Button>
                <Button variant="destructive" onClick={handleEndElection} disabled={showResults} className="gap-2">
                  <Lock className="w-4 h-4" /> End Election
                </Button>
              </div>
            </div>

            {/* Timer Control */}
            <div className="glass-card p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-primary/30">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Global Election Timer</h3>
                <p className="text-sm text-muted-foreground">Syncs countdown to all voter screens via database.</p>
              </div>
              <div className="flex gap-3">
                <Input type="number" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} className="w-24 text-center" />
                <Button onClick={handleStartTimer}>Start Global Clock</Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-card p-4"><p className="text-sm text-muted-foreground">Registered Voters</p><p className="text-2xl font-bold">{totalVoters}</p></div>
              <div className="glass-card p-4 border-success/50"><p className="text-sm text-muted-foreground text-success">Votes Cast (On-Chain)</p><p className="text-2xl font-bold text-success">{voteCounts.total}</p></div>
              <div className="glass-card p-4"><p className="text-sm text-muted-foreground">Blocks Mined</p><p className="text-2xl font-bold">{blockchainStats.blockHeight}</p></div>
              <div className="glass-card p-4"><p className="text-sm text-muted-foreground">Network Status</p><p className="text-lg font-medium text-success">Healthy ✓</p></div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Blocks className="w-6 h-6 text-primary" /> Live Network Activity</h2>
              <BlockchainVisualizer />
            </div>
          </div>
        )}

        {/* ================= CAMPAIGN SETUP TAB ================= */}
        {activeTab === 'campaign' && (
          <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8">
            
            <div className="glass-card p-6 border-primary/20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5"/> Campaign Lifecycle</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  value={campaignName} 
                  onChange={(e) => setCampaignName(e.target.value)} 
                  placeholder="e.g., Student Council Election 2025" 
                  className="flex-1 text-lg"
                />
                <Button onClick={handleUpdateCampaign} className="gap-2"><Database className="w-4 h-4"/> Update DB Name</Button>
              </div>
            </div>

            <div className="glass-card p-6 border-border">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5"/> Manage Global Candidates</h2>
              
              <div className="flex flex-col md:flex-row gap-4 mb-8 bg-background p-4 rounded-xl border border-border">
                <Input placeholder="Candidate Name" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} className="flex-1"/>
                <Input placeholder="Party / Role" value={newCandidateRole} onChange={(e) => setNewCandidateRole(e.target.value)} className="flex-1"/>
                <Button onClick={handleAddCandidate} className="gap-2 bg-success hover:bg-success/90 text-success-foreground"><Plus className="w-4 h-4"/> Add Candidate</Button>
              </div>

              <div className="space-y-3">
                {candidatesList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No candidates in the database.</p>
                ) : (
                  candidatesList.map((candidate: any) => (
                    <div key={candidate.id} className="flex justify-between items-center p-4 bg-secondary/30 rounded-lg border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.role} • ID: {candidate.id}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/20" onClick={() => handleRemoveCandidate(candidate.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}