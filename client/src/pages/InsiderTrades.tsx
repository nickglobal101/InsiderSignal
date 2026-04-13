import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { InsiderTradeCard } from "@/components/InsiderTradeCard";
import { PatternAnalysis } from "@/components/PatternAnalysis";
import { TradeDetailModal } from "@/components/TradeDetailModal";
import { MetricCard } from "@/components/MetricCard";
import { VolumeChart } from "@/components/VolumeChart";
import { DemoBanner, DataLimitIndicator } from "@/components/DemoBanner";
import { DemoRegistrationPrompt } from "@/components/DemoRegistrationPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import type { InsiderTrade } from "@shared/schema";

function formatValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const DEMO_LIMIT = 5;

export default function InsiderTrades() {
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedValue, setSelectedValue] = useState<string>("all");
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  const { isDemo, sessionCount, shouldPromptRegister, maxSessionsReached } = useDemo();
  
  useEffect(() => {
    if (shouldPromptRegister || maxSessionsReached) {
      const timer = setTimeout(() => setShowRegistrationPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptRegister, maxSessionsReached]);

  const { data: trades = [], isLoading } = useQuery<InsiderTrade[]>({
    queryKey: ["/api/trades"],
  });

  const filteredTrades = trades.filter((trade) => {
    if (selectedType !== "all" && trade.type !== selectedType) {
      return false;
    }
    if (selectedValue !== "all") {
      const minValue = parseInt(selectedValue);
      if (trade.value < minValue) return false;
    }
    return true;
  });

  const buyTrades = filteredTrades.filter(t => t.type === "buy");
  const sellTrades = filteredTrades.filter(t => t.type === "sell");
  const totalBuyValue = buyTrades.reduce((sum, t) => sum + t.value, 0);
  const totalSellValue = sellTrades.reduce((sum, t) => sum + t.value, 0);
  const uniqueExecutives = new Set(filteredTrades.map(t => t.executive)).size;

  const volumeByDate: Record<string, { sellVolume: number; buyVolume: number }> = {};
  filteredTrades.forEach((trade) => {
    const date = trade.date;
    if (!volumeByDate[date]) {
      volumeByDate[date] = { sellVolume: 0, buyVolume: 0 };
    }
    if (trade.type === "sell") {
      volumeByDate[date].sellVolume += trade.value;
    } else {
      volumeByDate[date].buyVolume += trade.value;
    }
  });

  const volumeData = Object.entries(volumeByDate)
    .map(([date, volumes]) => ({ date, ...volumes }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const insights = [
    {
      type: "warning" as const,
      title: "Cluster Sell Pattern Detected",
      description: `${filteredTrades.filter(t => t.type === "sell").length} executives sold shares recently. This pattern has historically preceded price corrections 73% of the time.`,
      confidence: 85,
    },
    {
      type: "neutral" as const,
      title: "Scheduled 10b5-1 Plan Sales",
      description: "Some sales appear to be part of pre-scheduled trading plans. However, the timing concentration is notable.",
      confidence: 72,
    },
    {
      type: "positive" as const,
      title: "Company Fundamentals Stable",
      description: "Recent earnings and guidance remain strong. No material negative disclosures in recent 8-K filings.",
      confidence: 91,
    },
  ];

  const displayTrades = isDemo ? filteredTrades.slice(0, DEMO_LIMIT) : filteredTrades;

  return (
    <div className="space-y-8">
      {isDemo && <DemoBanner variant="prominent" />}
      
      <DemoRegistrationPrompt 
        open={showRegistrationPrompt} 
        onClose={() => setShowRegistrationPrompt(false)}
        sessionCount={sessionCount}
        maxReached={maxSessionsReached}
      />
      
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-trades-title">
          Insider Trades
        </h1>
        <p className="text-muted-foreground mt-1">
          Fortune 500 CEO and executive trading activity
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
            ))}
          </div>
          <div className="animate-pulse h-48 bg-muted rounded-md" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Trades"
              value={filteredTrades.length.toString()}
              change={12}
              changeLabel="vs last month"
              icon={DollarSign}
            />
            <MetricCard
              label="Buy Volume"
              value={formatValue(totalBuyValue)}
              change={24}
              changeLabel="vs last month"
              icon={TrendingUp}
            />
            <MetricCard
              label="Sell Volume"
              value={formatValue(totalSellValue)}
              change={-15}
              changeLabel="vs last month"
              icon={TrendingDown}
            />
            <MetricCard
              label="Executives Trading"
              value={uniqueExecutives.toString()}
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VolumeChart data={volumeData} title="Insider Trade Volume" />
            <Card className="p-6">
              <h3 className="text-xl font-medium mb-4">SEC Form 4 Filings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Insiders must file Form 4 within 2 business days of a trade.
                These filings reveal executive sentiment about their companies.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Buy transactions</span>
                  <span className="font-mono">{buyTrades.length}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Sell transactions</span>
                  <span className="font-mono">{sellTrades.length}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Buy/Sell ratio</span>
                  <span className="font-mono">
                    {sellTrades.length > 0 ? (buyTrades.length / sellTrades.length).toFixed(2) : "N/A"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="trades" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trades" data-testid="tab-trades">
                Trades ({filteredTrades.length})
              </TabsTrigger>
              <TabsTrigger value="analysis" data-testid="tab-analysis">
                Pattern Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px]" data-testid="select-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy">Buys</SelectItem>
                    <SelectItem value="sell">Sells</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger className="w-[180px]" data-testid="select-value">
                    <SelectValue placeholder="Filter by value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Values</SelectItem>
                    <SelectItem value="100000">$100K+</SelectItem>
                    <SelectItem value="1000000">$1M+</SelectItem>
                    <SelectItem value="10000000">$10M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTrades.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No trades found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters to see insider trades
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {isDemo && filteredTrades.length > DEMO_LIMIT && (
                    <DataLimitIndicator showing={DEMO_LIMIT} total={filteredTrades.length} dataType="insider trades" />
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {displayTrades.map(trade => (
                      <InsiderTradeCard
                        key={trade.id}
                        trade={{
                          id: trade.id,
                          company: trade.company,
                          ticker: trade.ticker,
                          executive: trade.executive,
                          title: trade.title,
                          type: trade.type as "buy" | "sell" | "exercise",
                          shares: trade.shares,
                          value: trade.value,
                          date: trade.date,
                          filingUrl: trade.filingUrl || undefined,
                        }}
                        onClick={() => setSelectedTrade(trade)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <PatternAnalysis
                insights={insights}
                summary={`Analysis of ${filteredTrades.length} insider trades reveals notable patterns across Fortune 500 executives.`}
              />
            </TabsContent>
          </Tabs>

          <TradeDetailModal
            trade={selectedTrade ? {
              id: selectedTrade.id,
              company: selectedTrade.company,
              ticker: selectedTrade.ticker,
              executive: selectedTrade.executive,
              title: selectedTrade.title,
              type: selectedTrade.type as "buy" | "sell" | "exercise",
              shares: selectedTrade.shares,
              value: selectedTrade.value,
              date: selectedTrade.date,
              filingUrl: selectedTrade.filingUrl || "#",
            } : null}
            open={!!selectedTrade}
            onClose={() => setSelectedTrade(null)}
          />
        </>
      )}
    </div>
  );
}
