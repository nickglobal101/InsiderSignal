import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SocialBuzz } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/MetricCard";
import { ClickableTicker } from "@/components/ClickableTicker";
import { TrendingUp, TrendingDown, Minus, MessageSquare, ThumbsUp, Users, Flame } from "lucide-react";
import { SocialBuzzDetailDialog } from "@/components/SocialBuzzDetailDialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SocialBuzzPage() {
  const [selectedBuzz, setSelectedBuzz] = useState<SocialBuzz | null>(null);
  
  const { data: buzzData, isLoading } = useQuery<SocialBuzz[]>({
    queryKey: ["/api/social-buzz"],
  });

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return (
          <Badge 
            className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
            data-testid="badge-sentiment-bullish"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Bullish
          </Badge>
        );
      case "bearish":
        return (
          <Badge 
            className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
            data-testid="badge-sentiment-bearish"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            Bearish
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="secondary"
            data-testid="badge-sentiment-neutral"
          >
            <Minus className="h-3 w-3 mr-1" />
            Neutral
          </Badge>
        );
    }
  };

  const getMentionsChangeBadge = (change: number) => {
    if (change > 0) {
      return (
        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
          +{change}%
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="text-red-600 dark:text-red-400 text-sm font-medium">
          {change}%
        </span>
      );
    }
    return <span className="text-muted-foreground text-sm">0%</span>;
  };

  // Calculate metrics
  const totalMentions = buzzData?.reduce((sum, b) => sum + b.mentions, 0) || 0;
  const totalUpvotes = buzzData?.reduce((sum, b) => sum + b.upvotes, 0) || 0;
  const bullishCount = buzzData?.filter(b => b.sentiment === "bullish").length || 0;
  const bearishCount = buzzData?.filter(b => b.sentiment === "bearish").length || 0;
  const stocksTracked = buzzData?.length || 0;

  // Top 10 mentions for chart
  const chartData = buzzData?.slice(0, 10).map(b => ({
    ticker: b.ticker,
    mentions: b.mentions,
    upvotes: b.upvotes
  })) || [];

  return (
    <div className="space-y-8" data-testid="social-buzz-page">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          Social Buzz
        </h1>
        <p className="text-muted-foreground mt-1">
          Trending stocks from Reddit communities (r/wallstreetbets, r/stocks, r/investing)
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
              label="Stocks Tracked"
              value={stocksTracked.toString()}
              icon={Users}
            />
            <MetricCard
              label="Total Mentions"
              value={totalMentions.toLocaleString()}
              icon={MessageSquare}
            />
            <MetricCard
              label="Bullish Sentiment"
              value={bullishCount.toString()}
              change={bullishCount > bearishCount ? 15 : -10}
              changeLabel="vs bearish"
              icon={TrendingUp}
            />
            <MetricCard
              label="Total Upvotes"
              value={totalUpvotes.toLocaleString()}
              icon={Flame}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6" data-testid="card-top-mentions-chart">
              <h3 className="text-xl font-medium mb-6">Top 10 by Mentions</h3>
              <div className="h-64" data-testid="chart-mentions-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis dataKey="ticker" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={45} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="mentions" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Mentions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6" data-testid="card-about-social-buzz">
              <h3 className="text-xl font-medium mb-4">About Social Buzz</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Data is aggregated from popular Reddit communities including r/wallstreetbets,
                r/stocks, and r/investing. Sentiment analysis is AI-powered.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between gap-2 text-sm" data-testid="stat-bullish-count">
                  <span className="text-muted-foreground">Bullish stocks</span>
                  <span className="font-mono text-green-600 dark:text-green-400">{bullishCount}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm" data-testid="stat-bearish-count">
                  <span className="text-muted-foreground">Bearish stocks</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{bearishCount}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm" data-testid="stat-neutral-count">
                  <span className="text-muted-foreground">Neutral stocks</span>
                  <span className="font-mono">{stocksTracked - bullishCount - bearishCount}</span>
                </div>
                <div className="flex justify-between gap-2 text-sm" data-testid="stat-data-source">
                  <span className="text-muted-foreground">Data source</span>
                  <span className="font-mono">ApeWisdom API</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buzzData?.map((buzz) => (
              <Card 
                key={buzz.id} 
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedBuzz(buzz)}
                data-testid={`card-buzz-${buzz.ticker}`}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">#{buzz.rank}</span>
                    <CardTitle className="text-lg font-semibold">
                      <ClickableTicker ticker={buzz.ticker} />
                    </CardTitle>
                  </div>
                  {getSentimentBadge(buzz.sentiment)}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground truncate" title={buzz.name}>
                    {buzz.name}
                  </p>
                  
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm" data-testid={`text-mentions-${buzz.ticker}`}>
                        {buzz.mentions.toLocaleString()}
                      </span>
                      {getMentionsChangeBadge(buzz.mentionsChange)}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm" data-testid={`text-upvotes-${buzz.ticker}`}>
                        {buzz.upvotes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Sentiment Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            buzz.sentimentScore >= 65 
                              ? 'bg-green-500 dark:bg-green-600' 
                              : buzz.sentimentScore <= 35 
                                ? 'bg-red-500 dark:bg-red-600' 
                                : 'bg-yellow-500 dark:bg-yellow-600'
                          }`}
                          style={{ width: `${buzz.sentimentScore}%` }}
                          data-testid={`sentiment-bar-${buzz.ticker}`}
                        />
                      </div>
                      <span className="text-xs font-mono" data-testid={`sentiment-score-${buzz.ticker}`}>{buzz.sentimentScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {buzzData?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No social buzz data available. Click refresh to fetch latest data.
                </p>
              </CardContent>
            </Card>
          )}

          <SocialBuzzDetailDialog
            buzz={selectedBuzz}
            open={!!selectedBuzz}
            onClose={() => setSelectedBuzz(null)}
          />
        </>
      )}
    </div>
  );
}
