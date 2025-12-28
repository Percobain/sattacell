import { useState, useEffect } from "react";
import { MarketList } from "@/components/markets/MarketList";
import { LoginButton } from "@/components/auth/LoginButton";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";
import { api } from "@/services/api";
import { VoteModal } from "@/components/teams/VoteModal";
import { LandingPage } from "@/pages/LandingPage";

export function Home() {
  const { isAuthenticated, userData } = useAuth();
  const [activeView, setActiveView] = useState("markets"); // Default to markets
  
  // Teams State - Restored for Quadratic Voting
  const [teams, setTeams] = useState([]);
  const [myVotes, setMyVotes] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isVotingActive, setIsVotingActive] = useState(true);

  const fetchConfig = async () => {
    try {
      const { config } = await api.get('/admin/config');
      if (config) {
        setIsVotingActive(config.isVotingActive);
      }
    } catch (error) {
       console.error("Error fetching config:", error);
    }
  };

  // Fetch Team Data
  const fetchData = async () => {
    try {
      await fetchConfig(); // Fetch config alongside team data
      const teamsData = await api.get('/teams');
      setTeams(teamsData);
      
      if (userData?.firebaseUID) {
        const votesData = await api.get(`/teams/my-votes?firebaseUID=${userData.firebaseUID}`);
        const votesMap = {};
        votesData.forEach(v => {
           if (v.team && v.team._id) {
             votesMap[v.team._id] = v.count;
           }
        });
        setMyVotes(votesMap);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [userData, isAuthenticated]);

  const handleVoteClick = (team) => {
    setSelectedTeam(team);
    setIsVoteModalOpen(true);
  };

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/30 pb-6 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <img
              src={logo}
              alt="SattaCell Logo"
              className="h-16 w-16 md:h-24 md:w-24 object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(85%) saturate(1000%) hue-rotate(150deg) brightness(101%) contrast(101%)' }}
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-display font-bold text-primary tracking-wider">
              SATTACELL
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neon-red text-xs font-mono">[01]</span>
              <p className="text-muted-foreground font-mono text-xs md:text-sm">
                // PREDICTION_MARKETS
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {isAuthenticated && (
            <>
              <div className="text-xs md:text-sm font-mono border border-primary/30 px-3 py-1.5 md:px-4 md:py-2 bg-card/50">
                <div className="text-primary truncate max-w-[120px] md:max-w-none">{userData?.email}</div>
                <div className="text-neon-green text-xs">
                  ¥ {userData?.balance?.toFixed(2)} <span className="text-muted-foreground">TOKENS</span>
                </div>
              </div>
              <Link to="/dashboard">
                <Button variant="neon" size="sm" className="md:size-default">Dashboard</Button>
              </Link>
            
            </>
          )}
          <Link to="/admin">
            <Button variant="neon-red" size="sm" className="md:size-default">Admin</Button>
          </Link>
          <LoginButton />
        </div>
      </div>

      {/* Data strip - Japanese aesthetic - Hidden on mobile */}
      <div className="hidden md:flex justify-between items-center text-xs font-mono text-muted-foreground border-y border-primary/20 py-2">
        <div className="flex items-center gap-4">
          <span className="text-primary">予測市場</span>
          <span>PN: 2483-AX9</span>
          <span className="text-primary/50">|</span>
          <button
            onClick={() => setActiveView("markets")}
            className={`cursor-pointer hover:text-primary transition-colors ${
              activeView === "markets" ? "text-primary" : ""
            }`}
          >
            ACTIVE PROTOCOL
          </button>
          <span className="text-primary/50">|</span>
          <button
            onClick={() => setActiveView("teams")}
            className={`cursor-pointer hover:text-primary transition-colors ${
              activeView === "teams" ? "text-primary" : ""
            }`}
          >
            TEAMS
          </button>
          <span className="text-primary/50">|</span>
          <Link
             to="/casino"
             className="cursor-pointer hover:text-primary transition-colors"
          >
            CASINO
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span>BATCH: {new Date().toISOString().split('T')[0]}</span>
          <span className="text-primary/50">|</span>
          <span className="text-neon-red">全頼</span>
        </div>
      </div>

      {/* Markets Section */}
      {activeView === "markets" && (
        <>
          {/* Active Markets */}
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="text-neon-red font-mono text-xs md:text-sm">[02]</span>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
                ACTIVE MARKETS
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
              <span className="text-muted-foreground font-mono text-xs hidden md:inline">アクティブマーケット</span>
            </div>
            <MarketList status="open" />
          </div>

          {/* Closed Markets */}
          <div className="mt-8 md:mt-12">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="text-neon-red font-mono text-xs md:text-sm">[03]</span>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
                CLOSED MARKETS
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
              <span className="text-muted-foreground font-mono text-xs hidden md:inline">クローズドマーケット</span>
            </div>
            <MarketList status="settled" />
          </div>
        </>
      )}

      {/* Teams Section */}
      {activeView === "teams" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <span className="text-neon-red font-mono text-xs md:text-sm">[04]</span>
            <h2 className="text-xl md:text-2xl font-display font-semibold text-primary">
              TEAMS
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent hidden md:block"></div>
            <span className="text-muted-foreground font-mono text-xs hidden md:inline">チームの詳細</span>
          </div>

          {!isVotingActive && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 text-center font-bold border border-destructive/20 animate-pulse">
              VOTING HAS ENDED • RESULTS PENDING
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {teams.map((team, index) => {
              const myVoteCount = myVotes[team._id] || 0;
              return (
                <div key={team._id} className="border border-primary/30 bg-card/50 p-4 md:p-5 hover:border-primary/60 hover:glow-blue transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1 pb-2 border-b border-primary/20">
                      <span className="text-neon-green font-mono text-xs">[{String(index + 1).padStart(2, '0')}]</span>
                      <h3 className="text-lg font-display text-primary uppercase">{team.name}</h3>
                    </div>
                    <ul className="space-y-1.5 font-mono text-sm mb-4">
                      {team.members.map((member, i) => (
                        <li key={i} className="text-foreground/90 flex items-center gap-2">
                          <span className="text-primary/50">▸</span> {member}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-primary/10">
                    <div className="flex justify-between items-center mb-3 text-xs font-mono">
                       <span className="text-muted-foreground">Total Votes: <span className="text-primary">{team.voteCount}</span></span>
                       <span className="text-muted-foreground">Your Votes: <span className="text-neon-green">{myVoteCount}</span></span>
                    </div>
                    <Button 
                      variant="neon" 
                      className="w-full h-8 text-xs md:text-sm"
                      onClick={() => handleVoteClick(team)}
                      disabled={!isVotingActive}
                    >
                      {isVotingActive ? "VOTE NOW" : "VOTING ENDED"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {selectedTeam && (
        <VoteModal
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          team={selectedTeam}
          currentVotes={myVotes[selectedTeam._id] || 0}
          onVoteSuccess={fetchData}
        />
      )}
    </div>
  );
}