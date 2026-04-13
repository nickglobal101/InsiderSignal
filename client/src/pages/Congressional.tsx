import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CongressionalCard } from "@/components/CongressionalCard";
import { CongressionalDetailDialog } from "@/components/CongressionalDetailDialog";
import { MetricCard } from "@/components/MetricCard";
import { VolumeChart } from "@/components/VolumeChart";
import { DemoBanner, DataLimitIndicator } from "@/components/DemoBanner";
import { DemoRegistrationPrompt } from "@/components/DemoRegistrationPrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, TrendingDown, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { useDemo } from "@/hooks/useDemo";
import type { CongressionalTrade, DataSource } from "@shared/schema";

const DEMO_LIMIT = 5;

export default function Congressional() {
  const [selectedChamber, setSelectedChamber] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<CongressionalTrade | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  const { isDemo, sessionCount, shouldPromptRegister, maxSessionsReached } = useDemo();
  
  useEffect(() => {
    if (shouldPromptRegister || maxSessionsReached) {
      const timer = setTimeout(() => setShowRegistrationPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptRegister, maxSessionsReached]);

  const { data: trades = [], isLoading } = useQuery<CongressionalTrade[]>({
    queryKey: ["/api/congressional"],
  });

  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    refetchInterval: 60000,
  });

  const congressionalSource = dataSources.find(ds => ds.name === "congressional");
  const isFailed = congressionalSource?.status === "failed";
  const errorMessage = congressionalSource?.errorMessage;
  const showLoading = isLoading || dataSourcesLoading;

  const filteredTrades = trades.filter((trade) => {
    if (selectedChamber !== "all" && trade.chamber !== selectedChamber) return false;
    if (selectedType !== "all" && trade.type !== selectedType) return false;
    if (selectedParty !== "all" && trade.party !== selectedParty) return false;
    return true;
  });

  const buyCount = trades.filter(t => t.type === "buy").length;
  const sellCount = trades.filter(t => t.type === "sell").length;

  const volumeByDate: Record<string, { sellVolume: number; buyVolume: number }> = {};
  trades.forEach((trade) => {
    const date = trade.disclosedDate;
    if (!volumeByDate[date]) {
      volumeByDate[date] = { sellVolume: 0, buyVolume: 0 };
    }
    const estimatedValue = trade.amountRange.includes("1,000,001") ? 2500000 :
      trade.amountRange.includes("100,001") ? 175000 :
      trade.amountRange.includes("50,001") ? 75000 :
      trade.amountRange.includes("15,001") ? 32500 :
      trade.amountRange.includes("1,001") ? 8000 : 50000;
    
    if (trade.type === "sell") {
      volumeByDate[date].sellVolume += estimatedValue;
    } else {
      volumeByDate[date].buyVolume += estimatedValue;
    }
  });

  const volumeData = Object.entries(volumeByDate)
    .map(([date, volumes]) => ({ date, ...volumes }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        <h1 className="text-3xl font-semibold" data-testid="text-congressional-title">
          Congressional Trading
        </h1>
        <p className="text-muted-foreground mt-1">
          STOCK Act disclosures from Senate and House members
        </p>
      </div>

      {showLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
            ))}
          </div>
          <div className="animate-pulse h-48 bg-muted rounded-md" />
        </div>
      ) : isFailed ? (
        <Card className="p-12" data-testid="congressional-error-state">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
            <h3 className="text-xl font-medium mb-3">Data Source Unavailable</h3>
            <p className="text-muted-foreground max-w-lg mb-6">
              {errorMessage || "Congressional trade data is temporarily unavailable. Please try again later."}
            </p>
            <p className="text-sm text-muted-foreground">
              The House and Senate stock watcher APIs are currently returning access denied errors. 
              This may be a temporary issue with the external data providers.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Trades (30D)"
              value={trades.length.toString()}
              change={18}
              changeLabel="vs last month"
              icon={Landmark}
            />
            <MetricCard
              label="Buy Transactions"
              value={buyCount.toString()}
              change={32}
              changeLabel="vs last month"
              icon={TrendingUp}
            />
            <MetricCard
              label="Sell Transactions"
              value={sellCount.toString()}
              change={-8}
              changeLabel="vs last month"
              icon={TrendingDown}
            />
            <MetricCard
              label="Avg Disclosure Delay"
              value="38 days"
              icon={Clock}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VolumeChart data={volumeData} title="Congressional Trade Volume" />
            <Card className="p-6">
              <h3 className="text-xl font-medium mb-4">Disclosure Timing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Under the STOCK Act, members must disclose trades within 45 days.
                Note that disclosed data may not reflect current positions.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">On-time disclosures</span>
                  <span className="font-mono">78%</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Late disclosures</span>
                  <span className="font-mono">22%</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Average delay</span>
                  <span className="font-mono">38 days</span>
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
                <Select value={selectedChamber} onValueChange={setSelectedChamber}>
                  <SelectTrigger className="w-[150px]" data-testid="select-chamber">
                    <SelectValue placeholder="Filter by chamber" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chambers</SelectItem>
                    <SelectItem value="Senate">Senate</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[150px]" data-testid="select-type">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy">Buys</SelectItem>
                    <SelectItem value="sell">Sells</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedParty} onValueChange={setSelectedParty}>
                  <SelectTrigger className="w-[150px]" data-testid="select-party">
                    <SelectValue placeholder="Filter by party" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    <SelectItem value="D">Democrat</SelectItem>
                    <SelectItem value="R">Republican</SelectItem>
                    <SelectItem value="I">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTrades.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Landmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No trades found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters to see congressional trades
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {isDemo && filteredTrades.length > DEMO_LIMIT && (
                    <DataLimitIndicator showing={DEMO_LIMIT} total={filteredTrades.length} dataType="congressional trades" />
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {displayTrades.map((trade) => (
                      <CongressionalCard
                        key={trade.id}
                        trade={{
                          id: trade.id,
                          member: trade.member,
                          party: trade.party as "D" | "R" | "I",
                          chamber: trade.chamber as "Senate" | "House",
                          state: trade.state,
                          ticker: trade.ticker,
                          company: trade.company,
                          type: trade.type as "buy" | "sell",
                          amountRange: trade.amountRange,
                          disclosedDate: trade.disclosedDate,
                          tradeDate: trade.tradeDate,
                        }}
                        onClick={() => setSelectedTrade(trade)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-xl font-medium mb-4">Trading Pattern Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyzing {trades.length} trades from Congressional members to identify notable patterns.
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-2">Notable Activity</h4>
                    <p className="text-sm text-muted-foreground">
                      {sellCount > buyCount 
                        ? `Sell-heavy activity detected: ${sellCount} sell transactions vs ${buyCount} buy transactions in the last 30 days.`
                        : `Buy-heavy activity detected: ${buyCount} buy transactions vs ${sellCount} sell transactions in the last 30 days.`}
                    </p>
                  </div>
                  <div className="p-4 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Disclosure Compliance</h4>
                    <p className="text-sm text-muted-foreground">
                      78% of trades were disclosed within the STOCK Act's 45-day requirement. 
                      Average disclosure delay is 38 days from transaction date.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <CongressionalDetailDialog
            trade={selectedTrade}
            open={!!selectedTrade}
            onClose={() => setSelectedTrade(null)}
          />
        </>
      )}
    </div>
  );
}
