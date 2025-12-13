import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts";
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Users, 
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  Target,
  DollarSign,
  Zap,
  Layers,
  UserCheck
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function MarketCharts({ analytics, outcomes }) {
  const [expandedCharts, setExpandedCharts] = useState({
    positionHolders: false,
    topTradersByVolume: false,
    topHoldersByOutcome: false,
    concentration: false,
    traderActivity: false,
    recentActivityByHolders: false,
    probVolumeScatter: false,
    cumulativeVolume: false,
    outcomePositions: false,
    buySellRatio: false,
  });

  const toggleChart = (chartName) => {
    setExpandedCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName],
    }));
  };

  if (!analytics) return null;

  return (
    <div className="space-y-4">
      {/* 1. Top Position Holders - Most Important */}
      {analytics.topHolders && analytics.topHolders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Top Position Holders</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('positionHolders')}
                className="flex items-center gap-2"
              >
                {expandedCharts.positionHolders ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Users with most shares (sorted by total holdings)</CardDescription>
          </CardHeader>
          {expandedCharts.positionHolders && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topHolders} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalShares" fill="#0088FE" name="Total Shares" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 2. Top Traders by Volume - People Names */}
      {analytics.topTradersByVolume && analytics.topTradersByVolume.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle>Top Traders by Volume</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('topTradersByVolume')}
                className="flex items-center gap-2"
              >
                {expandedCharts.topTradersByVolume ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Traders ranked by total trading volume (tokens)</CardDescription>
          </CardHeader>
          {expandedCharts.topTradersByVolume && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topTradersByVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `${parseFloat(value).toFixed(2)} tokens`} />
                  <Legend />
                  <Bar dataKey="volume" fill="#00C49F" name="Volume (tokens)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 3. Top Holders by Outcome - People Names per Outcome */}
      {analytics.topHoldersByOutcome && Object.keys(analytics.topHoldersByOutcome).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <CardTitle>Top Holders by Outcome</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('topHoldersByOutcome')}
                className="flex items-center gap-2"
              >
                {expandedCharts.topHoldersByOutcome ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Who holds the most shares of each outcome</CardDescription>
          </CardHeader>
          {expandedCharts.topHoldersByOutcome && (
            <CardContent className="space-y-6">
              {Object.entries(analytics.topHoldersByOutcome).map(([outcome, holders]) => (
                <div key={outcome}>
                  <h4 className="font-semibold mb-3 text-sm">{outcome}</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={holders} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="shares" fill="#FFBB28" name="Shares" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* 4. Position Concentration - People Names */}
      {analytics.concentrationData && analytics.concentrationData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Position Concentration</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('concentration')}
                className="flex items-center gap-2"
              >
                {expandedCharts.concentration ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Cumulative percentage of shares held by top holders</CardDescription>
          </CardHeader>
          {expandedCharts.concentration && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.concentrationData}>
                  <defs>
                    <linearGradient id="colorConcentration" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorConcentration)"
                    name="Cumulative %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="shares" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name="Shares"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 5. Most Active Traders - People Names */}
      {analytics.topTraders && analytics.topTraders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>Most Active Traders</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('traderActivity')}
                className="flex items-center gap-2"
              >
                {expandedCharts.traderActivity ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Users ranked by number of trades</CardDescription>
          </CardHeader>
          {expandedCharts.traderActivity && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topTraders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tradeCount" fill="#10b981" name="Number of Trades" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 6. Recent Activity by Top Holders - People Names */}
      {analytics.recentActivityByHolders && analytics.recentActivityByHolders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity by Top Holders</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('recentActivityByHolders')}
                className="flex items-center gap-2"
              >
                {expandedCharts.recentActivityByHolders ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Recent trading activity from top position holders</CardDescription>
          </CardHeader>
          {expandedCharts.recentActivityByHolders && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.recentActivityByHolders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="holder" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${parseFloat(value).toFixed(2)} tokens`,
                      props.payload.outcome
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="volume" fill="#FF8042" name="Trade Volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 7. Probability vs Volume Scatter Plot */}
      {analytics.probVolumeData && analytics.probVolumeData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>Probability vs Volume</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('probVolumeScatter')}
                className="flex items-center gap-2"
              >
                {expandedCharts.probVolumeScatter ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Relationship between outcome probability and trading volume</CardDescription>
          </CardHeader>
          {expandedCharts.probVolumeScatter && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="probability" 
                    name="Probability" 
                    unit="%"
                    label={{ value: 'Probability (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="volume" 
                    name="Volume" 
                    unit=" tokens"
                    label={{ value: 'Volume (tokens)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p>Probability: {data.probability}%</p>
                            <p>Volume: {data.volume.toFixed(2)} tokens</p>
                            <p>Shares: {data.shares.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={analytics.probVolumeData} 
                    fill="#8884d8"
                    name="Outcomes"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 8. Cumulative Trading Volume */}
      {analytics.cumulativeData && analytics.cumulativeData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Cumulative Trading Volume</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('cumulativeVolume')}
                className="flex items-center gap-2"
              >
                {expandedCharts.cumulativeVolume ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Area chart showing cumulative volume over recent trades</CardDescription>
          </CardHeader>
          {expandedCharts.cumulativeVolume && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.cumulativeData}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorCumulative)"
                    name="Cumulative Volume"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name="Trade Volume"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 9. Buy vs Sell by Outcome */}
      {analytics.outcomePositions && analytics.outcomePositions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Buy vs Sell by Outcome</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('outcomePositions')}
                className="flex items-center gap-2"
              >
                {expandedCharts.outcomePositions ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Stacked bar chart showing buy and sell activity per outcome</CardDescription>
          </CardHeader>
          {expandedCharts.outcomePositions && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.outcomePositions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="buys" stackId="a" fill="#10b981" name="Buys" />
                  <Bar dataKey="sells" stackId="a" fill="#ef4444" name="Sells" />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name="Net (Buys - Sells)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* 10. Buy/Sell Ratio Pie Chart */}
      {analytics.buySellData && analytics.buySellData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                <CardTitle>Buy vs Sell Ratio (24h)</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleChart('buySellRatio')}
                className="flex items-center gap-2"
              >
                {expandedCharts.buySellRatio ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
            <CardDescription>Recent trading activity breakdown</CardDescription>
          </CardHeader>
          {expandedCharts.buySellRatio && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.buySellData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.buySellData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
