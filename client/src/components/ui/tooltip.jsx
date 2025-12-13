import * as React from "react";
import { cn } from "@/lib/utils";

const Tooltip = React.forwardRef(({ 
  children, 
  content, 
  className,
  side = "top",
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const tooltipRef = React.useRef(null);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      
      // Use requestAnimationFrame to ensure DOM is updated and measurements are accurate
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const padding = 8;
        
        if (side === "top" || side === "bottom") {
          // Calculate where center of tooltip would be (in viewport coordinates)
          const containerCenterX = rect.left + (rect.width / 2);
          const tooltipHalfWidth = tooltipRect.width / 2;
          const tooltipLeftEdge = containerCenterX - tooltipHalfWidth;
          const tooltipRightEdge = containerCenterX + tooltipHalfWidth;
          
          // Reset positioning
          tooltip.style.left = '';
          tooltip.style.right = '';
          tooltip.style.transform = '';
          
          // Check for left overflow
          if (tooltipLeftEdge < padding) {
            // Position tooltip with left edge at padding
            const leftOffset = padding - rect.left;
            tooltip.style.left = `${leftOffset}px`;
            tooltip.style.transform = 'none';
          }
          // Check for right overflow
          else if (tooltipRightEdge > viewportWidth - padding) {
            // Position tooltip with right edge at viewport - padding
            const rightOffset = viewportWidth - padding - rect.right;
            tooltip.style.right = `${rightOffset}px`;
            tooltip.style.left = 'auto';
            tooltip.style.transform = 'none';
          }
          // Center normally (default CSS handles this)
        }
        
        // Always ensure tooltip doesn't exceed viewport width
        const maxWidth = Math.min(280, viewportWidth - (padding * 2));
        tooltip.style.maxWidth = `${maxWidth}px`;
      });
    }
  }, [isVisible, side]);

  const sideClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 w-56 max-w-[min(calc(100vw-16px),280px)] p-2.5 bg-popover border border-primary/30 rounded-lg shadow-lg",
            "text-xs text-popover-foreground font-mono break-words overflow-wrap-anywhere",
            "left-1/2 -translate-x-1/2",
            sideClasses[side],
            className
          )}
          style={{
            animation: "fadeIn 0.2s ease-out",
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-popover border-r border-b border-primary/30",
              side === "top" && "top-full left-1/2 -translate-x-1/2 rotate-45 -mt-1",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 rotate-45 -mb-1",
              side === "left" && "left-full top-1/2 -translate-y-1/2 rotate-45 -ml-1",
              side === "right" && "right-full top-1/2 -translate-y-1/2 rotate-45 -mr-1"
            )}
          />
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

Tooltip.displayName = "Tooltip";

export { Tooltip };

