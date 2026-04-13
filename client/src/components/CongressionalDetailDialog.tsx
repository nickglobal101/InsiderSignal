import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIInsightPanel } from "./AIInsightPanel";
import { 
  ExternalLink, 
  Landmark,
  User,
  Building2,
  Calendar,
  DollarSign,
  Info,
  Database,
  FileText,
  Scale
} from "lucide-react";
import { ClickableTicker } from "./ClickableTicker";
import type { CongressionalTrade } from "@shared/schema";

interface CongressionalDetailDialogProps {
  trade: CongressionalTrade | null;
  open: boolean;
  onClose: () => void;
}

const DATA_SOURCES = [
  { 
    name: "House Stock Watcher", 
    url: "https://housestockwatcher.com", 
    description: "Aggregates House Financial Disclosure data" 
  },
  { 
    name: "Senate Stock Watcher", 
    url: "https://senatestockwatcher.com", 
    description: "Aggregates Senate Financial Disclosure data" 
  },
  { 
    name: "efdsearch.senate.gov", 
    url: "https://efdsearch.senate.gov", 
    description: "Official Senate financial disclosure portal" 
  },
  { 
    name: "disclosures-clerk.house.gov", 
    url: "https://disclosures-clerk.house.gov", 
    description: "Official House financial disclosure portal" 
  },
];

export function CongressionalDetailDialog({ trade, open, onClose }: CongressionalDetailDialogProps) {
  if (!trade) return null;

  const getPartyColor = () => {
    switch (trade.party) {
      case "D":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "R":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getPartyName = () => {
    switch (trade.party) {
      case "D": return "Democrat";
      case "R": return "Republican";
      case "I": return "Independent";
      default: return trade.party;
    }
  };

  const getTradeTypeColor = () => {
    return trade.type === "buy" 
      ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
      : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-primary/10">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                {trade.member}
                <Badge className={getPartyColor()}>
                  {getPartyName()}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {trade.chamber} - {trade.state}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Stock</span>
            </div>
            <ClickableTicker ticker={trade.ticker} className="text-xl" />
            <p className="text-sm text-muted-foreground truncate" title={trade.company}>
              {trade.company}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Transaction</span>
            </div>
            <Badge className={getTradeTypeColor()}>
              {trade.type.toUpperCase()}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">{trade.amountRange}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Trade Date</span>
            </div>
            <p className="font-medium">{trade.tradeDate}</p>
            <p className="text-xs text-muted-foreground">When transaction occurred</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Disclosed</span>
            </div>
            <p className="font-medium">{trade.disclosedDate}</p>
            <p className="text-xs text-muted-foreground">When publicly reported</p>
          </Card>
        </div>

        {trade.committee && (
          <>
            <Separator />
            <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">Committee Membership</p>
                  <p className="text-sm text-muted-foreground">
                    This member serves on the <strong>{trade.committee}</strong> committee. 
                    Trades in related sectors may warrant additional scrutiny for potential conflicts of interest.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        <Separator />

        <AIInsightPanel
          tradeType="congressional"
          tradeId={trade.id}
          ticker={trade.ticker}
          company={trade.company}
        />

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Data Source & Legal Context</h3>
          </div>
          <Card className="p-4 bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">STOCK Act Disclosure</p>
                  <p className="text-sm text-muted-foreground">
                    The Stop Trading on Congressional Knowledge (STOCK) Act requires members of Congress 
                    to disclose stock transactions within 45 days. This data is publicly available 
                    through official government portals.
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Official Sources:</p>
                <div className="grid grid-cols-1 gap-2">
                  {DATA_SOURCES.map((source) => (
                    <a
                      key={source.name}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-md hover-elevate bg-background"
                      data-testid={`link-source-${source.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{source.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{source.description}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        <div className="flex items-center gap-4 justify-end flex-wrap">
          <Button variant="outline" onClick={onClose} data-testid="button-close-congressional-detail">
            Close
          </Button>
          <Button 
            onClick={() => {
              const searchUrl = trade.chamber === "Senate" 
                ? "https://efdsearch.senate.gov/search/"
                : "https://disclosures-clerk.house.gov/FinancialDisclosure";
              window.open(searchUrl, "_blank");
            }}
            data-testid="button-view-official-filing"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Official Filings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
