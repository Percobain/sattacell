import { useState, useEffect, useRef } from "react";
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
    '#00ff9f', // green
    '#ff3d00', // red-orange
    '#8b5cf6', // purple
    '#ffd700', // gold
    '#ff1493', // deep pink
    '#32cd32', // lime green
    '#ff4500', // orange red
    '#1e90ff', // dodger blue
    '#ff69b4', // hot pink
    '#00ced1', // dark turquoise
    '#9932cc', // dark orchid
    '#adff2f', // green yellow
    '#dc143c', // crimson
    '#00bfff', // deep sky blue
    '#ff8c00', // dark orange
    '#7b68ee', // medium slate blue
    '#3cb371', // medium sea green
    '#f0e68c', // khaki
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
        const interval = setInterval(fetchHistory, 20000);

        // Listen for trade completed events to refresh the chart
        const handleTradeCompleted = () => {
            fetchHistory();
        };
        window.addEventListener('tradeCompleted', handleTradeCompleted);

        return () => {
            clearInterval(interval);
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
        const cutoff = range === '24h'
            ? now - 24 * 60 * 60 * 1000
            : now - 7 * 24 * 60 * 60 * 1000;
        return data.filter(d => d.timestamp >= cutoff);
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
        fetchHistory();
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 font-mono">{label}</p>
                {payload.map((entry, index) => (
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
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-mono">Current Distribution</span>
                    </div>
                </div>
                <div className="border border-primary/20 rounded-lg p-4 bg-card/50">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
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
                            <Legend
                                wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                                formatter={(value, entry) => (
                                    <span style={{ color: entry.color }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">Probability History</span>
                </div>
                <div className="flex gap-1">
                    {['24h', '7d', 'all'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleTimeRangeChange(range)}
                            className={`px-3 py-1 text-xs font-mono rounded transition-all ${timeRange === range
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
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={historyData}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(187 100% 50% / 0.1)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: 'hsl(200 20% 60%)' }}
                            tickLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            axisLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: 'hsl(200 20% 60%)' }}
                            tickLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            axisLine={{ stroke: 'hsl(187 100% 50% / 0.2)' }}
                            tickFormatter={(value) => `${value.toFixed(0)}%`}
                            padding={{ top: 10, bottom: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
                        {outcomes.map((outcome, idx) => (
                            <Line
                                key={outcome}
                                type="monotone"
                                dataKey={outcome}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, stroke: COLORS[idx % COLORS.length], strokeWidth: 2 }}
                                className="animated-line"
                                style={{ animationDelay: `${idx * 300}ms` }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

