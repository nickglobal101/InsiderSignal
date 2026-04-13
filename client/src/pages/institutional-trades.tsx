import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InstitutionalDetailDialog } from "@/components/InstitutionalDetailDialog";
import { MetricCard } from "@/components/MetricCard";
import { VolumeChart } from "@/components/VolumeChart";
import { ClickableTicker } from "@/components/ClickableTicker";
import { DemoBanner, DataLimitIndicator } from "@/components/DemoBanner";
import { DemoRegistrationPrompt } from "@/components/DemoRegistrationPrompt";
import { TrendingUp, TrendingDown, Building2, DollarSign, ExternalLink, Users } from "lucide-react";
import type { InstitutionalFund, InstitutionalTrade } from "@shared/schema";
import { useState, useEffect } from "react";
import { useDemo } from "@/hooks/useDemo";

function formatValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatShares(shares: number): string {
  if (shares >= 1e9) return `${(shares / 1e9).toFixed(1)}B`;
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(1)}M`;
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(1)}K`;
  return shares.toString();
}

function FundCard({ fund }: { fund: InstitutionalFund }) {
  return (
    <Card className="hover-elevate" data-testid={`fund-card-${fund.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{fund.name}</h3>
            {fund.manager && (
              <p className="text-xs text-muted-foreground">{fund.manager}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {fund.aum && (
                <Badge variant="secondary" className="text-xs">
                  AUM: ${fund.aum}B
                </Badge>
              )}
              {fund.type && (
                <Badge variant="outline" className="text-xs capitalize">
                  {fund.type.replace("_", " ")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeCard({ trade, onClick }: { trade: InstitutionalTrade; onClick?: () => void }) {
  const isBuy = trade.type === "buy" || trade.type === "new_position";
  const isNewOrExit = trade.type === "new_position" || trade.type === "exit";
  
  return (
    <Card 
      className="hover-elevate cursor-pointer" 
      onClick={onClick}
      data-testid={`trade-card-${trade.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ClickableTicker ticker={trade.ticker} className="font-mono font-bold text-lg" />
              <Badge 
                variant={isBuy ? "default" : "destructive"} 
                className="text-xs"
              >
                {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trade.type === "new_position" ? "New Position" : 
                 trade.type === "exit" ? "Exit" : 
                 trade.type.toUpperCase()}
              </Badge>
              {trade.significance === "high" && (
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                  High Impact
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{trade.company}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3 inline mr-1" />
              {trade.fundName}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-lg">{formatValue(trade.value)}</p>
            <p className="text-sm text-muted-foreground">{formatShares(trade.shares)} shares</p>
            {trade.sharesChange && (
              <p className={`text-xs ${trade.sharesChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {trade.sharesChange > 0 ? "+" : ""}{formatShares(trade.sharesChange)}
                {trade.sharesChangePercent && ` (${trade.sharesChangePercent > 0 ? "+" : ""}${trade.sharesChangePercent.toFixed(1)}%)`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
          <span className="text-xs text-muted-foreground">
            Q{new Date(trade.quarterEnd).getMonth() < 3 ? 1 : new Date(trade.quarterEnd).getMonth() < 6 ? 2 : new Date(trade.quarterEnd).getMonth() < 9 ? 3 : 4} {new Date(trade.quarterEnd).getFullYear()}
          </span>
          {trade.filingUrl && (
            <a 
              href={trade.filingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
              data-testid={`trade-filing-link-${trade.id}`}
            >
              {trade.filingUrl.includes("sec.gov") ? "View Filing" : "View Data Source"} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const DEMO_LIMIT = 5;

export default function InstitutionalTrades() {
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<InstitutionalTrade | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  const { isDemo, sessionCount, shouldPromptRegister, maxSessionsReached } = useDemo();
  
  useEffect(() => {
    if (shouldPromptRegister || maxSessionsReached) {
      const timer = setTimeout(() => setShowRegistrationPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptRegister, maxSessionsReached]);
  
  const { data: funds = [], isLoading: fundsLoading } = useQuery<InstitutionalFund[]>({
    queryKey: ["/api/institutional/funds"],
  });
  
  const { data: trades = [], isLoading: tradesLoading } = useQuery<InstitutionalTrade[]>({
    queryKey: ["/api/institutional/trades"],
  });
  
  const filteredTrades = trades.filter(trade => {
    if (selectedFund !== "all" && trade.fundId !== selectedFund) return false;
    if (selectedType !== "all" && trade.type !== selectedType) return false;
    return true;
  });
  
  const highImpactTrades = filteredTrades.filter(t => t.significance === "high");
  const buyTrades = filteredTrades.filter(t => t.type === "buy" || t.type === "new_position");
  const sellTrades = filteredTrades.filter(t => t.type === "sell" || t.type === "exit");
  
  const totalBuyValue = buyTrades.reduce((sum, t) => sum + t.value, 0);
  const totalSellValue = sellTrades.reduce((sum, t) => sum + t.value, 0);

  // Generate volume data from trades by quarter
  const volumeByQuarter: Record<string, { sellVolume: number; buyVolume: number }> = {};
  filteredTrades.forEach((trade) => {
    const quarter = trade.quarterEnd;
    if (!volumeByQuarter[quarter]) {
      volumeByQuarter[quarter] = { sellVolume: 0, buyVolume: 0 };
    }
    if (trade.type === "sell" || trade.type === "exit") {
      volumeByQuarter[quarter].sellVolume += trade.value;
    } else {
      volumeByQuarter[quarter].buyVolume += trade.value;
    }
  });

  const volumeData = Object.entries(volumeByQuarter)
    .map(([date, volumes]) => ({ date, ...volumes }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const isLoading = fundsLoading || tradesLoading;
  const displayTrades = isDemo ? filteredTrades.slice(0, DEMO_LIMIT) : filteredTrades;

  return (
    <div className="space-y-8" data-testid="institutional-trades-page">
      {isDemo && <DemoBanner variant="prominent" />}
      
      <DemoRegistrationPrompt 
        open={showRegistrationPrompt} 
        onClose={() => setShowRegistrationPrompt(false)}
        sessionCount={sessionCount}
        maxReached={maxSessionsReached}
      />
      
      <div>
        <h1 className="text-3xl font-semibold">Institutional Trades</h1>
        <p className="text-muted-foreground mt-1">
          Track major fund position changes from 13F filings
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
              label="Funds Tracked"
              value={funds.length.toString()}
              icon={Building2}
            />
            <MetricCard
              label="High Impact Trades"
              value={highImpactTrades.length.toString()}
              icon={TrendingUp}
            />
            <MetricCard
              label="Buy Volume"
              value={formatValue(totalBuyValue)}
              change={18}
              changeLabel="vs last quarter"
              icon={TrendingUp}
            />
            <MetricCard
              label="Sell Volume"
              value={formatValue(totalSellValue)}
              change={-12}
              changeLabel="vs last quarter"
              icon={TrendingDown}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VolumeChart data={volumeData} title="Institutional Trade Volume" defaultRange="ALL" />
            <Card className="p-6">
              <h3 className="text-xl font-medium mb-4">13F Filing Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Institutional investors managing $100M+ must file 13F reports quarterly,
                revealing their equity holdings 45 days after quarter end.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">New positions</span>
                  <span className="font-mono">{filteredTrades.filter(t => t.type === "new_position").length}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Full exits</span>
                  <span className="font-mono">{filteredTrades.filter(t => t.type === "exit").length}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Position increases</span>
                  <span className="font-mono">{filteredTrades.filter(t => t.type === "buy").length}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Position decreases</span>
                  <span className="font-mono">{filteredTrades.filter(t => t.type === "sell").length}</span>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="trades" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trades" data-testid="tab-trades">
                Trades ({filteredTrades.length})
              </TabsTrigger>
              <TabsTrigger value="funds" data-testid="tab-funds">
                Funds ({funds.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Select value={selectedFund} onValueChange={setSelectedFund}>
                  <SelectTrigger className="w-[200px]" data-testid="select-fund">
                    <SelectValue placeholder="Filter by fund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {funds.map(fund => (
                      <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
                    ))}
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
                    <SelectItem value="new_position">New Positions</SelectItem>
                    <SelectItem value="exit">Exits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTrades.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No trades found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters to see institutional trades
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {isDemo && filteredTrades.length > DEMO_LIMIT && (
                    <DataLimitIndicator showing={DEMO_LIMIT} total={filteredTrades.length} dataType="institutional trades" />
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {displayTrades.map(trade => (
                      <TradeCard 
                        key={trade.id} 
                        trade={trade} 
                        onClick={() => setSelectedTrade(trade)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="funds" className="space-y-4">
              {funds.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No funds tracked</h3>
                    <p className="text-muted-foreground">
                      Institutional funds will appear here once data is loaded
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {funds.map(fund => (
                    <FundCard key={fund.id} fund={fund} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <InstitutionalDetailDialog
            trade={selectedTrade}
            open={!!selectedTrade}
            onClose={() => setSelectedTrade(null)}
          />
        </>
      )}
    </div>
  );
}
