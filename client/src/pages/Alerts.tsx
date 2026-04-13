import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCard } from "@/components/AlertCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Settings, CheckCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Alert } from "@shared/schema";

export default function Alerts() {
  const [tab, setTab] = useState("active");

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/alerts/${id}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const handleDismiss = (id: string) => {
    dismissMutation.mutate(id);
  };

  const activeAlerts = alerts.filter((a) => a.dismissed !== 1);

  const filteredAlerts = activeAlerts.filter((alert) => {
    if (tab === "high") return alert.severity === "high";
    if (tab === "medium") return alert.severity === "medium";
    if (tab === "low") return alert.severity === "low";
    return true;
  });

  const highCount = activeAlerts.filter((a) => a.severity === "high").length;
  const mediumCount = activeAlerts.filter((a) => a.severity === "medium").length;
  const lowCount = activeAlerts.filter((a) => a.severity === "low").length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-alerts-title">
            Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-detected trading patterns and anomalies
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" data-testid="button-mark-all-read">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button variant="outline" data-testid="button-alert-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30">
              <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono" data-testid="text-high-count">
                {highCount}
              </p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono" data-testid="text-medium-count">
                {mediumCount}
              </p>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono" data-testid="text-low-count">
                {lowCount}
              </p>
              <p className="text-sm text-muted-foreground">Low Priority</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            All Active ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="high" data-testid="tab-high">
            High ({highCount})
          </TabsTrigger>
          <TabsTrigger value="medium" data-testid="tab-medium">
            Medium ({mediumCount})
          </TabsTrigger>
          <TabsTrigger value="low" data-testid="tab-low">
            Low ({lowCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
              ))}
            </div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={{
                  id: alert.id,
                  type: alert.type as "cluster_sell" | "unusual_volume" | "coordinated" | "congressional_conflict",
                  severity: alert.severity as "high" | "medium" | "low",
                  headline: alert.headline,
                  description: alert.description,
                  tickers: alert.tickers,
                  timestamp: alert.timestamp,
                  confidence: alert.confidence || undefined,
                  proof: alert.proof || undefined,
                }}
                onDismiss={handleDismiss}
                onViewDetails={(a) => console.log("View alert details:", a)}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alerts</h3>
              <p className="text-muted-foreground">
                {tab === "active"
                  ? "You're all caught up! No active alerts at this time."
                  : `No ${tab} priority alerts.`}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
