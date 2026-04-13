import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Lock, 
  Bell, 
  Brain, 
  Calendar, 
  Download, 
  Mail, 
  TrendingUp,
  Clock,
  Database
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface FeatureComparison {
  feature: string;
  description: string;
  icon: typeof Check;
  free: boolean | string;
  premium: boolean | string;
}

const features: FeatureComparison[] = [
  {
    feature: "Insider Trade Tracking",
    description: "SEC Form 4 filings from Fortune 500 executives",
    icon: TrendingUp,
    free: "7-day history",
    premium: "Full history",
  },
  {
    feature: "Congressional Trade Tracking",
    description: "STOCK Act disclosures from Congress members",
    icon: TrendingUp,
    free: "7-day history",
    premium: "Full history",
  },
  {
    feature: "Institutional Whale Trades",
    description: "13F filings from major funds like Berkshire Hathaway",
    icon: Database,
    free: "7-day history",
    premium: "Full history",
  },
  {
    feature: "Reddit Social Buzz",
    description: "Trending stocks from WallStreetBets and r/stocks",
    icon: Zap,
    free: true,
    premium: true,
  },
  {
    feature: "Pattern Detection Alerts",
    description: "AI-powered unusual trading activity detection",
    icon: Bell,
    free: "View only",
    premium: "Full access",
  },
  {
    feature: "AI Trade Insights",
    description: "Deep analysis of trade motivations and market context",
    icon: Brain,
    free: false,
    premium: true,
  },
  {
    feature: "IPO Calendar & Tracking",
    description: "Track IPOs from rumor to pricing stage",
    icon: Calendar,
    free: false,
    premium: true,
  },
  {
    feature: "Email Notifications",
    description: "Daily digests and real-time alerts to your inbox",
    icon: Mail,
    free: false,
    premium: true,
  },
  {
    feature: "Custom Watchlists",
    description: "Create and manage lists of stocks you're tracking",
    icon: Lock,
    free: false,
    premium: true,
  },
  {
    feature: "Data Exports",
    description: "Download trade data in CSV format",
    icon: Download,
    free: false,
    premium: true,
  },
  {
    feature: "Priority Data Refresh",
    description: "Get the latest data before free tier users",
    icon: Clock,
    free: false,
    premium: true,
  },
];

function FeatureStatus({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-600 dark:text-green-400" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-muted-foreground/50" />;
  }
  return (
    <span className="text-sm text-muted-foreground">{value}</span>
  );
}

export default function Membership() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to upgrade to Premium.",
        variant: "destructive",
      });
      return;
    }

    setIsUpgrading(true);
    try {
      await apiRequest("POST", "/api/subscription/upgrade");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Upgraded to Premium",
        description: "You now have access to all premium features.",
      });
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "There was an error upgrading your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    setIsDowngrading(true);
    try {
      await apiRequest("POST", "/api/subscription/downgrade");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Downgraded to Free",
        description: "Your account has been switched to the free tier.",
      });
    } catch (error) {
      toast({
        title: "Downgrade Failed",
        description: "There was an error downgrading your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDowngrading(false);
    }
  };

  const isPremium = user?.subscriptionTier === "premium";

  return (
    <div className="p-6 space-y-8" data-testid="membership-page">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of InsiderSignal with Premium membership. 
          Get deeper insights, full historical data, and exclusive features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className={!isPremium ? "border-2 border-primary" : ""}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              Free Tier
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm">7-day historical trade data</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm">View pattern detection alerts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm">Reddit social buzz tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm">Basic search & filtering</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">AI trade insights</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">IPO calendar & alerts</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">Email notifications</span>
              </li>
            </ul>
            {!isPremium && user && (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            )}
            {!user && (
              <Button variant="outline" className="w-full" disabled>
                Sign In to Start
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={isPremium ? "border-2 border-primary" : "border-2 border-amber-400"}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2">
              <Badge className="bg-amber-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Recommended
              </Badge>
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Crown className="h-5 w-5 text-amber-500" />
              Premium
            </CardTitle>
            <CardDescription>For serious investors</CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Full historical trade data</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">AI-powered trade insights</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">IPO calendar with alerts</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Email notifications</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Custom watchlists</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Data exports (CSV)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">Priority data refresh</span>
              </li>
            </ul>
            {isPremium ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground"
                  onClick={handleDowngrade}
                  disabled={isDowngrading}
                  data-testid="button-downgrade"
                >
                  {isDowngrading ? "Processing..." : "Downgrade to Free"}
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleUpgrade}
                disabled={isUpgrading || !user}
                data-testid="button-upgrade"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isUpgrading ? "Processing..." : user ? "Upgrade to Premium" : "Sign In to Upgrade"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="max-w-4xl mx-auto" />

      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-center">Feature Comparison</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="feature-comparison-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="text-center p-4 font-medium w-32">Free</th>
                    <th className="text-center p-4 font-medium w-32 bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((item, index) => (
                    <tr 
                      key={item.feature} 
                      className={index < features.length - 1 ? "border-b" : ""}
                      data-testid={`feature-row-${index}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.feature}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex justify-center">
                          <FeatureStatus value={item.free} />
                        </div>
                      </td>
                      <td className="text-center p-4 bg-amber-50/50 dark:bg-amber-950/10">
                        <div className="flex justify-center">
                          <FeatureStatus value={item.premium} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
        <p>
          Premium subscription renews monthly. Cancel anytime.
        </p>
        <p>
          This is a demonstration application. No actual payment is processed.
        </p>
      </div>
    </div>
  );
}
