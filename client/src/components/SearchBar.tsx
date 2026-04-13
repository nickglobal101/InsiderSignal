import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Building2, User, FileText, Loader2, Landmark, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: string;
  type: "company" | "executive" | "trade" | "congressional" | "fund" | "institutional";
  title: string;
  subtitle: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchBar({ onSearch, onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = await res.json();
      
      const results: SearchResult[] = [];
      
      data.companies?.forEach((c: any) => {
        results.push({
          id: `company-${c.id}`,
          type: "company",
          title: c.name,
          subtitle: `${c.ticker} - ${c.sector || "Company"}`,
        });
      });
      
      data.executives?.forEach((e: any) => {
        results.push({
          id: `exec-${e.id}`,
          type: "executive",
          title: e.name,
          subtitle: `${e.title} - ${e.companyTicker}`,
        });
      });
      
      data.trades?.slice(0, 3).forEach((t: any) => {
        results.push({
          id: `trade-${t.id}`,
          type: "trade",
          title: `${t.executive} - ${t.ticker}`,
          subtitle: `${t.type.toUpperCase()} ${t.shares?.toLocaleString() || ""} shares`,
        });
      });
      
      data.congressionalTrades?.slice(0, 3).forEach((t: any) => {
        results.push({
          id: `cong-${t.id}`,
          type: "congressional",
          title: `${t.member} - ${t.ticker}`,
          subtitle: `${t.type.toUpperCase()} ${t.amountRange}`,
        });
      });
      
      data.institutionalFunds?.forEach((f: any) => {
        results.push({
          id: `fund-${f.id}`,
          type: "fund",
          title: f.name,
          subtitle: f.manager ? `Managed by ${f.manager}` : f.type || "Institutional Fund",
        });
      });
      
      data.institutionalTrades?.slice(0, 5).forEach((t: any) => {
        const valueStr = t.value >= 1e9 ? `$${(t.value / 1e9).toFixed(1)}B` : 
                         t.value >= 1e6 ? `$${(t.value / 1e6).toFixed(1)}M` : 
                         `$${(t.value / 1e3).toFixed(0)}K`;
        results.push({
          id: `inst-${t.id}`,
          type: "institutional",
          title: `${t.fundName} - ${t.ticker}`,
          subtitle: `${t.type.toUpperCase()} ${valueStr}`,
        });
      });
      
      return results.slice(0, 10);
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "company":
        return <Building2 className="h-4 w-4 text-muted-foreground" />;
      case "executive":
        return <User className="h-4 w-4 text-muted-foreground" />;
      case "trade":
      case "congressional":
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "fund":
        return <Landmark className="h-4 w-4 text-muted-foreground" />;
      case "institutional":
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const results = searchResults || [];

  return (
    <div className="relative w-full max-w-96">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search companies, executives, or filings..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden">
          <div className="py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <button
                  key={result.id}
                  className="w-full flex items-center gap-3 px-4 py-2 hover-elevate text-left"
                  onClick={() => {
                    onResultClick?.(result);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  data-testid={`search-result-${result.id}`}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="px-4 py-2 text-sm text-muted-foreground">No results found</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
