import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClickableTicker } from "@/components/ClickableTicker";
import { DemoBanner, DataLimitIndicator } from "@/components/DemoBanner";
import { DemoRegistrationPrompt } from "@/components/DemoRegistrationPrompt";
import { 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  Crown,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Lock,
  FlaskConical,
  FileText,
  Sparkles,
  Info
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import type { Ipo } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";

const DEMO_LIMIT = 5;

export default function IpoCalendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPremium = user?.subscriptionTier === "premium";
  const { isDemo, sessionCount, shouldPromptRegister, maxSessionsReached } = useDemo();
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  
  useEffect(() => {
    if (shouldPromptRegister || maxSessionsReached) {
      const timer = setTimeout(() => setShowRegistrationPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldPromptRegister, maxSessionsReached]);

  const { data: ipos, isLoading } = useQuery<Ipo[]>({
    queryKey: ["/api/ipos"],
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ipos/refresh");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "IPO data refreshed",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ipos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/upgrade");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upgraded to Premium",
        description: "You now have access to all premium features including IPO alerts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "priced":
        return <Badge className="bg-blue-500 text-white">Priced</Badge>;
      case "trading":
        return <Badge className="bg-green-500 text-white">Trading</Badge>;
      case "withdrawn":
        return <Badge variant="destructive">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStageBadge = (stage: string | null) => {
    switch (stage) {
      case "rumored":
        return (
          <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/50">
            <Sparkles className="h-3 w-3 mr-1" />
            Rumored
          </Badge>
        );
      case "filed":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50">
            <FileText className="h-3 w-3 mr-1" />
            SEC Filed
          </Badge>
        );
      case "priced":
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">
            <DollarSign className="h-3 w-3 mr-1" />
            Priced
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDaysUntil = (dateStr: string) => {
    if (dateStr.includes('TBD') || dateStr.includes('Q')) {
      return dateStr;
    }
    try {
      const days = differenceInDays(parseISO(dateStr), new Date());
      if (days < 0) return "Past";
      if (days === 0) return "Today";
      if (days === 1) return "Tomorrow";
      return `${days} days`;
    } catch {
      return dateStr;
    }
  };

  const formatIpoDate = (dateStr: string) => {
    if (dateStr.includes('TBD') || dateStr.includes('Q') || dateStr.includes('Week')) {
      return dateStr;
    }
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatPriceRange = (low: number | null, high: number | null) => {
    if (!low && !high) return "TBD";
    if (low && high) return `$${low} - $${high}`;
    return `$${low || high}`;
  };

  const formatMarketCap = (value: number | null) => {
    if (!value) return "N/A";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  // Categorize IPOs by stage
  const rumoredIpos = ipos?.filter(ipo => ipo.stage === 'rumored') || [];
  const filedIpos = ipos?.filter(ipo => ipo.stage === 'filed') || [];
  const pricedIpos = ipos?.filter(ipo => ipo.stage === 'priced') || [];

  const hasSampleData = ipos?.some(ipo => ipo.isSampleData || ipo.company.startsWith('[SAMPLE DATA]'));

  const renderIpoCard = (ipo: Ipo) => {
    const isSample = ipo.isSampleData || ipo.company.startsWith('[SAMPLE DATA]');
    const displayName = ipo.company.replace('[SAMPLE DATA] ', '');
    const isRumored = ipo.stage === 'rumored';
    
    return (
      <Card 
        key={ipo.id} 
        className={`overflow-visible ${isSample ? 'border-orange-500/30' : ''} ${isRumored ? 'border-purple-500/30' : ''}`}
        data-testid={`card-ipo-${ipo.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {displayName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="font-mono p-0">
                  <ClickableTicker ticker={ipo.symbol} className="px-2.5 py-0.5" />
                </Badge>
                {ipo.exchange && ipo.exchange !== 'TBD' && (
                  <span className="text-xs">{ipo.exchange}</span>
                )}
                {isSample && (
                  <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs">
                    <FlaskConical className="h-3 w-3 mr-1" />
                    Sample
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              {getStageBadge(ipo.stage)}
              {getStatusBadge(ipo.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">
                  {isRumored ? 'Expected' : 'IPO Date'}
                </p>
                <p className="font-medium">
                  {formatIpoDate(ipo.ipoDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getDaysUntil(ipo.ipoDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Price Range</p>
                <p className="font-medium">
                  {ipo.offeringPrice 
                    ? `$${ipo.offeringPrice}` 
                    : formatPriceRange(ipo.priceRangeLow, ipo.priceRangeHigh)}
                </p>
              </div>
            </div>
          </div>

          {ipo.totalSharesValue && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Est. Value: </span>
                <span className="font-medium">{formatMarketCap(ipo.totalSharesValue)}</span>
              </div>
            </div>
          )}

          {/* Source Attribution */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Source: {ipo.sourceName || 'Unknown'}</span>
            </div>
            {ipo.sourceUrl && (
              <a
                href={ipo.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid={`link-source-${ipo.id}`}
              >
                <ExternalLink className="h-3 w-3" />
                View Source
              </a>
            )}
          </div>

          {ipo.prospectusUrl && (
            <a
              href={ipo.prospectusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              data-testid={`link-prospectus-${ipo.id}`}
            >
              <ExternalLink className="h-4 w-4" />
              View SEC Prospectus
            </a>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Apply demo limits
  const displayIpos = isDemo && ipos ? ipos.slice(0, DEMO_LIMIT) : ipos;
  const displayRumoredIpos = isDemo ? rumoredIpos.slice(0, DEMO_LIMIT) : rumoredIpos;
  const displayFiledIpos = isDemo ? filedIpos.slice(0, DEMO_LIMIT) : filedIpos;
  const displayPricedIpos = isDemo ? pricedIpos.slice(0, DEMO_LIMIT) : pricedIpos;

  return (
    <div className="p-6 space-y-6">
      {isDemo && <DemoBanner variant="prominent" />}
      
      <DemoRegistrationPrompt 
        open={showRegistrationPrompt} 
        onClose={() => setShowRegistrationPrompt(false)}
        sessionCount={sessionCount}
        maxReached={maxSessionsReached}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Calendar className="h-6 w-6" />
            IPO Calendar
            {isPremium && (
              <Badge className="bg-amber-500 text-white ml-2">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track upcoming initial public offerings from rumor stage through pricing
          </p>
        </div>

        <div className="flex gap-2">
          {isPremium ? (
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              data-testid="button-refresh-ipos"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh IPOs
            </Button>
          ) : (
            <Button variant="outline" disabled data-testid="button-refresh-locked">
              <Lock className="h-4 w-4 mr-2" />
              Premium Only
            </Button>
          )}
        </div>
      </div>

      {!isPremium && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-semibold">Unlock IPO Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Get email notifications when new IPOs are filed with the SEC
                </p>
              </div>
            </div>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white" 
              data-testid="button-upgrade-premium"
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
            >
              <Crown className="h-4 w-4 mr-2" />
              {upgradeMutation.isPending ? "Upgrading..." : "Upgrade to Premium"}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSampleData && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <FlaskConical className="h-6 w-6 text-orange-500 shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-700 dark:text-orange-400">Sample Data</h3>
              <p className="text-sm text-muted-foreground">
                Some IPOs shown are placeholder data. Real-time IPO data is being fetched from Finnhub and IPOScoop.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-500/10">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rumoredIpos.length}</p>
              <p className="text-sm text-muted-foreground">Rumored</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filedIpos.length}</p>
              <p className="text-sm text-muted-foreground">SEC Filed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pricedIpos.length}</p>
              <p className="text-sm text-muted-foreground">Priced</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {ipos && ipos.length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({ipos.length})
            </TabsTrigger>
            <TabsTrigger value="rumored" data-testid="tab-rumored">
              <Sparkles className="h-4 w-4 mr-1" />
              Rumored ({rumoredIpos.length})
            </TabsTrigger>
            <TabsTrigger value="filed" data-testid="tab-filed">
              <FileText className="h-4 w-4 mr-1" />
              Filed ({filedIpos.length})
            </TabsTrigger>
            <TabsTrigger value="priced" data-testid="tab-priced">
              <DollarSign className="h-4 w-4 mr-1" />
              Priced ({pricedIpos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isDemo && ipos && ipos.length > DEMO_LIMIT && (
              <DataLimitIndicator showing={DEMO_LIMIT} total={ipos.length} dataType="IPOs" />
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayIpos?.map(renderIpoCard)}
            </div>
          </TabsContent>

          <TabsContent value="rumored">
            {rumoredIpos.length > 0 ? (
              <>
                <Card className="mb-4 bg-purple-500/5 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-purple-700 dark:text-purple-400">Pre-Filing Stage</h3>
                        <p className="text-sm text-muted-foreground">
                          These companies are rumored or expected to go public based on analyst reports and news sources. 
                          No SEC filing has been submitted yet. Details are subject to change.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {isDemo && rumoredIpos.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={rumoredIpos.length} dataType="rumored IPOs" />
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayRumoredIpos.map(renderIpoCard)}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rumored IPOs</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No pre-filing stage IPOs are currently being tracked.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="filed">
            {filedIpos.length > 0 ? (
              <>
                <Card className="mb-4 bg-blue-500/5 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-700 dark:text-blue-400">SEC Filed IPOs</h3>
                        <p className="text-sm text-muted-foreground">
                          These companies have filed S-1 registration statements with the SEC. 
                          They are in the regulatory review process before pricing.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {isDemo && filedIpos.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={filedIpos.length} dataType="filed IPOs" />
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayFiledIpos.map(renderIpoCard)}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Filed IPOs</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No SEC-filed IPOs are currently in the pipeline.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="priced">
            {pricedIpos.length > 0 ? (
              <>
                <Card className="mb-4 bg-green-500/5 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-700 dark:text-green-400">Priced IPOs</h3>
                        <p className="text-sm text-muted-foreground">
                          These IPOs have been priced and are either trading or about to begin trading.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {isDemo && pricedIpos.length > DEMO_LIMIT && (
                  <DataLimitIndicator showing={DEMO_LIMIT} total={pricedIpos.length} dataType="priced IPOs" />
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayPricedIpos.map(renderIpoCard)}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Priced IPOs</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No recently priced IPOs are being tracked.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No IPOs Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No upcoming IPOs have been detected yet. The system checks for new IPO filings every 4 hours.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
