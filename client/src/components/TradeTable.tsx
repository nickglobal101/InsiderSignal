import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TradeRow, Trade } from "./TradeRow";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

interface TradeTableProps {
  trades: Trade[];
  title?: string;
  onTradeClick?: (trade: Trade) => void;
}

type SortField = "date" | "value" | "company";
type SortDirection = "asc" | "desc";

export function TradeTable({ trades, title, onTradeClick }: TradeTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const sortedTrades = [...trades].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "date":
        return modifier * (new Date(b.date).getTime() - new Date(a.date).getTime());
      case "value":
        return modifier * (a.value - b.value);
      case "company":
        return modifier * a.company.localeCompare(b.company);
      default:
        return 0;
    }
  });

  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="p-4 border-b border-border">
          <h3 className="text-xl font-medium">{title}</h3>
        </div>
      )}
      
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
        <div className="flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-0 gap-1"
            onClick={() => handleSort("company")}
            data-testid="sort-company"
          >
            Company {getSortIcon("company")}
          </Button>
        </div>
        <div className="w-20 text-center">Type</div>
        <div className="w-20 text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-0 gap-1"
            onClick={() => handleSort("value")}
            data-testid="sort-value"
          >
            Value {getSortIcon("value")}
          </Button>
        </div>
        <div className="w-24 text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-0 gap-1"
            onClick={() => handleSort("date")}
            data-testid="sort-date"
          >
            Date {getSortIcon("date")}
          </Button>
        </div>
        <div className="w-9" />
      </div>

      <div>
        {sortedTrades.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No trades match your filters
          </div>
        ) : (
          sortedTrades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} onClick={onTradeClick} />
          ))
        )}
      </div>
    </Card>
  );
}
