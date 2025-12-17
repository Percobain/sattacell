import { useState, useEffect, useRef } from "react";
import { History, X } from "lucide-react";
import { TradeHistory } from "./TradeHistory";

// Draggable floating button that opens a realtime trade history panel.
export function FloatingHistoryButton({ marketId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ offsetX: 0, offsetY: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef(null);

  // Restore last position for this page from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("floating_history_btn_pos");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist position
  useEffect(() => {
    try {
      localStorage.setItem("floating_history_btn_pos", JSON.stringify(position));
    } catch {
      // ignore
    }
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !buttonRef.current) return;

      e.preventDefault();

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const width = buttonRect.width;
      const height = buttonRect.height;

      let newX = e.clientX - dragStart.offsetX;
      let newY = e.clientY - dragStart.offsetY;

      const maxX = window.innerWidth - width - 8;
      const maxY = window.innerHeight - height - 8;

      newX = Math.min(Math.max(8, newX), maxX);
      newY = Math.min(Math.max(64, newY), maxY); // keep away from top nav

      setPosition({ x: newX, y: newY });
      setHasMoved(true);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDragStart({
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setHasMoved(false);
    setIsDragging(true);
  };

  const handleClick = () => {
    // If the last interaction was a drag, don't toggle panel
    if (hasMoved) {
      setHasMoved(false);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="fixed z-40 flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg border border-primary/40 cursor-move hover:scale-110 hover:shadow-xl transition-transform duration-150"
        style={{
          left: position.x,
          top: position.y,
        }}
        aria-label="Toggle market history"
      >
        <History className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute right-4 bottom-20 w-full max-w-md pointer-events-auto">
            <div className="border border-primary/40 rounded-xl bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-background/80">
                <span className="text-xs font-mono text-muted-foreground">
                  live trade history
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Close history"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                <TradeHistory marketId={marketId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


