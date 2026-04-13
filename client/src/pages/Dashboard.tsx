import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { TradeTable } from "@/components/TradeTable";
import { VolumeChart } from "@/components/VolumeChart";
import { AlertCard } from "@/components/AlertCard";
import { TradeDetailModal } from "@/components/TradeDetailModal";
import { CongressionalTradeModal } from "@/components/CongressionalTradeModal";
import { InstitutionalTradeModal } from "@/components/InstitutionalTradeModal";
import { DemoBanner, DataLimitIndicator } from "@/components/DemoBanner";
import { DemoRegistrationPrompt } from "@/components/DemoRegistrationPrompt";
import { TrendingDown, TrendingUp, Users, AlertTriangle, RefreshCw, Building2, Landmark, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useDemo } from "@/hooks/useDemo";
import type { InsiderTrade, Alert, CongressionalTrade, InstitutionalTrade } from "@shared/schema";

interface VolumeData {
  date: string;
  sellVolume: number;
  buyVolume: number;
}

interface Metrics {
  sellSignalsToday: number;
  buySignalsToday: number;
  executivesTracked: number;
  activeAlerts: number;
}

const DEMO_LIMIT = 3;

export default function Dashboard() {
  const [selectedTrade, setSelectedTrade] = useState<InsiderTrade | null>(null);
  const [selectedCongressionalTrade, setSelectedCongressionalTrade] = useState<CongressionalTrade | null>(null);
  const [selectedInstitutionalTrade, setSelectedInstitutionalTrade] = useState<InstitutionalTrade | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  const { isDemo, sessionCount, shouldPromptRegister, maxSessionsReached } = useDemo();
  
  useEffect(() => {
    if (shouldPromptRegister || maxSessionsReached) {
      const timer = setTimeout(() => setShowRegistrationPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptRegister, maxSessionsReached]);

  const { data: trades = [], isLoading: tradesLoading } = useQuery<InsiderTrade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: congressionalTrades = [], isLoading: congressionalLoading } = useQuery<CongressionalTrade[]>({
    queryKey: ["/api/congressional"],
  });

  const { data: institutionalTrades = [], isLoading: institutionalLoading } = useQuery<InstitutionalTrade[]>({
    queryKey: ["/api/institutional/trades"],
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const { data: volumeData = [], isLoading: volumeLoading } = useQuery<VolumeData[]>({
    queryKey: ["/api/volume"],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ["/api/metrics"],
  });

  useEffect(() => {
    if (selectedTrade && !trades.find(t => t.id === selectedTrade.id)) {
      setSelectedTrade(null);
    }
  }, [trades, selectedTrade]);

  useEffect(() => {
    if (selectedCongressionalTrade && !congressionalTrades.find(t => t.id === selectedCongressionalTrade.id)) {
      setSelectedCongressionalTrade(null);
    }
  }, [congressionalTrades, selectedCongressionalTrade]);

  useEffect(() => {
    if (selectedInstitutionalTrade && !institutionalTrades.find(t => t.id === selectedInstitutionalTrade.id)) {
      setSelectedInstitutionalTrade(null);
    }
  }, [institutionalTrades, selectedInstitutionalTrade]);

  const displayLimit = isDemo ? DEMO_LIMIT : 5;
  
  const topInsiderTrades = [...trades]
    .sort((a, b) => b.value - a.value)
    .slice(0, displayLimit);

  const topCongressionalTrades = congressionalTrades
    .slice(0, displayLimit);

  const topInstitutionalTrades = [...institutionalTrades]
    .sort((a, b) => b.value - a.value)
    .slice(0, displayLimit);

  const formatValue = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/refresh"),
    onSuccess: () => {
      setLastRefresh(new Date());
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/volume"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/congressional"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/alerts/${id}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
    },
  });

  const handleDismissAlert = (id: string) => {
    dismissMutation.mutate(id);
  };

  const activeAlerts = alerts.filter((a) => a.dismissed !== 1);

  return (
    <div className="space-y-8">
      {isDemo && <DemoBanner variant="prominent" />}
      
      <DemoRegistrationPrompt 
        open={showRegistrationPrompt} 
        onClose={() => setShowRegistrationPrompt(false)}
        sessionCount={sessionCount}
        maxReached={maxSessionsReached}
      />
      
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track insider trading patterns in real-time
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-refresh-data"
          className="flex-col h-auto py-2"
        >
          <div className="flex items-center">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Refresh Data
          </div>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground" data-testid="text-last-refresh">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sell Signals Today"
          value={metrics?.sellSignalsToday?.toString() || "0"}
          change={-12}
          changeLabel="vs yesterday"
          icon={TrendingDown}
        />
        <MetricCard
          label="Buy Signals Today"
          value={metrics?.buySignalsToday?.toString() || "0"}
          change={25}
          changeLabel="vs yesterday"
          icon={TrendingUp}
        />
        <MetricCard
          label="Executives Tracked"
          value={trades.length > 0 ? new Set(trades.map(t => t.executive)).size.toString() : "0"}
          icon={Users}
        />
        <MetricCard
          label="Active Alerts"
          value={activeAlerts.length.toString()}
          change={activeAlerts.length > 0 ? -50 : 0}
          changeLabel="from last week"
          icon={AlertTriangle}
        />
      </div>

      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Active Alerts</h2>
          {alertsLoading ? (
            <div className="animate-pulse h-24 bg-muted rounded-md" />
          ) : (
            activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={{
                  id: alert.id,
                  type: alert.type as "cluster_sell" | "unusual_volume" | "coordinated" | "congressional_conflict",
                  severity: alert.severity as "high" | "medium" | "low",
                  headline: alert.headline,
                  description: alert.description,
                  tickers: alert.tickers,
                  timestamp: alert.timestamp,
                  confidence: alert.confidence || undefined,
                  proof: alert.proof || undefined,
                }}
                onDismiss={handleDismissAlert}
                onViewDetails={(a) => console.log("View alert:", a)}
              />
            ))
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Top Insider Trades</CardTitle>
            </div>
            <Link href="/insider-trades">
              <Button variant="ghost" size="sm" data-testid="link-view-all-insider">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {tradesLoading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-md" />)}
              </div>
            ) : topInsiderTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No insider trades found</p>
            ) : (
              <>
                {topInsiderTrades.map(trade => (
                  <div 
                    key={trade.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                    onClick={() => setSelectedTrade(trade)}
                    data-testid={`insider-trade-${trade.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{trade.ticker}</span>
                        <Badge variant={trade.type === "buy" ? "default" : "destructive"} className="text-xs">
                          {trade.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{trade.executive}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatValue(trade.value)}</p>
                      <p className="text-xs text-muted-foreground">{trade.date}</p>
                    </div>
                  </div>
                ))}
                {isDemo && trades.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={trades.length} dataType="insider trades" />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Top Congressional</CardTitle>
            </div>
            <Link href="/congressional">
              <Button variant="ghost" size="sm" data-testid="link-view-all-congressional">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {congressionalLoading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-md" />)}
              </div>
            ) : topCongressionalTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No congressional trades found</p>
            ) : (
              <>
                {topCongressionalTrades.map(trade => (
                  <div 
                    key={trade.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                    onClick={() => setSelectedCongressionalTrade(trade)}
                    data-testid={`congressional-trade-${trade.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{trade.ticker}</span>
                        <Badge variant={trade.type === "buy" ? "default" : "destructive"} className="text-xs">
                          {trade.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {trade.party}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{trade.member}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{trade.amountRange}</p>
                      <p className="text-xs text-muted-foreground">{trade.tradeDate}</p>
                    </div>
                  </div>
                ))}
                {isDemo && congressionalTrades.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={congressionalTrades.length} dataType="congressional trades" />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Top Institutional</CardTitle>
            </div>
            <Link href="/institutional">
              <Button variant="ghost" size="sm" data-testid="link-view-all-institutional">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {institutionalLoading ? (
              <div className="animate-pulse space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-md" />)}
              </div>
            ) : topInstitutionalTrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No institutional trades found</p>
            ) : (
              <>
                {topInstitutionalTrades.map(trade => (
                  <div 
                    key={trade.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer"
                    onClick={() => setSelectedInstitutionalTrade(trade)}
                    data-testid={`institutional-trade-${trade.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{trade.ticker}</span>
                        <Badge variant={trade.type === "buy" || trade.type === "new_position" ? "default" : "destructive"} className="text-xs">
                          {trade.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        {trade.significance === "high" && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">HIGH</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{trade.fundName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatValue(trade.value)}</p>
                      <p className="text-xs text-muted-foreground">{trade.reportDate}</p>
                    </div>
                  </div>
                ))}
                {isDemo && institutionalTrades.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={institutionalTrades.length} dataType="institutional trades" />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {volumeLoading ? (
          <div className="animate-pulse h-64 bg-muted rounded-md" />
        ) : (
          <VolumeChart data={volumeData} title="Insider Trade Volume" />
        )}
        {tradesLoading ? (
          <div className="animate-pulse h-64 bg-muted rounded-md" />
        ) : (
          <TradeTable
            trades={trades.slice(0, isDemo ? DEMO_LIMIT : 5).map(t => ({
              id: t.id,
              company: t.company,
              ticker: t.ticker,
              executive: t.executive,
              title: t.title,
              type: t.type as "buy" | "sell" | "exercise",
              shares: t.shares,
              value: t.value,
              date: t.date,
              filingUrl: t.filingUrl || "#",
            }))}
            title="Recent Insider Filings"
            onTradeClick={(trade) => {
              const fullTrade = trades.find(t => t.id === trade.id);
              if (fullTrade) setSelectedTrade(fullTrade);
            }}
          />
        )}
      </div>

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

      <CongressionalTradeModal
        trade={selectedCongressionalTrade}
        open={!!selectedCongressionalTrade}
        onClose={() => setSelectedCongressionalTrade(null)}
      />

      <InstitutionalTradeModal
        trade={selectedInstitutionalTrade}
        open={!!selectedInstitutionalTrade}
        onClose={() => setSelectedInstitutionalTrade(null)}
      />
    </div>
  );
}
