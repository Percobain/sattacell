import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { TrendingUp, Clock } from "lucide-react";

const COLORS = [
    '#00d4ff', // cyan
    '#ff6b35', // orange
    '#00ff9f', // emerald
    '#8b5cf6', // purple
    '#ffd700', // gold
    '#ff1493', // deep pink
    '#1e90ff', // blue
    '#32cd32', // lime
    '#ff4500', // red-orange
    '#9932cc', // violet
    '#ff1744', // bright red
    '#ff69b4', // hot pink
    '#adff2f', // yellow-green
    '#dc143c', // crimson
    '#9c27b0', // deep purple
    '#ff8c00', // dark orange
    '#00acc1', // teal
    '#2e7d32', // dark green
    '#ffc107', // amber
    '#e91e63', // pink
    '#607d8b', // blue-grey
    '#ff6347', // tomato
    '#3f51b5', // indigo
    '#9e9e9e', // grey
    '#795548'  // brown
];

// CSS for line drawing animation
const chartStyles = `
@keyframes drawLine {
  from {
    stroke-dashoffset: 2000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.animated-line {
  stroke-dasharray: 2000;
  stroke-dashoffset: 2000;
  animation: drawLine 2s ease-out forwards;
}
`;

export function ProbabilityChart({ marketId, outcomes }) {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('all');
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = chartStyles;
        document.head.appendChild(styleEl);
        return () => styleEl.remove();
    }, []);

    useEffect(() => {
        fetchHistory();

        // Listen for trade completed events to refresh the chart
        const handleTradeCompleted = () => {
            fetchHistory();
        };
        window.addEventListener('tradeCompleted', handleTradeCompleted);

        return () => {
            window.removeEventListener('tradeCompleted', handleTradeCompleted);
        };
    }, [marketId]);

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/markets/${marketId}/history`);
            const trades = response.history || [];

            if (trades.length === 0) {
                setHistoryData([]);
                setLoading(false);
                return;
            }

            const dataPoints = [];

            if (trades.length > 0) {
                const firstTrade = trades[trades.length - 1];
                dataPoints.push({
                    timestamp: new Date(firstTrade.timestamp).getTime() - 1000,
                    time: formatTime(new Date(firstTrade.timestamp)),
                    ...outcomes.reduce((acc, outcome, idx) => {
                        acc[outcome] = (firstTrade.probabilitiesBefore?.[idx] || 0) * 100;
                        return acc;
                    }, {})
                });
            }

            [...trades].reverse().forEach((trade) => {
                const dataPoint = {
                    timestamp: new Date(trade.timestamp).getTime(),
                    time: formatTime(new Date(trade.timestamp)),
                };
                outcomes.forEach((outcome, idx) => {
                    dataPoint[outcome] = (trade.probabilitiesAfter?.[idx] || 0) * 100;
                });
                dataPoints.push(dataPoint);
            });

            const filteredData = filterByTimeRange(dataPoints, timeRange);
            setHistoryData(filteredData);
            setAnimationKey(prev => prev + 1); // Trigger animation
            setError(null);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffHours < 168) {
            return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filterByTimeRange = (data, range) => {
        if (range === 'all' || data.length === 0) return data;
        const now = Date.now();
        let cutoff;
        switch (range) {
            case '1m':
                cutoff = now - 60 * 1000;
                break;
            case '15m':
                cutoff = now - 15 * 60 * 1000;
                break;
            case '30m':
                cutoff = now - 30 * 60 * 1000;
                break;
            case '1h':
                cutoff = now - 60 * 60 * 1000;
                break;
            case '24h':
                cutoff = now - 24 * 60 * 60 * 1000;
                break;
            case '7d':
                cutoff = now - 7 * 24 * 60 * 60 * 1000;
                break;
            default:
                return data;
        }
        return data.filter(d => d.timestamp >= cutoff);
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        fetchHistory();
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;

        // Sort entries by value (probability) descending so highest "market share" is first
        const sortedPayload = [...payload].sort((a, b) => {
            const aVal = typeof a.value === "number" ? a.value : 0;
            const bVal = typeof b.value === "number" ? b.value : 0;
            return bVal - aVal;
        });

        return (
            <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 font-mono">{label}</p>
                {sortedPayload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="font-mono">{entry.name}:</span>
                        <span className="font-semibold text-primary">{entry.value.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="font-mono text-sm">Failed to load chart</p>
            </div>
        );
    }

    if (historyData.length < 2) {
        // Create pie data from outcomes (equal distribution if no specific probabilities)
        const pieData = outcomes.map((outcome, idx) => ({
            name: outcome,
            value: 100 / outcomes.length, // Equal distribution
            color: COLORS[idx % COLORS.length]
        }));

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-mono">Current Distribution</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {['1m', '15m', '30m', '1h', '24h', '7d', 'all'].map((range) => (
                            <button
                                key={range}
                                onClick={() => handleTimeRangeChange(range)}
                                className={`px-2 py-1 text-xs font-mono rounded transition-all ${timeRange === range
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                                    }`}
                            >
                                {range.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="border border-primary/20 rounded-lg p-4 bg-card/50">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-lg">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: payload[0].payload.color }} />
                                                <span className="font-mono">{payload[0].name}:</span>
                                                <span className="font-semibold text-primary">{payload[0].value.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Custom Legend with proper spacing */}
                    <div className="mt-4 pt-4 border-t border-primary/10">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                    <div 
                                        className="w-3 h-3 rounded-sm shrink-0" 
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span 
                                        className="text-xs font-mono whitespace-nowrap"
                                        style={{ color: entry.color }}
                                    >
                                        {entry.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-mono">Probability History</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {['1m', '15m', '30m', '1h', '24h', '7d', 'all'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeChange(range)}
                            className={`px-2 py-1 text-xs font-mono rounded transition-all ${timeRange === range
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                                }`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border border-primary/20 rounded-lg p-4 bg-card/50" key={animationKey}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historyData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(187 100% 50% / 0.1)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11, fill: 'hsl(200 20% 60%)' }}
                            tickLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            axisLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: 'hsl(200 20% 60%)' }}
                            tickLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            axisLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {outcomes.map((outcome, idx) => (
                            <Line
                                key={outcome}
                                type="monotone"
                                dataKey={outcome}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, stroke: COLORS[idx % COLORS.length], strokeWidth: 2 }}
                                className="animated-line"
                                style={{ animationDelay: `${idx * 300}ms` }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
                {/* Custom Legend with proper spacing */}
                <div className="mt-4 pt-4 border-t border-primary/10">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
                        {outcomes.map((outcome, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-sm shrink-0" 
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                                <span 
                                    className="text-xs font-mono whitespace-nowrap"
                                    style={{ color: COLORS[idx % COLORS.length] }}
                                >
                                    {outcome}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

