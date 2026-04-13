import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ChartDataPoint {
  date: string;
  sellVolume: number;
  buyVolume: number;
}

type TimeRange = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface VolumeChartProps {
  data: ChartDataPoint[];
  title?: string;
  defaultRange?: TimeRange;
}

function getTimeRangeDays(range: TimeRange): number {
  switch (range) {
    case "1W": return 7;
    case "1M": return 30;
    case "3M": return 90;
    case "6M": return 180;
    case "1Y": return 365;
    case "ALL": return Infinity;
  }
}

export function VolumeChart({ data, title = "Trade Volume", defaultRange = "1M" }: VolumeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

  const filteredData = useMemo(() => {
    const days = getTimeRangeDays(timeRange);
    if (days === Infinity) {
      return data;
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= cutoffDate;
    });
  }, [data, timeRange]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-medium">{title}</h3>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`button-range-${range}`}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000000}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, ""]}
            />
            <Bar 
              dataKey="sellVolume" 
              fill="hsl(0 72% 50%)" 
              radius={[4, 4, 0, 0]}
              name="Sell Volume"
            />
            <Bar 
              dataKey="buyVolume" 
              fill="hsl(142 76% 36%)" 
              radius={[4, 4, 0, 0]}
              name="Buy Volume"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-muted-foreground">Sell Volume</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-muted-foreground">Buy Volume</span>
        </div>
      </div>
    </Card>
  );
}
