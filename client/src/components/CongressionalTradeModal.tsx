import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIInsightPanel } from "./AIInsightPanel";
import { ExternalLink, Landmark, User, Calendar, DollarSign, FileText } from "lucide-react";
import { ClickableTicker } from "./ClickableTicker";
import type { CongressionalTrade } from "@shared/schema";

interface CongressionalTradeModalProps {
  trade: CongressionalTrade | null;
  open: boolean;
  onClose: () => void;
}

export function CongressionalTradeModal({ trade, open, onClose }: CongressionalTradeModalProps) {
  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/10">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{trade.member}</DialogTitle>
              <p className="text-sm text-muted-foreground">{trade.chamber} - {trade.state}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={trade.type === "buy" ? "default" : "destructive"}>
                {trade.type.toUpperCase()}
              </Badge>
              <Badge variant="outline">{trade.party}</Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Representative</span>
                </div>
                <p className="font-medium text-lg">{trade.member}</p>
                <p className="text-sm text-muted-foreground">{trade.party} - {trade.state}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Amount Range</span>
                </div>
                <p className="font-mono font-bold text-lg">{trade.amountRange}</p>
                <ClickableTicker ticker={trade.ticker} className="text-sm" />
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Trade Date</span>
                </div>
                <p className="font-medium">{trade.tradeDate}</p>
                <p className="text-sm text-muted-foreground">Disclosed: {trade.disclosedDate}</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase tracking-wide">Filing</span>
                </div>
                <p className="font-medium">STOCK Act</p>
                <p className="text-sm text-muted-foreground">{trade.chamber}</p>
              </Card>
            </div>

            <AIInsightPanel
              tradeType="congressional"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
