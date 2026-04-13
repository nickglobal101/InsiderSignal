import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Sparkles, Lock, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { TradeAiInsight } from "@shared/schema";

interface AIInsightPanelProps {
  tradeType: "insider" | "congressional" | "institutional";
  tradeId: string;
  ticker: string;
  company: string;
  onUpgrade?: () => void;
}

export function AIInsightPanel({ tradeType, tradeId, ticker, company, onUpgrade }: AIInsightPanelProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const isPremium = user?.subscriptionTier === "premium";

  const { data: insight, isLoading, error, refetch } = useQuery<TradeAiInsight>({
    queryKey: ["/api/insights", tradeType, tradeId],
    queryFn: async () => {
      const res = await fetch(`/api/insights/${tradeType}/${tradeId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || "Failed to fetch insight");
      }
      return res.json();
    },
    enabled: isPremium,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  if (!user) {
    return (
      <Card className="border-dashed opacity-75" data-testid="ai-insight-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            AI Trade Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sign in to access AI-powered trade analysis
            </p>
            <Link href="/login">
              <Button size="sm" data-testid="button-login-for-insights">
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isPremium) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5" data-testid="ai-insight-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Trade Insights
            <Badge variant="secondary" className="ml-auto text-xs">Premium</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Unlock AI-Powered Analysis</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Get detailed insights on trade motivations, historical patterns, and contextual analysis for {ticker}
              </p>
            </div>
            <Link href="/membership">
              <Button size="sm" onClick={onUpgrade} data-testid="button-upgrade-for-insights">
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card data-testid="ai-insight-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 animate-pulse" />
            Analyzing Trade...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30" data-testid="ai-insight-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4" />
            AI Trade Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Failed to generate insight. Please try again."}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => refetch()}
            data-testid="button-retry-insight"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return null;
  }

  return (
    <Card className="border-primary/20" data-testid="ai-insight-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            AI Trade Insights
            {insight.confidence && (
              <Badge variant="outline" className="ml-2 text-xs">
                {insight.confidence}% confidence
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-insight"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-insight-analysis">
            {insight.analysis.split("\n\n").map((paragraph, idx) => (
              <p key={idx} className="text-sm text-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {insight.keyPoints && insight.keyPoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Takeaways</h4>
              <ul className="space-y-1.5">
                {insight.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">-</span>
                    <span data-testid={`text-keypoint-${idx}`}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Alert className="bg-muted/50 border-muted">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground" data-testid="text-disclaimer">
              <strong>Disclaimer:</strong> This AI-generated analysis is for educational and informational purposes only. 
              It does not constitute financial advice, investment recommendations, or a solicitation to buy or sell securities. 
              Always conduct your own research and consult with a qualified financial advisor before making investment decisions.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              Generated by {insight.generatedByModel || "AI"} on{" "}
              {insight.generatedAt ? new Date(insight.generatedAt).toLocaleDateString() : "N/A"}
            </span>
            {insight.sources && insight.sources.length > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Sources
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
