import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from "recharts";

interface TimelineDataPoint {
  date: string;
  price: number;
  event?: {
    type: "sell" | "buy";
    executive: string;
    value: number;
  };
}

interface TimelineChartProps {
  data: TimelineDataPoint[];
  ticker: string;
}

export function TimelineChart({ data, ticker }: TimelineChartProps) {
  const events = data.filter(d => d.event);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-medium">Price Timeline with Insider Events</h3>
        <p className="text-sm text-muted-foreground">{ticker} stock price with annotated insider trades</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
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
              tickFormatter={(value) => `$${value}`}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string, props: { payload: TimelineDataPoint }) => {
                const lines: string[] = [`$${value.toFixed(2)}`];
                if (props.payload.event) {
                  lines.push(`${props.payload.event.type.toUpperCase()}: ${props.payload.event.executive}`);
                }
                return lines;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {events.map((event, idx) => (
              <ReferenceDot
                key={idx}
                x={event.date}
                y={event.price}
                r={8}
                fill={event.event?.type === "sell" ? "hsl(0 72% 50%)" : "hsl(142 76% 36%)"}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Insider Sell</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Insider Buy</span>
        </div>
      </div>
    </Card>
  );
}
