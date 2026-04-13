import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClickableTicker } from "./ClickableTicker";
import { TrendingUp, TrendingDown, ExternalLink, Briefcase } from "lucide-react";

export interface InsiderTradeData {
  id: string;
  company: string;
  ticker: string;
  executive: string;
  title: string;
  type: "buy" | "sell" | "exercise";
  shares: number;
  value: number;
  date: string;
  filingUrl?: string;
}

interface InsiderTradeCardProps {
  trade: InsiderTradeData;
  onClick?: (trade: InsiderTradeData) => void;
}

function formatValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatShares(shares: number): string {
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(1)}M`;
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(1)}K`;
  return shares.toLocaleString();
}

export function InsiderTradeCard({ trade, onClick }: InsiderTradeCardProps) {
  const isBuy = trade.type === "buy";
  const isExercise = trade.type === "exercise";
  
  return (
    <Card 
      className="hover-elevate cursor-pointer"
      onClick={() => onClick?.(trade)}
      data-testid={`insider-trade-${trade.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {trade.executive.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium truncate">{trade.executive}</span>
              <Badge 
                variant={isBuy ? "default" : isExercise ? "secondary" : "destructive"} 
                className="text-xs shrink-0"
              >
                {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trade.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span className="truncate">{trade.title}</span>
            </p>
          </div>
          
          <div className="text-right shrink-0">
            <div className="flex items-center gap-2 justify-end mb-1">
              <ClickableTicker ticker={trade.ticker} className="font-mono font-bold text-lg" />
            </div>
            <p className="font-semibold">{formatValue(trade.value)}</p>
            <p className="text-sm text-muted-foreground">{formatShares(trade.shares)} shares</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
          <div>
            <p className="text-sm text-muted-foreground truncate">{trade.company}</p>
            <span className="text-xs text-muted-foreground">{trade.date}</span>
          </div>
          {trade.filingUrl && (
            <a 
              href={trade.filingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
              data-testid={`trade-filing-link-${trade.id}`}
            >
              {trade.filingUrl.includes("sec.gov") ? "View SEC Filing" : "View Source"} 
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
