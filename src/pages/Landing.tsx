import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, CheckCircle, Search, UserCheck, BarChart3, Coins, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/voting/Logo';
import { MetaMaskButton } from '@/components/voting/MetaMaskButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Landing() {
  const navigate = useNavigate();
  
  // App State
  const [campaignName, setCampaignName] = useState('Official College Election');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [collegeId, setCollegeId] = useState('');
  const [voterInfo, setVoterInfo] = useState<any>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Sign Up State
  const [regName, setRegName] = useState('');
  const [regIdSuffix, setRegIdSuffix] = useState(''); // Stores the part AFTER "PSCMR"
  const [regDept, setRegDept] = useState('');
  const [regYear, setRegYear] = useState(''); 
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');

  // ✅ Fetch Global Campaign Name from DB
  useEffect(() => {
    fetch("http://localhost:5000/api/campaign")
      .then(res => res.json())
      .then(data => {
        if (data.campaign) setCampaignName(data.campaign.name);
      })
      .catch(() => console.log("Using default campaign name"));
  }, []);

  // ===================== SECURE LOGIN LOGIC =====================
  const handleVerifyId = async () => {
    const upperId = collegeId.toUpperCase().trim();
    if (!upperId) return toast.error('Please enter a valid Voter ID');

    setIsLoading(true);
    try {
      // ✅ Fetch decrypted voter info from secure backend
      const response = await fetch(`http://localhost:5000/api/voter/${upperId}`);
      const data = await response.json();
      
      if (data.success && data.voter) {
        setVoterInfo(data.voter);
        setCollegeId(upperId);
        
        toast.success(`Voter Verified: Welcome ${data.voter.name}!`);
        
        // ✅ DEV BYPASS: Instantly verify OTP so the user can skip the Twilio step!
        setIsOtpVerified(true); 

      } else {
        setVoterInfo(null);
        toast.error('Voter ID not found. Please Sign Up first.');
      }
    } catch (error) {
      console.error('Error fetching voter:', error);
      toast.error('Server error. Is your backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (!voterInfo) return toast.error('Please verify your ID first');
    if (!isOtpVerified) return toast.error('Please complete auth steps');

    localStorage.setItem('voteshield_user', voterInfo.voter_id || collegeId);
    toast.success('Authentication successful! Entering portal...');
    navigate('/vote');
  };

  // ===================== SECURE SIGN UP LOGIC =====================
  const handleRegister = async () => {
    const fullVoterId = `PSCMR${regIdSuffix.toUpperCase().trim()}`;

    if (!regName || !regIdSuffix || !regDept || !regYear || !regPhone || !regPin) {
      return toast.error("Please fill in all fields");
    }
    if (regPin.length !== 4) {
      return toast.error("Voting PIN must be exactly 4 digits");
    }

    setIsLoading(true);
    try {
      let formattedPhone = regPhone.replace(/\D/g, ''); 
      if (formattedPhone.length === 10) formattedPhone = `+91${formattedPhone}`;

      // ✅ Send to secure backend for Bcrypt hashing and AES Encryption
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: fullVoterId,
          name: regName,
          department: regDept.toUpperCase(),
          year: parseInt(regYear, 10),
          phoneNumber: formattedPhone,
          pin: regPin 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || "Failed to register");
        setIsLoading(false);
        return;
      }

      toast.success("Registration secure & successful! You can now login.");
      setCollegeId(fullVoterId); 
      setAuthMode('login'); 
      
      // Reset signup form
      setRegName(''); setRegIdSuffix(''); setRegDept(''); setRegYear(''); setRegPhone(''); setRegPin('');

    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error("Network error. Is your backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <Logo />
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" onClick={() => navigate('/verify')} className="text-muted-foreground hover:text-foreground">
            <Shield className="w-4 h-4 mr-2 hidden md:inline-block" /> Verify My Vote
          </Button>
          <Button variant="outline" onClick={() => navigate('/results')} className="border-primary/30 text-primary hover:bg-primary/10">
            <BarChart3 className="w-4 h-4 mr-2" /> Live Results
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 text-center md:text-left fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
              <Coins className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Real Sepolia Blockchain</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
              Welcome to the <br/>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {campaignName}
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto md:mx-0">
              Cast your vote securely using Ethereum Sepolia smart contracts. Your identity remains private, and your vote is mathematically immutable.
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Join thousands of verified voters.</p>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="fade-in-up-delay-2">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-primary/20 shadow-2xl bg-background/50 backdrop-blur-xl max-w-md mx-auto w-full">
              
              {/* Auth Toggle */}
              <div className="flex p-1 bg-secondary/50 rounded-xl mb-8 border border-border">
                <button 
                  onClick={() => setAuthMode('login')} 
                  className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", authMode === 'login' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
                <button 
                  onClick={() => setAuthMode('signup')} 
                  className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", authMode === 'signup' ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  <UserPlus className="w-4 h-4" /> Sign Up
                </button>
              </div>

              {/* ===================== LOGIN TAB ===================== */}
              {authMode === 'login' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">1</span>
                      Verify College ID
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. PSCMR2024001"
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value.toUpperCase())}
                        className="font-mono uppercase bg-muted border-border"
                        disabled={voterInfo !== null}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyId()}
                      />
                      {!voterInfo ? (
                        <Button onClick={handleVerifyId} disabled={isLoading || !collegeId} className="w-24">
                          {isLoading ? '...' : <Search className="w-4 h-4" />}
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => { setVoterInfo(null); setIsOtpVerified(false); }} className="w-24 text-destructive border-destructive/30 hover:bg-destructive/10">
                          Clear
                        </Button>
                      )}
                    </div>
                    {voterInfo && (
                      <p className="text-sm text-success flex items-center gap-1.5 mt-2 animate-in fade-in">
                        <UserCheck className="w-4 h-4" /> Verified: {voterInfo.name} ({voterInfo.department})
                      </p>
                    )}
                  </div>

                  <div className={cn("space-y-3 transition-opacity duration-300", !voterInfo ? "opacity-30 pointer-events-none" : "opacity-100")}>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">2</span>
                      Connect Wallet (Relayer)
                    </label>
                    <MetaMaskButton />
                  </div>

                  <Button onClick={handleLogin} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/25 mt-4 group" disabled={!voterInfo || !isOtpVerified}>
                    Enter Voting Portal
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {/* ===================== SIGN UP TAB ===================== */}
              {authMode === 'signup' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">New Voter Registration</h2>
                    <p className="text-xs text-muted-foreground">Join the secure blockchain registry</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                      <Input placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} disabled={isLoading} />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">College ID</label>
                      <div className="flex">
                        <div className="flex items-center justify-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground font-mono text-sm font-bold">
                          PSCMR
                        </div>
                        <Input 
                          placeholder="2024001" 
                          value={regIdSuffix} 
                          onChange={(e) => setRegIdSuffix(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} 
                          className="font-mono uppercase rounded-l-none" 
                          disabled={isLoading} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Department</label>
                      <Input placeholder="e.g. CSE" value={regDept} onChange={(e) => setRegDept(e.target.value.toUpperCase())} className="uppercase" disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Grad Year</label>
                      <Input placeholder="2026" type="number" value={regYear} onChange={(e) => setRegYear(e.target.value)} disabled={isLoading} />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Mobile Number</label>
                      <Input placeholder="10-digit number" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} disabled={isLoading} />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Create 4-Digit Voting PIN</label>
                      <Input placeholder="****" type="password" maxLength={4} value={regPin} onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))} className="font-mono text-center tracking-widest text-lg" disabled={isLoading} />
                    </div>
                  </div>

                  <Button onClick={handleRegister} className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Voter Profile"}
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground mt-6">
                Protected by AES-256 PII Encryption
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-6 text-sm text-muted-foreground">
        <p>Verified on Ethereum Sepolia Testnet</p>
      </footer>
    </div>
  );
}