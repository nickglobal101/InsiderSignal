import { Badge } from "@/components/ui/badge";

interface TradeBadgeProps {
  type: "buy" | "sell" | "exercise" | "gift";
}

export function TradeBadge({ type }: TradeBadgeProps) {
  const config = {
    buy: { label: "BUY", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    sell: { label: "SELL", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    exercise: { label: "EXERCISE", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    gift: { label: "GIFT", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  };

  const { label, className } = config[type];

  return (
    <Badge variant="outline" className={`${className} border-0 font-mono text-xs`}>
      {label}
    </Badge>
  );
}
