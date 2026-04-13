import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, User, TrendingDown, TrendingUp, ExternalLink, Globe, Landmark } from "lucide-react";
import type { InsiderTrade, CongressionalTrade, Company, Executive, InstitutionalFund, InstitutionalTrade } from "@shared/schema";

interface ExternalCompany {
  symbol: string;
  name: string;
  exchange: string;
  exchangeShortName: string;
  type: string;
}

interface ExternalInsiderTrade {
  id: string;
  ticker: string;
  company: string;
  executive: string;
  title: string;
  type: string;
  shares: number;
  value: number;
  pricePerShare: number;
  date: string;
  filingDate: string;
  filingUrl: string;
  source: string;
}

interface ExternalCongressionalTrade {
  id: string;
  member: string;
  party: string;
  chamber: string;
  state: string;
  ticker: string;
  company: string;
  type: string;
  amountRange: string;
  disclosedDate: string;
  tradeDate: string;
  source: string;
}

interface SearchContext {
  query: string;
  searchedSources: string[];
  noResultsReason?: string;
  suggestion?: string;
}

interface SearchResults {
  trades: InsiderTrade[];
  congressionalTrades: CongressionalTrade[];
  companies: Company[];
  executives: Executive[];
  institutionalFunds?: InstitutionalFund[];
  institutionalTrades?: InstitutionalTrade[];
  externalCompanies?: ExternalCompany[];
  externalInsiderTrades?: ExternalInsiderTrade[];
  externalCongressionalTrades?: ExternalCongressionalTrade[];
  searchContext?: SearchContext;
}

const recentSearches = ["AAPL", "Tim Cook", "Nancy Pelosi", "NVDA"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return { trades: [], congressionalTrades: [], companies: [], executives: [] };
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      return res.json();
    },
    enabled: searchTerm.length >= 2,
  });

  const handleSearch = () => {
    if (query.trim()) {
      setSearchTerm(query.trim());
    }
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setSearchTerm(term);
  };

  const hasResults = results && (
    (results.trades?.length || 0) > 0 ||
    (results.congressionalTrades?.length || 0) > 0 ||
    (results.companies?.length || 0) > 0 ||
    (results.executives?.length || 0) > 0 ||
    (results.institutionalFunds?.length || 0) > 0 ||
    (results.institutionalTrades?.length || 0) > 0 ||
    (results.externalCompanies?.length || 0) > 0 ||
    (results.externalInsiderTrades?.length || 0) > 0 ||
    (results.externalCongressionalTrades?.length || 0) > 0
  );

  const totalResults = results
    ? (results.trades?.length || 0) + 
      (results.congressionalTrades?.length || 0) + 
      (results.companies?.length || 0) + 
      (results.executives?.length || 0) + 
      (results.institutionalFunds?.length || 0) + 
      (results.institutionalTrades?.length || 0) + 
      (results.externalCompanies?.length || 0) +
      (results.externalInsiderTrades?.length || 0) +
      (results.externalCongressionalTrades?.length || 0)
    : 0;
  
  const companiesCount = (results?.companies?.length || 0) + (results?.institutionalFunds?.length || 0) + (results?.externalCompanies?.length || 0);
  const tradesCount = (results?.trades?.length || 0) + (results?.congressionalTrades?.length || 0) + (results?.institutionalTrades?.length || 0) + (results?.externalInsiderTrades?.length || 0) + (results?.externalCongressionalTrades?.length || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-search-title">
          Search
        </h1>
        <p className="text-muted-foreground mt-1">
          Find companies, executives, or politicians
        </p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by company name, ticker, executive, or politician..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
              data-testid="input-main-search"
            />
          </div>
          <Button onClick={handleSearch} data-testid="button-search">
            Search
          </Button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Recent searches</p>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch(term)}
                data-testid={`recent-search-${term}`}
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {searchTerm && (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              All Results ({totalResults})
            </TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">
              Trades ({tradesCount})
            </TabsTrigger>
            <TabsTrigger value="companies" data-testid="tab-companies">
              Companies ({companiesCount})
            </TabsTrigger>
            <TabsTrigger value="people" data-testid="tab-people">
              People ({results?.executives.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
                ))}
              </div>
            ) : hasResults ? (
              <div className="space-y-2">
                {results?.trades.map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`trade-result-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{trade.executive}</span>
                          <Badge variant="outline" className="text-xs">
                            {trade.ticker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.title} - {trade.company}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.type === "sell" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">
                            ${(trade.value / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.date}</p>
                      </div>

                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {results?.congressionalTrades.map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`cong-result-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{trade.member}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              trade.party === "D"
                                ? "text-blue-600 border-blue-600"
                                : trade.party === "R"
                                ? "text-red-600 border-red-600"
                                : ""
                            }`}
                          >
                            {trade.party}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trade.ticker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.chamber} - {trade.state}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.type === "sell" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">{trade.amountRange}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.disclosedDate}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.institutionalTrades?.map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`inst-trade-result-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Landmark className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{trade.fundName}</span>
                          <Badge variant="outline" className="text-xs">
                            {trade.ticker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.company}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.type === "sell" || trade.type === "exit" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">
                            {trade.shares?.toLocaleString() || 0} shares
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.reportDate}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.externalInsiderTrades?.map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`ext-insider-result-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          <Globe className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{trade.executive}</span>
                          <Badge variant="outline" className="text-xs">
                            {trade.ticker}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            SEC Form 4
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.title} - {trade.company}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.type === "sell" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">
                            ${(trade.value / 1000000).toFixed(2)}M
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.date}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.externalCongressionalTrades?.map((trade) => (
                  <Card
                    key={trade.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`ext-cong-result-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          <Globe className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{trade.member}</span>
                          <Badge variant="secondary" className="text-xs">
                            {trade.chamber}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {trade.ticker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.company}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {trade.type === "sell" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm">{trade.amountRange}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{trade.disclosedDate}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.institutionalFunds?.map((fund) => (
                  <Card
                    key={fund.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`fund-result-${fund.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Landmark className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{fund.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Institutional Fund
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fund.manager} - AUM: ${((fund.aum || 0) / 1e9).toFixed(1)}B
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.companies.map((company) => (
                  <Card
                    key={company.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`company-result-${company.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{company.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {company.ticker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{company.sector}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.externalCompanies?.map((company) => (
                  <Card
                    key={company.symbol}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`external-company-${company.symbol}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          <Globe className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{company.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {company.symbol}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {company.exchangeShortName || company.exchange}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {company.type === 'stock' ? 'Stock' : company.type} - Found via web search
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results?.executives.map((exec) => (
                  <Card
                    key={exec.id}
                    className="p-4 hover-elevate cursor-pointer"
                    data-testid={`exec-result-${exec.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{exec.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {exec.companyTicker}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exec.title}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {results?.searchContext?.noResultsReason 
                    ? "No trades found" 
                    : "No results found"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {results?.searchContext?.noResultsReason || 
                    "Try searching for a different company, executive, or politician."}
                </p>
                {results?.searchContext?.suggestion && (
                  <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
                    {results.searchContext.suggestion}
                  </p>
                )}
                {results?.searchContext?.searchedSources && results.searchContext.searchedSources.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Searched: {results.searchContext.searchedSources.join(', ')}
                    </p>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            <div className="space-y-2">
              {results?.trades.map((trade) => (
                <Card
                  key={trade.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`trade-tab-${trade.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{trade.executive}</span>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - ${(trade.value / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.congressionalTrades.map((trade) => (
                <Card
                  key={trade.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`cong-tab-${trade.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{trade.member}</span>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - {trade.amountRange}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.institutionalTrades?.map((trade) => (
                <Card
                  key={trade.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`inst-tab-${trade.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Landmark className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{trade.fundName}</span>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - {trade.shares?.toLocaleString()} shares
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.externalInsiderTrades?.map((trade) => (
                <Card
                  key={trade.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`ext-insider-tab-${trade.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <Globe className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{trade.executive}</span>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - ${(trade.value / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.externalCongressionalTrades?.map((trade) => (
                <Card
                  key={trade.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`ext-cong-tab-${trade.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <Globe className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{trade.member}</span>
                      <p className="text-sm text-muted-foreground">
                        {trade.ticker} - {trade.amountRange}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <div className="space-y-2">
              {results?.companies.map((company) => (
                <Card
                  key={company.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`company-tab-${company.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{company.name}</span>
                      <p className="text-sm text-muted-foreground">{company.ticker}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.institutionalFunds?.map((fund) => (
                <Card
                  key={fund.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`fund-tab-${fund.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Landmark className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{fund.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {fund.manager} - AUM: ${((fund.aum || 0) / 1e9).toFixed(1)}B
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              {results?.externalCompanies?.map((company) => (
                <Card
                  key={company.symbol}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`external-tab-${company.symbol}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        <Globe className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{company.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {company.symbol}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {company.exchangeShortName || company.exchange}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {company.type === 'stock' ? 'Stock' : company.type} - Found via web search
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <div className="space-y-2">
              {results?.executives.map((exec) => (
                <Card
                  key={exec.id}
                  className="p-4 hover-elevate cursor-pointer"
                  data-testid={`exec-tab-${exec.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{exec.name}</span>
                      <p className="text-sm text-muted-foreground">{exec.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
