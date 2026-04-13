import { TradeBadge } from "./TradeBadge";
import { ClickableTicker } from "./ClickableTicker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Trade {
  id: string;
  company: string;
  ticker: string;
  executive: string;
  title: string;
  type: "buy" | "sell" | "exercise" | "gift";
  shares: number;
  value: number;
  date: string;
  filingUrl?: string;
}

interface TradeRowProps {
  trade: Trade;
  onClick?: (trade: Trade) => void;
}

function formatValue(value: number): string {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatShares(shares: number): string {
  if (shares >= 1000000) return `${(shares / 1000000).toFixed(1)}M`;
  if (shares >= 1000) return `${(shares / 1000).toFixed(0)}K`;
  return shares.toString();
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function TradeRow({ trade, onClick }: TradeRowProps) {
  return (
    <div 
      className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover-elevate cursor-pointer"
      onClick={() => onClick?.(trade)}
      data-testid={`trade-row-${trade.id}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {trade.ticker.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{trade.company}</span>
          <ClickableTicker ticker={trade.ticker} className="text-muted-foreground font-mono text-sm" />
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {trade.executive} <span className="opacity-60">({trade.title})</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TradeBadge type={trade.type} />
        
        <div className="text-right min-w-20">
          <p className="font-mono font-medium">{formatValue(trade.value)}</p>
          <p className="text-sm text-muted-foreground font-mono">{formatShares(trade.shares)} shares</p>
        </div>

        <div className="text-right min-w-24">
          <p className="text-sm text-muted-foreground">{trade.date}</p>
        </div>

        {trade.filingUrl && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              window.open(trade.filingUrl, "_blank");
            }}
            data-testid={`button-filing-${trade.id}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
