import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIInsightPanel } from "./AIInsightPanel";
import { 
  ExternalLink, 
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Percent,
  FileText
} from "lucide-react";
import { ClickableTicker } from "./ClickableTicker";
import type { InstitutionalTrade } from "@shared/schema";

interface InstitutionalDetailDialogProps {
  trade: InstitutionalTrade | null;
  open: boolean;
  onClose: () => void;
}

function formatValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(0)}`;
}

function formatShares(shares: number): string {
  if (shares >= 1e9) return `${(shares / 1e9).toFixed(2)}B`;
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(2)}M`;
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(2)}K`;
  return shares.toLocaleString();
}

export function InstitutionalDetailDialog({ trade, open, onClose }: InstitutionalDetailDialogProps) {
  if (!trade) return null;

  const isBuy = trade.type === "buy" || trade.type === "new_position";
  
  const getTradeTypeLabel = () => {
    switch (trade.type) {
      case "new_position": return "New Position";
      case "exit": return "Exit Position";
      case "buy": return "Increased Position";
      case "sell": return "Reduced Position";
      default: return trade.type.toUpperCase();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                <ClickableTicker ticker={trade.ticker} className="text-xl" />
                <Badge variant={isBuy ? "default" : "destructive"}>
                  {isBuy ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {getTradeTypeLabel()}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground truncate" title={trade.company}>
                {trade.company}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fund</span>
              </div>
              <p className="font-semibold text-lg">{trade.fundName}</p>
              {trade.significance === "high" && (
                <Badge variant="outline" className="mt-2 border-amber-500 text-amber-600 dark:text-amber-400">
                  High Significance Trade
                </Badge>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Position Value</span>
                </div>
                <p className="font-mono font-bold text-xl">{formatValue(trade.value)}</p>
                {trade.valueChange && (
                  <p className={`text-sm ${trade.valueChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {trade.valueChange > 0 ? "+" : ""}{formatValue(trade.valueChange)} change
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Shares</span>
                </div>
                <p className="font-mono font-bold text-xl">{formatShares(trade.shares)}</p>
                {trade.sharesChange && (
                  <p className={`text-sm ${trade.sharesChange > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {trade.sharesChange > 0 ? "+" : ""}{formatShares(trade.sharesChange)}
                    {trade.sharesChangePercent && ` (${trade.sharesChangePercent > 0 ? "+" : ""}${trade.sharesChangePercent.toFixed(1)}%)`}
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Portfolio Weight</span>
                </div>
                <p className="font-mono font-bold text-xl">
                  {trade.portfolioPercent ? `${trade.portfolioPercent.toFixed(2)}%` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Of fund's total holdings</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Report Period</span>
                </div>
                <p className="font-medium">{trade.quarterEnd}</p>
                <p className="text-xs text-muted-foreground">Filed: {trade.reportDate}</p>
              </Card>
            </div>

            <AIInsightPanel
              tradeType="institutional"
              tradeId={trade.id}
              ticker={trade.ticker}
              company={trade.company}
            />
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center gap-4 justify-end flex-wrap">
          <Button variant="outline" onClick={onClose} data-testid="button-close-institutional-detail">
            Close
          </Button>
          {trade.filingUrl && (
            <Button 
              onClick={() => window.open(trade.filingUrl!, "_blank")}
              data-testid="button-view-13f-filing"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {trade.filingUrl.includes("sec.gov") ? "View 13F Filing" : "View Data Source"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
