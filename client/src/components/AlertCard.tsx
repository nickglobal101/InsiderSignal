import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClickableTicker } from "./ClickableTicker";
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  X, 
  ChevronDown, 
  ChevronUp,
  Landmark,
  Brain,
  Info
} from "lucide-react";

export interface Alert {
  id: string;
  type: "cluster_sell" | "unusual_volume" | "coordinated" | "congressional_conflict";
  severity: "high" | "medium" | "low";
  headline: string;
  description: string;
  tickers: string[];
  timestamp: string;
  confidence?: number;
  proof?: string;
}

interface AlertCardProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
  onViewDetails?: (alert: Alert) => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (alert.type) {
      case "cluster_sell":
        return <TrendingDown className="h-5 w-5" />;
      case "unusual_volume":
        return <AlertTriangle className="h-5 w-5" />;
      case "coordinated":
        return <Users className="h-5 w-5" />;
      case "congressional_conflict":
        return <Landmark className="h-5 w-5" />;
    }
  };

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case "high":
        return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "low":
        return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20";
    }
  };

  const getIconStyles = () => {
    switch (alert.severity) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getTypeName = () => {
    switch (alert.type) {
      case "cluster_sell": return "Cluster Selling";
      case "unusual_volume": return "Unusual Volume";
      case "coordinated": return "Coordinated Trading";
      case "congressional_conflict": return "Congressional Conflict";
    }
  };

  return (
    <Card className={`p-4 border-l-4 ${getSeverityStyles()}`} data-testid={`alert-${alert.id}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-md ${getIconStyles()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium">{alert.headline}</h4>
            <Badge variant="outline" className="text-xs">
              {alert.severity.toUpperCase()}
            </Badge>
            {alert.confidence && (
              <Badge variant="secondary" className="text-xs">
                {alert.confidence}% confidence
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {alert.tickers.map((ticker) => (
              <Badge key={ticker} variant="secondary" className="font-mono text-xs p-0">
                <ClickableTicker ticker={ticker} className="px-2.5 py-0.5" />
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(alert.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-toggle-alert-${alert.id}`}
          >
            {isExpanded ? "Hide" : "Details"} 
            {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDismiss?.(alert.id)}
            data-testid={`button-dismiss-alert-${alert.id}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Pattern Type</span>
              </div>
              <p className="font-medium">{getTypeName()}</p>
            </div>

            {alert.confidence && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">AI Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        alert.confidence >= 80 
                          ? 'bg-green-500' 
                          : alert.confidence >= 60 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${alert.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold">{alert.confidence}%</span>
                </div>
              </div>
            )}
          </div>

          {alert.proof && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">AI Analysis & Evidence</span>
              </div>
              <div className="p-3 rounded-md bg-muted/50 text-sm">
                <p className="text-muted-foreground whitespace-pre-wrap">{alert.proof}</p>
              </div>
            </div>
          )}

          <div className="p-3 rounded-md bg-blue-500/10 text-sm">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Methodology:</strong> This alert was generated by analyzing 
                trading patterns across SEC Form 4 filings and Congressional STOCK Act disclosures. 
                The AI looks for clusters of similar trades, unusual timing, volume anomalies, 
                and potential conflicts of interest based on committee memberships.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
