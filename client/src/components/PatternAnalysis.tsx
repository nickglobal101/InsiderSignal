import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface PatternInsight {
  type: "warning" | "neutral" | "positive";
  title: string;
  description: string;
  confidence: number;
}

interface PatternAnalysisProps {
  insights: PatternInsight[];
  summary: string;
}

export function PatternAnalysis({ insights, summary }: PatternAnalysisProps) {
  const getIcon = (type: PatternInsight["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "positive":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-medium">AI Pattern Analysis</h3>
          <Badge variant="outline" className="text-xs">Powered by GPT-4</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>

      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-md bg-muted/50 border border-border"
            data-testid={`insight-${idx}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(insight.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence:</span>
                    <span className="font-mono">{insight.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={insight.confidence} 
                    className="h-1.5 flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
