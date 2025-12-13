import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-primary/10",
                className
            )}
            {...props}
        />
    );
}

function SkeletonCard({ className }) {
    return (
        <div className={cn("rounded-lg border border-primary/30 bg-card/80 p-6", className)}>
            <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        </div>
    );
}

function SkeletonMarketCard() {
    return (
        <div className="rounded-lg border border-primary/30 bg-card/80 p-6 space-y-4">
            <div className="flex items-start justify-between">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-16 rounded-sm" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        </div>
    );
}

function SkeletonChart({ height = 200 }) {
    return (
        <div
            className="rounded-lg border border-primary/30 bg-card/80 p-6 flex items-center justify-center"
            style={{ height }}
        >
            <div className="text-center space-y-3">
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
            </div>
        </div>
    );
}

function SkeletonProbabilities() {
    return (
        <div className="space-y-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-2 w-32 rounded-full" />
                        <Skeleton className="h-4 w-14" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SkeletonTradePanel() {
    return (
        <div className="rounded-lg border border-primary/30 bg-card/80 p-6 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-40" />
            <div className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export {
    Skeleton,
    SkeletonCard,
    SkeletonMarketCard,
    SkeletonChart,
    SkeletonProbabilities,
    SkeletonTradePanel
};
