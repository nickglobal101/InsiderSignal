import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ExternalLink, Building2, Globe } from "lucide-react";

interface StockQuote {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  logo: string | null;
  industry: string | null;
  marketCap: number | null;
  weburl: string | null;
  exchange: string | null;
}

interface StockInfoDialogProps {
  ticker: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1000) {
    return `$${(marketCap / 1000).toFixed(2)}T`;
  }
  if (marketCap >= 1) {
    return `$${marketCap.toFixed(2)}B`;
  }
  return `$${(marketCap * 1000).toFixed(0)}M`;
}

function formatPercent(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function StockInfoDialog({ ticker, open, onOpenChange }: StockInfoDialogProps) {
  const { data: quote, isLoading, error } = useQuery<StockQuote>({
    queryKey: ["/api/stock", ticker],
    queryFn: async () => {
      const res = await fetch(`/api/stock/${ticker}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch stock data: ${res.status}`);
      }
      return res.json();
    },
    enabled: open && !!ticker,
    staleTime: 60000,
  });

  const isPositive = quote && quote.change >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-stock-info">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {quote?.logo && (
              <img 
                src={quote.logo} 
                alt={quote.name} 
                className="w-8 h-8 rounded-md object-contain bg-white dark:bg-gray-100"
                data-testid="img-stock-logo"
              />
            )}
            <div className="flex flex-col">
              <span className="font-mono text-lg" data-testid="text-stock-ticker">{ticker}</span>
              {quote?.name && quote.name !== ticker && (
                <span className="text-sm font-normal text-muted-foreground" data-testid="text-stock-name">
                  {quote.name}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        )}

        {error && (
          <div className="py-6 text-center text-muted-foreground" data-testid="text-stock-error">
            <p>Unable to load stock data for {ticker}</p>
            <p className="text-sm mt-1">The ticker may be invalid or the service is unavailable.</p>
          </div>
        )}

        {quote && !isLoading && (
          <div className="space-y-4 py-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold" data-testid="text-current-price">
                {formatPrice(quote.currentPrice)}
              </span>
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className="flex items-center gap-1"
                data-testid="badge-price-change"
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatPrice(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="font-medium" data-testid="text-stock-open">{formatPrice(quote.open)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Previous Close</p>
                <p className="font-medium" data-testid="text-stock-prev-close">{formatPrice(quote.previousClose)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Day High</p>
                <p className="font-medium text-green-600 dark:text-green-400" data-testid="text-stock-high">{formatPrice(quote.high)}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Day Low</p>
                <p className="font-medium text-red-600 dark:text-red-400" data-testid="text-stock-low">{formatPrice(quote.low)}</p>
              </div>
            </div>

            {(quote.industry || quote.marketCap || quote.exchange) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {quote.exchange && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="w-3 h-3 mr-1" />
                    {quote.exchange}
                  </Badge>
                )}
                {quote.industry && (
                  <Badge variant="outline" className="text-xs" data-testid="badge-industry">
                    {quote.industry}
                  </Badge>
                )}
                {quote.marketCap && (
                  <Badge variant="secondary" className="text-xs" data-testid="badge-market-cap">
                    Market Cap: {formatMarketCap(quote.marketCap)}
                  </Badge>
                )}
              </div>
            )}

            {quote.weburl && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                  data-testid="link-company-website"
                >
                  <a href={quote.weburl} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Company Website
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Data provided by Finnhub. Updated {new Date(quote.timestamp).toLocaleTimeString()}.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
