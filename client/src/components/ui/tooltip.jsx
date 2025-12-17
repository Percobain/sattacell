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

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          ref={ref}
          className={cn(
            "absolute z-50 w-72 max-w-sm p-3 bg-popover border border-primary/30 rounded-lg shadow-lg",
            "text-sm text-popover-foreground font-mono",
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

