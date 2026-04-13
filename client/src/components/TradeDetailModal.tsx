import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TradeBadge } from "./TradeBadge";
import { Trade } from "./TradeRow";
import { AIInsightPanel } from "./AIInsightPanel";
import { ExternalLink, Building2, User, Calendar, DollarSign, FileText } from "lucide-react";
import { ClickableTicker } from "./ClickableTicker";

interface TradeDetailModalProps {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
}

function formatValue(value: number): string {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatShares(shares: number): string {
  return shares.toLocaleString();
}

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{trade.company}</DialogTitle>
              <ClickableTicker ticker={trade.ticker} className="text-sm" />
            </div>
            <div className="ml-auto">
              <TradeBadge type={trade.type} />
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Executive</span>
                </div>
                <p className="font-medium text-lg">{trade.executive}</p>
                <p className="text-sm text-muted-foreground">{trade.title}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Transaction</span>
                </div>
                <p className="font-mono font-bold text-lg">{formatValue(trade.value)}</p>
                <p className="text-sm text-muted-foreground">{formatShares(trade.shares)} shares</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Date</span>
                </div>
                <p className="font-medium">{trade.date}</p>
                <p className="text-sm text-muted-foreground">Filing date</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Filing</span>
                </div>
                <p className="font-medium">Form 4</p>
                <p className="text-sm text-muted-foreground">SEC EDGAR</p>
              </Card>
            </div>

            <AIInsightPanel
              tradeType="insider"
              tradeId={trade.id}
              ticker={trade.ticker}
              company={trade.company}
            />
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center gap-4 justify-end">
          <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
          {trade.filingUrl && (
            <Button onClick={() => window.open(trade.filingUrl, "_blank")} data-testid="button-view-sec-filing">
              <ExternalLink className="h-4 w-4 mr-2" />
              View SEC Filing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
