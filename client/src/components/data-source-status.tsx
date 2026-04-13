import { useQuery } from "@tanstack/react-query";
import type { DataSource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DataSourceStatus() {
  const { data: dataSources, isLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    refetchInterval: 60000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "failed":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "partial":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case "pending":
        return <Database className="h-3 w-3 text-muted-foreground animate-pulse" />;
      default:
        return <Database className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30";
      case "failed":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
      case "partial":
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "pending":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "";
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-2 px-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Data Sources
        </p>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2" data-testid="data-source-status">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Data Sources
      </p>
      <div className="space-y-1">
        {dataSources?.map((source) => (
          <Tooltip key={source.name}>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center justify-between gap-2 py-1 px-2 rounded-md hover-elevate cursor-default"
                data-testid={`status-${source.name}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStatusIcon(source.status)}
                  <span className="text-xs truncate">{source.displayName}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 ${getStatusColor(source.status)}`}
                >
                  {source.recordCount}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{source.displayName}</p>
                <p className="text-xs">
                  Status: <span className="capitalize">{source.status.replace("_", " ")}</span>
                </p>
                <p className="text-xs">Records: {source.recordCount}</p>
                <p className="text-xs">Updated: {formatTimestamp(source.lastUpdated)}</p>
                {source.errorMessage && (
                  <p className="text-xs text-red-500">{source.errorMessage}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
