import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  Crown,
  Mail,
  TrendingDown,
  Landmark,
  Calendar,
  Sparkles,
  Lock,
  Clock,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Link } from "wouter";

interface AlertPreferences {
  userId: string;
  emailAlertsEnabled: boolean;
  ipoAlertsEnabled: boolean;
  insiderAlertsEnabled: boolean;
  congressionalAlertsEnabled: boolean;
  patternAlertsEnabled: boolean;
  alertFrequency: string;
  minAlertSeverity: string;
  watchlistTickers: string[];
}

export default function AlertSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isPremium = user?.subscriptionTier === "premium";

  const [prefs, setPrefs] = useState<AlertPreferences>({
    userId: "",
    emailAlertsEnabled: false,
    ipoAlertsEnabled: true,
    insiderAlertsEnabled: true,
    congressionalAlertsEnabled: true,
    patternAlertsEnabled: true,
    alertFrequency: "immediate",
    minAlertSeverity: "medium",
    watchlistTickers: [],
  });

  const { data: alertPrefs, isLoading } = useQuery<AlertPreferences>({
    queryKey: ["/api/alert-preferences"],
    enabled: !!user,
  });

  useEffect(() => {
    if (alertPrefs) {
      setPrefs(alertPrefs);
    }
  }, [alertPrefs]);

  const updateMutation = useMutation({
    mutationFn: async (newPrefs: Partial<AlertPreferences>) => {
      const response = await apiRequest("PUT", "/api/alert-preferences", newPrefs);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your alert preferences have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alert-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof AlertPreferences) => {
    if (!isPremium) return;
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });
    updateMutation.mutate({ ...prefs, [key]: newValue });
  };

  const handleSelectChange = (key: keyof AlertPreferences, value: string) => {
    if (!isPremium) return;
    setPrefs({ ...prefs, [key]: value });
    updateMutation.mutate({ ...prefs, [key]: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Bell className="h-6 w-6" />
          Alert Settings
          {isPremium && (
            <Badge className="bg-amber-500 text-white ml-2">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure email notifications for trading alerts and IPO filings
        </p>
      </div>

      {!isPremium && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-semibold">Email Alerts are a Premium Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to receive email notifications for IPOs and trading patterns
                </p>
              </div>
            </div>
            <Link href="/membership">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="button-upgrade-premium">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive alerts directly to your email inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${prefs.emailAlertsEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Mail className={`h-5 w-5 ${prefs.emailAlertsEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <Label className="text-base">Enable Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Master toggle for all email notifications
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.emailAlertsEnabled}
              onCheckedChange={() => handleToggle("emailAlertsEnabled")}
              disabled={!isPremium}
              data-testid="switch-email-alerts"
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Alert Types</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <Label>IPO Alerts</Label>
                  <p className="text-sm text-muted-foreground">New IPO filings detected</p>
                </div>
              </div>
              <Switch
                checked={prefs.ipoAlertsEnabled}
                onCheckedChange={() => handleToggle("ipoAlertsEnabled")}
                disabled={!isPremium || !prefs.emailAlertsEnabled}
                data-testid="switch-ipo-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <div>
                  <Label>Insider Trade Alerts</Label>
                  <p className="text-sm text-muted-foreground">Significant insider selling patterns</p>
                </div>
              </div>
              <Switch
                checked={prefs.insiderAlertsEnabled}
                onCheckedChange={() => handleToggle("insiderAlertsEnabled")}
                disabled={!isPremium || !prefs.emailAlertsEnabled}
                data-testid="switch-insider-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-purple-500" />
                <div>
                  <Label>Congressional Trade Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notable trades by Congress members</p>
                </div>
              </div>
              <Switch
                checked={prefs.congressionalAlertsEnabled}
                onCheckedChange={() => handleToggle("congressionalAlertsEnabled")}
                disabled={!isPremium || !prefs.emailAlertsEnabled}
                data-testid="switch-congressional-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <div>
                  <Label>AI Pattern Alerts</Label>
                  <p className="text-sm text-muted-foreground">AI-detected unusual trading patterns</p>
                </div>
              </div>
              <Switch
                checked={prefs.patternAlertsEnabled}
                onCheckedChange={() => handleToggle("patternAlertsEnabled")}
                disabled={!isPremium || !prefs.emailAlertsEnabled}
                data-testid="switch-pattern-alerts"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delivery Preferences
          </CardTitle>
          <CardDescription>
            Choose how often you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Alert Frequency</Label>
              <Select
                value={prefs.alertFrequency}
                onValueChange={(value) => handleSelectChange("alertFrequency", value)}
                disabled={!isPremium}
              >
                <SelectTrigger data-testid="select-alert-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {prefs.alertFrequency === "immediate" && "Get alerts as soon as they're detected"}
                {prefs.alertFrequency === "daily" && "Receive a daily summary at 8 AM"}
                {prefs.alertFrequency === "weekly" && "Get a weekly roundup every Monday"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Severity</Label>
              <Select
                value={prefs.minAlertSeverity}
                onValueChange={(value) => handleSelectChange("minAlertSeverity", value)}
                disabled={!isPremium}
              >
                <SelectTrigger data-testid="select-min-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">All Alerts</SelectItem>
                  <SelectItem value="medium">Medium & High</SelectItem>
                  <SelectItem value="high">High Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter out lower priority alerts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Notification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm">Email notifications are active</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Alerts will be sent to: <span className="font-medium">{user?.email}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
