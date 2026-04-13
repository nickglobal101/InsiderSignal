import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIInsightPanel } from "./AIInsightPanel";
import { ExternalLink, Building2, TrendingUp, Calendar, DollarSign, FileText, Percent } from "lucide-react";
import type { InstitutionalTrade } from "@shared/schema";

interface InstitutionalTradeModalProps {
  trade: InstitutionalTrade | null;
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

function getTradeTypeLabel(type: string): string {
  switch (type) {
    case "new_position": return "NEW POSITION";
    case "exit": return "EXIT";
    default: return type.toUpperCase();
  }
}

export function InstitutionalTradeModal({ trade, open, onClose }: InstitutionalTradeModalProps) {
  if (!trade) return null;

  const isBullish = trade.type === "buy" || trade.type === "new_position";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{trade.fundName}</DialogTitle>
              <p className="text-sm text-muted-foreground font-mono">{trade.ticker}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={isBullish ? "default" : "destructive"}>
                {getTradeTypeLabel(trade.type)}
              </Badge>
              {trade.significance === "high" && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  HIGH
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Institution</span>
                </div>
                <p className="font-medium text-lg">{trade.fundName}</p>
                <p className="text-sm text-muted-foreground">13F Filing</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Position Value</span>
                </div>
                <p className="font-mono font-bold text-lg">{formatValue(trade.value)}</p>
                <p className="text-sm text-muted-foreground">{formatShares(trade.shares)} shares</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Change</span>
                </div>
                {trade.sharesChangePercent !== null && trade.sharesChangePercent !== undefined ? (
                  <>
                    <p className={`font-mono font-bold text-lg ${trade.sharesChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trade.sharesChangePercent >= 0 ? '+' : ''}{trade.sharesChangePercent.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(trade.sharesChange ?? 0) >= 0 ? '+' : ''}{formatShares(trade.sharesChange ?? 0)} shares
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono font-bold text-lg text-muted-foreground">
                      {trade.type === "new_position" ? "NEW" : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trade.sharesChange ? `${trade.sharesChange >= 0 ? '+' : ''}${formatShares(trade.sharesChange)} shares` : "First quarter filing"}
                    </p>
                  </>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Portfolio Weight</span>
                </div>
                {trade.portfolioPercent !== null && trade.portfolioPercent !== undefined ? (
                  <>
                    <p className="font-mono font-bold text-lg">{trade.portfolioPercent.toFixed(2)}%</p>
                    <p className="text-sm text-muted-foreground">of total holdings</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono font-bold text-lg text-muted-foreground">N/A</p>
                    <p className="text-sm text-muted-foreground">Calculating...</p>
                  </>
                )}
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Report Date</span>
                </div>
                <p className="font-medium">{trade.reportDate}</p>
                <p className="text-sm text-muted-foreground">Quarter ending</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Filing</span>
                </div>
                <p className="font-medium">Form 13F</p>
                <p className="text-sm text-muted-foreground">SEC EDGAR</p>
              </Card>
            </div>

            <AIInsightPanel
              tradeType="institutional"
              tradeId={trade.id}
              ticker={trade.ticker}
              company={trade.ticker}
            />
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center gap-4 justify-end">
          <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
            Close
          </Button>
          {trade.filingUrl && (
            <Button onClick={() => window.open(trade.filingUrl ?? "", "_blank")} data-testid="button-view-sec-filing">
              <ExternalLink className="h-4 w-4 mr-2" />
              View SEC Filing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
