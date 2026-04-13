import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, RefreshCw, Settings as SettingsIcon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UserPreferences {
  userId: string;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultTradeView: string;
  compactMode: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<UserPreferences>({
    userId: "",
    autoRefresh: true,
    refreshInterval: 5,
    defaultTradeView: "all",
    compactMode: false,
  });

  const { data: userPrefs, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
    enabled: !!user,
  });

  useEffect(() => {
    if (userPrefs) {
      setPrefs(userPrefs);
    }
  }, [userPrefs]);

  const updateMutation = useMutation({
    mutationFn: async (partialPrefs: Partial<UserPreferences>) => {
      const response = await apiRequest("PUT", "/api/user-preferences", partialPrefs);
      return response.json();
    },
    onSuccess: (data: UserPreferences) => {
      setPrefs(data);
      queryClient.setQueryData(["/api/user-preferences"], data);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      if (userPrefs) {
        setPrefs(userPrefs);
      }
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof UserPreferences) => {
    const newValue = !prefs[key as keyof typeof prefs];
    setPrefs({ ...prefs, [key]: newValue });
    updateMutation.mutate({ [key]: newValue });
  };

  const handleSelectChange = (key: keyof UserPreferences, value: string | number) => {
    setPrefs({ ...prefs, [key]: value });
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-settings-title">
          <SettingsIcon className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your app preferences and display options.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium" data-testid="text-user-email">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Name</span>
            <span className="text-sm font-medium" data-testid="text-user-name">
              {user?.firstName || user?.lastName 
                ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                : 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subscription</span>
            <span className="text-sm font-medium capitalize" data-testid="text-subscription-tier">
              {user?.subscriptionTier || 'Free'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Display
          </CardTitle>
          <CardDescription>Customize how data is displayed in the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Use a more condensed layout for trade tables</p>
            </div>
            <Switch 
              id="compact-mode" 
              checked={prefs.compactMode}
              onCheckedChange={() => handleToggle("compactMode")}
              data-testid="switch-compact-mode"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="default-view">Default Trade View</Label>
              <p className="text-sm text-muted-foreground">Which trades to show by default</p>
            </div>
            <Select 
              value={prefs.defaultTradeView} 
              onValueChange={(value) => handleSelectChange("defaultTradeView", value)}
            >
              <SelectTrigger className="w-32" data-testid="select-default-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="buys">Buys Only</SelectItem>
                <SelectItem value="sells">Sells Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Refresh
          </CardTitle>
          <CardDescription>Control how often data is automatically updated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-refresh">Auto-Refresh</Label>
              <p className="text-sm text-muted-foreground">Automatically fetch new data periodically</p>
            </div>
            <Switch 
              id="auto-refresh" 
              checked={prefs.autoRefresh}
              onCheckedChange={() => handleToggle("autoRefresh")}
              data-testid="switch-auto-refresh"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="refresh-interval">Refresh Interval</Label>
              <p className="text-sm text-muted-foreground">How often to check for new data</p>
            </div>
            <Select 
              value={String(prefs.refreshInterval)} 
              onValueChange={(value) => handleSelectChange("refreshInterval", Number(value))}
              disabled={!prefs.autoRefresh}
            >
              <SelectTrigger className="w-32" data-testid="select-refresh-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
