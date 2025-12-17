import { LoginButton } from "@/components/auth/LoginButton";
import { Button } from "@/components/ui/button";
import logo from "/CodeCell Logo White.png";

export function LandingPage() {
  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      {/* Scan line overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)',
        }}
      ></div>

      {/* Top navigation bar */}
      <div className="flex justify-between items-start p-4 md:p-8 relative z-10">
        {/* Left menu */}
        <div className="space-y-1 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neon-red">[01]</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">MARKETS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-red">[02]</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">LEADERBOARD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-red">[03]</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">HOW IT WORKS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-red">[04]</span>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">ABOUT</span>
          </div>
        </div>

        {/* Right CTA button */}
        <div className="scale-110">
          <LoginButton />
        </div>
      </div>

      {/* Data strip */}
      <div className="flex justify-between items-center px-4 md:px-8 py-2 font-mono text-xs relative z-10">
        <div className="flex items-center gap-4">
          <span className="text-neon-red">予測市場</span>
          <span className="text-neon-red text-[10px]">PN: 2483-AX9</span>
          <span className="text-neon-red text-[10px]">// ACTIVE PROTOCOL</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-[10px]">BATCH: {new Date().toISOString().split('T')[0]}</span>
          <span className="text-muted-foreground text-[10px]">TOK: ¥1000</span>
          <span className="text-neon-red">信頼</span>
        </div>
      </div>

      {/* Giant centered text */}
      <div className="flex-1 flex items-center justify-center relative">
        <h1
          className="text-[10vw] md:text-[12vw] font-display font-black tracking-tighter text-primary select-none leading-none"
          style={{
            textShadow: '0 0 80px rgba(0, 255, 255, 0.6), 0 0 120px rgba(0, 255, 255, 0.4), 0 0 200px rgba(0, 255, 255, 0.2)',
          }}
        >
          SATTACELL
        </h1>
      </div>

      {/* Bottom section */}
      <div className="flex justify-between items-end p-4 md:p-8 relative z-10">
        {/* Left - About text */}
        <div className="max-w-md space-y-2">
          <div className="font-mono text-[10px] text-muted-foreground/50 space-y-0.5">
            <div>A</div>
            <div>BO</div>
            <div>UT</div>
          </div>
          <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
            <span className="text-primary font-semibold">SATTACELL</span> WAS BUILT FOR PREDICTIONS AND TEAMS WHO ARE
            SERIOUS ABOUT <span className="text-neon-red">WINNING BIG</span> – TRADE ON REAL-WORLD OUTCOMES
          </p>
        </div>

        {/* Right - Japanese text */}
        <div className="font-mono text-xs text-muted-foreground text-right">
          <div>私たちがしていること</div>
        </div>
      </div>
    </div>
  );
}
