import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight, Sparkles, Eye, TrendingUp, Bell } from "lucide-react";
import { Link } from "wouter";

interface DemoBannerProps {
  variant?: "inline" | "prominent" | "compact";
  showBenefits?: boolean;
}

export function DemoBanner({ variant = "inline", showBenefits = true }: DemoBannerProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-primary/10 border border-primary/20">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Demo Mode</span>
          <span className="text-sm text-muted-foreground">- Limited data shown</span>
        </div>
        <Link href="/">
          <Button size="sm" data-testid="button-demo-register">
            Register Free
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === "prominent") {
    return (
      <Card className="p-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                <Eye className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
            <h3 className="text-lg font-semibold">
              You're viewing limited demo data
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Create a free account to unlock 7-day trade history, more data, and personalized alerts. 
              Premium members get AI-powered insights, IPO tracking, and email notifications.
              <span className="block mt-1 font-medium text-foreground">No credit card required.</span>
            </p>
            {showBenefits && (
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>7-day history</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>AI Insights</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell className="h-3 w-3 text-blue-500" />
                  <span>Email Alerts</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button data-testid="button-demo-register-prominent">
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-muted/50 border">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Demo Mode - Limited Data</p>
          <p className="text-xs text-muted-foreground">
            Register free to see full 7-day trade history
          </p>
        </div>
      </div>
      <Link href="/">
        <Button size="sm" data-testid="button-demo-register-inline">
          Register Free
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

interface LockedFeatureProps {
  feature: string;
  description?: string;
  isPremiumOnly?: boolean;
}

export function LockedFeature({ feature, description, isPremiumOnly = false }: LockedFeatureProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-md bg-muted/30 border border-dashed">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-center">{feature}</h4>
      {description && (
        <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
          {description}
        </p>
      )}
      <Link href={isPremiumOnly ? "/membership" : "/"}>
        <Button variant="outline" size="sm" className="mt-4" data-testid={`button-unlock-${feature.toLowerCase().replace(/\s+/g, '-')}`}>
          {isPremiumOnly ? "Upgrade to Premium" : "Register to Unlock"}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

interface DataLimitIndicatorProps {
  showing: number;
  total: number;
  dataType: string;
}

export function DataLimitIndicator({ showing, total, dataType }: DataLimitIndicatorProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm">
          Showing <span className="font-medium">{showing}</span> of <span className="font-medium">{total}+</span> {dataType}
        </span>
      </div>
      <Link href="/">
        <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400" data-testid="button-see-all-data">
          Register to see all
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}
