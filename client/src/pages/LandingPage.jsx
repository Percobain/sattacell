import { LoginButton } from "@/components/auth/LoginButton";
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";

export function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center space-y-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 space-y-6 max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-500"></div>
            <img
              src={logo}
              alt="SattaCell Logo"
              className="h-32 w-32 md:h-40 md:w-40 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              style={{ filter: 'brightness(0) saturate(100%) invert(78%) sepia(85%) saturate(1000%) hue-rotate(150deg) brightness(101%) contrast(101%)' }}
            />
          </div>
        </div>

        <h1 className="text-4xl md:text-7xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-neon-purple to-neon-red text-glow-blue animate-pulse">
          SATTACELL
        </h1>

        <div className="space-y-4">
          <p className="text-xl md:text-2xl font-mono text-muted-foreground">
            // PREDICT. TRADE. <span className="text-neon-green">WIN.</span>
          </p>
          <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
            The next-generation prediction market protocol. 
            Trade on real-world outcomes with instant settlement.
          </p>
        </div>

        <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
          <div className="scale-125">
            <LoginButton />
          </div>
        </div>

        {/* Stats / Trust Badges */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs font-mono text-muted-foreground/50 border-t border-primary/10 mt-12">
          <div className="space-y-1">
            <div className="text-primary text-xl">ZERO</div>
            <div>FEES</div>
          </div>
          <div className="space-y-1">
            <div className="text-neon-purple text-xl">INSTANT</div>
            <div>SETTLEMENT</div>
          </div>
          <div className="space-y-1">
            <div className="text-neon-red text-xl">SECURE</div>
            <div>PROTOCOL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
