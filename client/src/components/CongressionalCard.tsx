import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TradeBadge } from "./TradeBadge";
import { ClickableTicker } from "./ClickableTicker";

export interface CongressionalTrade {
  id: string;
  member: string;
  party: "D" | "R" | "I";
  chamber: "Senate" | "House";
  state: string;
  ticker: string;
  company: string;
  type: "buy" | "sell";
  amountRange: string;
  disclosedDate: string;
  tradeDate: string;
}

interface CongressionalCardProps {
  trade: CongressionalTrade;
  onClick?: (trade: CongressionalTrade) => void;
}

export function CongressionalCard({ trade, onClick }: CongressionalCardProps) {
  const getPartyColor = (party: CongressionalTrade["party"]) => {
    switch (party) {
      case "D":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "R":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Card 
      className="p-4 hover-elevate cursor-pointer"
      onClick={() => onClick?.(trade)}
      data-testid={`congressional-trade-${trade.id}`}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {trade.member.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{trade.member}</span>
            <Badge variant="outline" className={`${getPartyColor(trade.party)} border-0 text-xs`}>
              {trade.party}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {trade.chamber}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{trade.state}</p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <ClickableTicker ticker={trade.ticker} className="font-mono font-medium" />
            <TradeBadge type={trade.type} />
          </div>
          <p className="text-sm font-mono">{trade.amountRange}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Traded: {trade.tradeDate}
          </p>
        </div>
      </div>
    </Card>
  );
}
