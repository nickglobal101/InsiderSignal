import { useState } from "react";
import { StockInfoDialog } from "./StockInfoDialog";

interface ClickableTickerProps {
  ticker: string;
  className?: string;
  children?: React.ReactNode;
}

export function ClickableTicker({ ticker, className = "", children }: ClickableTickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDialogOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`cursor-pointer hover:underline hover:text-primary transition-colors ${className}`}
        data-testid={`button-ticker-${ticker}`}
      >
        {children || ticker}
      </button>
      <StockInfoDialog
        ticker={ticker}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
