import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter, RotateCcw } from "lucide-react";

export interface Filters {
  tradeType: string;
  dateFrom: string;
  dateTo: string;
  minValue: string;
  sector: string;
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onClear }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} data-testid="button-clear-filters">
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filters.tradeType && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.tradeType}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("tradeType", "")}
              />
            </Badge>
          )}
          {filters.sector && (
            <Badge variant="secondary" className="gap-1">
              Sector: {filters.sector}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("sector", "")}
              />
            </Badge>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label>Trade Type</Label>
            <Select value={filters.tradeType} onValueChange={(v) => updateFilter("tradeType", v)}>
              <SelectTrigger data-testid="select-trade-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="sell">Sell only</SelectItem>
                <SelectItem value="buy">Buy only</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sector</Label>
            <Select value={filters.sector} onValueChange={(v) => updateFilter("sector", v)}>
              <SelectTrigger data-testid="select-sector">
                <SelectValue placeholder="All sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sectors</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date From</Label>
            <Input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              data-testid="input-date-from"
            />
          </div>

          <div className="space-y-2">
            <Label>Min Value</Label>
            <Select value={filters.minValue} onValueChange={(v) => updateFilter("minValue", v)}>
              <SelectTrigger data-testid="select-min-value">
                <SelectValue placeholder="Any value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any value</SelectItem>
                <SelectItem value="100000">$100K+</SelectItem>
                <SelectItem value="500000">$500K+</SelectItem>
                <SelectItem value="1000000">$1M+</SelectItem>
                <SelectItem value="10000000">$10M+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  );
}
