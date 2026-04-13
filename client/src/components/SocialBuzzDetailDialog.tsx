import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClickableTicker } from "./ClickableTicker";
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageSquare, 
  ThumbsUp, 
  Info,
  Calculator,
  Database
} from "lucide-react";
import { SiReddit } from "react-icons/si";
import type { SocialBuzz } from "@shared/schema";

interface SocialBuzzDetailDialogProps {
  buzz: SocialBuzz | null;
  open: boolean;
  onClose: () => void;
}

const SUBREDDIT_SOURCES = [
  { name: "r/wallstreetbets", url: "https://reddit.com/r/wallstreetbets", description: "High-volume retail trading discussion" },
  { name: "r/stocks", url: "https://reddit.com/r/stocks", description: "General stock market discussion" },
  { name: "r/investing", url: "https://reddit.com/r/investing", description: "Long-term investment strategies" },
  { name: "r/options", url: "https://reddit.com/r/options", description: "Options trading strategies" },
  { name: "r/pennystocks", url: "https://reddit.com/r/pennystocks", description: "Small-cap stock discussion" },
];

export function SocialBuzzDetailDialog({ buzz, open, onClose }: SocialBuzzDetailDialogProps) {
  if (!buzz) return null;

  const getSentimentIcon = () => {
    switch (buzz.sentiment) {
      case "bullish":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = () => {
    switch (buzz.sentiment) {
      case "bullish":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
      case "bearish":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-orange-500/10">
              <SiReddit className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <ClickableTicker ticker={buzz.ticker} />
                <Badge className={getSentimentColor()}>
                  {getSentimentIcon()}
                  <span className="ml-1 capitalize">{buzz.sentiment}</span>
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{buzz.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">#{buzz.rank}</p>
              <p className="text-xs text-muted-foreground">Trending Rank</p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Mentions (24h)</span>
            </div>
            <p className="font-mono font-bold text-2xl">{buzz.mentions.toLocaleString()}</p>
            <p className={`text-sm ${buzz.mentionsChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {buzz.mentionsChange >= 0 ? "+" : ""}{buzz.mentionsChange}% vs yesterday
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Upvotes</span>
            </div>
            <p className="font-mono font-bold text-2xl">{buzz.upvotes.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {buzz.mentions > 0 ? Math.round(buzz.upvotes / buzz.mentions) : 0} avg per mention
            </p>
          </Card>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Data Source</h3>
          </div>
          <Card className="p-4 bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">ApeWisdom API</p>
                  <p className="text-sm text-muted-foreground">
                    Aggregates stock mentions from popular Reddit investing communities. 
                    Data is collected in real-time from posts and comments.
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Subreddits Tracked:</p>
                <div className="grid grid-cols-1 gap-2">
                  {SUBREDDIT_SOURCES.map((sub) => (
                    <a
                      key={sub.name}
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-md hover-elevate bg-background"
                      data-testid={`link-subreddit-${sub.name}`}
                    >
                      <div className="flex items-center gap-2">
                        <SiReddit className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-sm">{sub.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{sub.description}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Sentiment Methodology</h3>
          </div>
          <Card className="p-4 bg-muted/30">
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                The sentiment score (0-100) is calculated using:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">+</span>
                  <span><strong>Engagement ratio:</strong> Higher upvotes per mention indicates stronger community agreement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">+</span>
                  <span><strong>Momentum:</strong> Positive 24h mention change suggests growing interest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">-</span>
                  <span><strong>Declining interest:</strong> Negative mention change reduces score</span>
                </li>
              </ul>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-red-500/10">
                  <p className="font-bold text-red-600 dark:text-red-400">0-35</p>
                  <p className="text-xs text-muted-foreground">Bearish</p>
                </div>
                <div className="p-2 rounded-md bg-yellow-500/10">
                  <p className="font-bold text-yellow-600 dark:text-yellow-400">36-64</p>
                  <p className="text-xs text-muted-foreground">Neutral</p>
                </div>
                <div className="p-2 rounded-md bg-green-500/10">
                  <p className="font-bold text-green-600 dark:text-green-400">65-100</p>
                  <p className="text-xs text-muted-foreground">Bullish</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        <div className="flex items-center gap-4 justify-end">
          <Button variant="outline" onClick={onClose} data-testid="button-close-buzz-detail">
            Close
          </Button>
          <Button 
            onClick={() => window.open(`https://www.reddit.com/search/?q=${buzz.ticker}+stock`, "_blank")}
            data-testid="button-search-reddit"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Search on Reddit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
