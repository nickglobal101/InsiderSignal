import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  tradeFiltersSchema,
  congressionalFiltersSchema,
  alertFiltersSchema,
  socialBuzzFiltersSchema,
  ipoFiltersSchema,
  insertAlertPreferencesSchema,
  institutionalFiltersSchema,
} from "@shared/schema";
import { startScheduler, triggerManualIpoCheck } from "./scheduler";
import {
  fetchRecentForm4Filings,
  fetchRecentCongressionalTrades,
} from "./sec-api";
import { fetchRedditBuzz } from "./reddit-api";
import { analyzeTradesForPatterns } from "./ai-analysis";
import { setupAuth, isAuthenticated } from "./auth";
import { initializeInstitutionalFunds, fetchInstitutionalTrades, clearInstitutionalTrades } from "./institutional-fetcher";
import { fetchForeignInstitutionalTrades } from "./foreign-trade-fetcher";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Accept disclaimer
  app.post('/api/auth/accept-disclaimer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.updateUserDisclaimerAccepted(userId);
      res.json(user);
    } catch (error) {
      console.error("Error accepting disclaimer:", error);
      res.status(500).json({ message: "Failed to accept disclaimer" });
    }
  });

  // Initialize sample data on startup
  await initializeSampleData();

  // GET /api/trades - Insider trades with filters
  app.get("/api/trades", async (req, res) => {
    try {
      const filters = tradeFiltersSchema.parse({
        type: req.query.type as string,
        ticker: req.query.ticker as string,
        executive: req.query.executive as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        minValue: req.query.minValue ? Number(req.query.minValue) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });

      const trades = await storage.getInsiderTrades(filters);
      res.json(trades);
    } catch (err) {
      console.error("Error fetching trades:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // GET /api/trades/:id - Single trade by ID
  app.get("/api/trades/:id", async (req, res) => {
    const trade = await storage.getInsiderTradeById(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    res.json(trade);
  });

  // GET /api/congressional - Congressional trades with filters
  app.get("/api/congressional", async (req, res) => {
    try {
      const filters = congressionalFiltersSchema.parse({
        party: req.query.party as string,
        chamber: req.query.chamber as string,
        ticker: req.query.ticker as string,
        member: req.query.member as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });

      const trades = await storage.getCongressionalTrades(filters);
      res.json(trades);
    } catch (err) {
      console.error("Error fetching congressional trades:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // GET /api/alerts - AI-generated alerts with filters
  app.get("/api/alerts", async (req, res) => {
    try {
      const filters = alertFiltersSchema.parse({
        severity: req.query.severity as string,
        type: req.query.type as string,
        dismissed: req.query.dismissed === "true",
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      const alerts = await storage.getAlerts(filters);
      res.json(alerts);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // POST /api/alerts/:id/dismiss - Dismiss an alert
  app.post("/api/alerts/:id/dismiss", async (req, res) => {
    const alert = await storage.dismissAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json(alert);
  });

  // GET /api/search - Unified search with external API fallback
  app.get("/api/search", async (req, res) => {
    const query = (req.query.q as string) || "";
    if (!query || query.length < 2) {
      return res.json({
        trades: [],
        congressionalTrades: [],
        companies: [],
        executives: [],
        externalCompanies: [],
        externalInsiderTrades: [],
        externalCongressionalTrades: [],
      });
    }

    const results = await storage.search(query);
    
    // Check if we have meaningful local results for each category
    const hasLocalTradeResults = results.trades.length > 0;
    const hasLocalCongressionalResults = results.congressionalTrades.length > 0;
    const hasLocalCompanyResults = 
      results.companies.length > 0 ||
      (results.institutionalFunds?.length || 0) > 0;
    
    console.log(`[Search] Query: "${query}" - Local results: trades=${results.trades.length}, congressional=${results.congressionalTrades.length}, companies=${results.companies.length}, funds=${results.institutionalFunds?.length || 0}`);
    
    const FMP_API_KEY = process.env.FMP_API_KEY;
    console.log(`[Search] FMP_API_KEY configured: ${!!FMP_API_KEY}`);
    
    // External search results
    let externalCompanies: Array<{
      symbol: string;
      name: string;
      exchange: string;
      exchangeShortName: string;
      type: string;
    }> = [];
    
    let externalInsiderTrades: Array<{
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
    }> = [];
    
    let externalCongressionalTrades: Array<{
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
    }> = [];
    
    if (FMP_API_KEY) {
      const externalSearchPromises: Promise<void>[] = [];
      
      // Search for companies if no local company results
      if (!hasLocalCompanyResults) {
        externalSearchPromises.push((async () => {
          try {
            const searchUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`;
            const response = await fetch(searchUrl);
            if (response.ok) {
              const fmpResults = await response.json();
              if (Array.isArray(fmpResults)) {
                externalCompanies = fmpResults.map((item: any) => ({
                  symbol: item.symbol || '',
                  name: item.name || '',
                  exchange: item.exchange || '',
                  exchangeShortName: item.exchangeShortName || '',
                  type: item.type || 'stock',
                }));
              }
            }
          } catch (error) {
            console.error("[Search] Error fetching companies from FMP API:", error);
          }
        })());
      }
      
      // Search for insider trades by name (for executives like Elon Musk)
      // Use SEC EDGAR full-text search API which is free and reliable
      if (!hasLocalTradeResults) {
        console.log(`[Search] Fetching external insider trades for: "${query}"`);
        externalSearchPromises.push((async () => {
          try {
            // SEC EDGAR Full-Text Search API for Form 4 filings
            const secSearchUrl = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}&forms=4&dateRange=custom&startdt=2024-01-01&enddt=2025-12-31&from=0&size=20`;
            console.log(`[Search] SEC EDGAR search URL: ${secSearchUrl}`);
            
            const response = await fetch(secSearchUrl, {
              headers: {
                'User-Agent': 'InsiderSignal/1.0 (contact@insidersignal.com)',
                'Accept': 'application/json',
              },
            });
            console.log(`[Search] SEC EDGAR response status: ${response.status}`);
            
            if (response.ok) {
              const secResults = await response.json();
              const hits = secResults.hits?.hits || [];
              console.log(`[Search] SEC EDGAR results count: ${hits.length}`);
              
              if (hits.length > 0) {
                externalInsiderTrades = hits.slice(0, 20).map((hit: any, index: number) => {
                  const source = hit._source || {};
                  const displayNames = source.display_names || [];
                  const ciks = source.ciks || [];
                  const adsh = source.adsh || '';
                  
                  // Extract ticker from display_names - format: "Company Name (TICKER) (CIK xxx)"
                  let ticker = '';
                  let companyName = '';
                  let executiveName = '';
                  
                  for (const name of displayNames) {
                    // Match pattern like "(TSLA)" or "(AAPL)"
                    const tickerMatch = name.match(/\(([A-Z]{1,5})\)/);
                    if (tickerMatch) {
                      ticker = tickerMatch[1];
                      // Company is the part before the ticker
                      companyName = name.split('(')[0].trim();
                    }
                    // Check if this is the executive (matches our query)
                    if (name.toLowerCase().includes(query.toLowerCase())) {
                      executiveName = name.split('(')[0].trim();
                    }
                  }
                  
                  // If no executive found, use the first name that's a person (no ticker pattern)
                  if (!executiveName) {
                    const personName = displayNames.find((n: string) => !n.includes('(') || /CIK \d+\)$/.test(n));
                    executiveName = personName ? personName.split('(')[0].trim() : displayNames[0]?.split('(')[0].trim() || 'Unknown';
                  }
                  
                  // Get the company CIK (usually the second one in the array)
                  const companyCik = ciks.length > 1 ? ciks[1] : ciks[0] || '';
                  
                  return {
                    id: `sec-${index}-${adsh}`,
                    ticker: ticker,
                    company: companyName || 'Unknown Company',
                    executive: executiveName,
                    title: 'Insider',
                    type: 'Form 4 Filing' as string,
                    shares: 0,
                    value: 0,
                    pricePerShare: 0,
                    date: source.file_date || '',
                    filingDate: source.file_date || '',
                    filingUrl: adsh ? `https://www.sec.gov/Archives/edgar/data/${companyCik?.replace(/^0+/, '')}/${adsh.replace(/-/g, '')}/${adsh}-index.htm` : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${companyCik}&type=4`,
                    source: 'sec',
                  };
                });
              }
            }
          } catch (error) {
            console.error("[Search] Error fetching insider trades from SEC EDGAR:", error);
          }
        })());
      }
      
      // Search for congressional trades by name (for members like Nancy Pelosi)
      if (!hasLocalCongressionalResults) {
        console.log(`[Search] Fetching external congressional trades for: "${query}"`);
        externalSearchPromises.push((async () => {
          try {
            // FMP endpoints for House and Senate trades (use house-latest and senate-latest, not house-disclosure)
            const [houseResponse, senateResponse] = await Promise.all([
              fetch(`https://financialmodelingprep.com/stable/house-latest?apikey=${FMP_API_KEY}`),
              fetch(`https://financialmodelingprep.com/stable/senate-latest?apikey=${FMP_API_KEY}`),
            ]);
            console.log(`[Search] Congressional API response: House=${houseResponse.status}, Senate=${senateResponse.status}`);
            
            const queryLower = query.toLowerCase();
            const matchesMember = (firstName: string, lastName: string) => {
              const fullName = `${firstName} ${lastName}`.toLowerCase();
              return fullName.includes(queryLower) || 
                     queryLower.includes(firstName.toLowerCase()) ||
                     queryLower.includes(lastName.toLowerCase());
            };
            
            if (houseResponse.ok) {
              const houseData = await houseResponse.json();
              if (Array.isArray(houseData)) {
                const matchingHouseTrades = houseData
                  .filter((item: any) => matchesMember(item.firstName || '', item.lastName || ''))
                  .slice(0, 10)
                  .map((item: any, index: number) => ({
                    id: `fmp-house-${index}-${item.symbol || ''}`,
                    member: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
                    party: 'I' as string,
                    chamber: 'House' as string,
                    state: item.district?.substring(0, 2) || 'XX',
                    ticker: item.symbol?.toUpperCase() || '',
                    company: item.assetDescription || item.symbol || '',
                    type: item.type?.toLowerCase().includes('purchase') ? 'buy' : 'sell',
                    amountRange: item.amount || '$1 - $15,000',
                    disclosedDate: item.disclosureDate || '',
                    tradeDate: item.transactionDate || '',
                    source: 'fmp',
                  }));
                externalCongressionalTrades.push(...matchingHouseTrades);
              }
            }
            
            if (senateResponse.ok) {
              const senateData = await senateResponse.json();
              if (Array.isArray(senateData)) {
                const matchingSenateTrades = senateData
                  .filter((item: any) => matchesMember(item.firstName || '', item.lastName || ''))
                  .slice(0, 10)
                  .map((item: any, index: number) => ({
                    id: `fmp-senate-${index}-${item.symbol || ''}`,
                    member: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
                    party: 'I' as string,
                    chamber: 'Senate' as string,
                    state: 'XX',
                    ticker: item.symbol?.toUpperCase() || '',
                    company: item.assetDescription || item.symbol || '',
                    type: item.type?.toLowerCase().includes('purchase') ? 'buy' : 'sell',
                    amountRange: item.amount || '$1 - $15,000',
                    disclosedDate: item.disclosureDate || '',
                    tradeDate: item.transactionDate || '',
                    source: 'fmp',
                  }));
                externalCongressionalTrades.push(...matchingSenateTrades);
              }
            }
          } catch (error) {
            console.error("[Search] Error fetching congressional trades from FMP API:", error);
          }
        })());
      }
      
      // Wait for all external searches to complete
      await Promise.all(externalSearchPromises);
    }
    
    // Determine if this looks like a person search vs company search
    const looksLikePersonSearch = query.split(' ').length >= 2 && 
      !query.match(/^[A-Z]{1,5}$/) && // Not a ticker
      !query.toLowerCase().includes('inc') &&
      !query.toLowerCase().includes('corp') &&
      !query.toLowerCase().includes('llc');
    
    const totalResults = 
      results.trades.length + 
      results.congressionalTrades.length + 
      results.companies.length + 
      results.executives.length +
      (results.institutionalFunds?.length || 0) +
      (results.institutionalTrades?.length || 0) +
      externalCompanies.length +
      externalInsiderTrades.length +
      externalCongressionalTrades.length;
    
    // Build search context for empty results messaging
    let searchContext: {
      query: string;
      searchedSources: string[];
      noResultsReason?: string;
      suggestion?: string;
    } = {
      query,
      searchedSources: ['Local database'],
    };
    
    if (FMP_API_KEY) {
      if (!hasLocalCongressionalResults) {
        searchContext.searchedSources.push('Congressional disclosures (FMP)');
      }
      if (!hasLocalTradeResults) {
        searchContext.searchedSources.push('SEC EDGAR Form 4 filings');
      }
    }
    
    // Provide contextual reasons for empty results
    if (totalResults === 0) {
      if (looksLikePersonSearch) {
        // Person search with no results
        const firstWord = query.split(' ')[0];
        if (externalCongressionalTrades.length === 0 && !hasLocalCongressionalResults) {
          searchContext.noResultsReason = `No recent stock trades found for "${query}". This person may not have made any publicly disclosed trades recently, or may not be a member of Congress or corporate insider.`;
          searchContext.suggestion = `Congressional trade data includes only recent disclosures. SEC insider filings are limited to corporate executives of public companies.`;
        } else {
          searchContext.noResultsReason = `No matching results found for "${query}".`;
          searchContext.suggestion = `Try searching for a company ticker (like AAPL or TSLA), a company name, or a different person's name.`;
        }
      } else {
        searchContext.noResultsReason = `No results found for "${query}".`;
        searchContext.suggestion = `Try searching for a company ticker symbol (e.g., AAPL, TSLA), company name, executive name, or Congress member.`;
      }
    }
    
    res.json({
      ...results,
      externalCompanies,
      externalInsiderTrades,
      externalCongressionalTrades,
      searchContext,
    });
  });

  // GET /api/metrics - Dashboard metrics
  app.get("/api/metrics", async (req, res) => {
    const metrics = await storage.getMetrics();
    res.json(metrics);
  });

  // GET /api/volume - Volume chart data
  app.get("/api/volume", async (req, res) => {
    const trades = await storage.getInsiderTrades();
    
    // Group trades by week and calculate volumes
    const volumeByDate: Record<string, { sellVolume: number; buyVolume: number }> = {};
    
    trades.forEach((trade) => {
      const date = trade.date;
      if (!volumeByDate[date]) {
        volumeByDate[date] = { sellVolume: 0, buyVolume: 0 };
      }
      if (trade.type === "sell") {
        volumeByDate[date].sellVolume += trade.value;
      } else if (trade.type === "buy") {
        volumeByDate[date].buyVolume += trade.value;
      }
    });

    const volumeData = Object.entries(volumeByDate)
      .map(([date, volumes]) => ({
        date,
        ...volumes,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(volumeData);
  });

  // POST /api/refresh - Trigger data refresh and AI analysis
  app.post("/api/refresh", async (req, res) => {
    try {
      // Clear existing data
      await storage.clearInsiderTrades();
      await storage.clearCongressionalTrades();
      await storage.clearAlerts();
      await storage.clearSocialBuzz();

      // Fetch real SEC EDGAR Form 4 data
      const secResult = await fetchRecentForm4Filings();
      await storage.createInsiderTrades(secResult.data);
      await storage.updateDataSource("sec_edgar", secResult.status, secResult.recordCount, secResult.errorMessage);

      // Fetch real congressional trades from House/Senate Stock Watcher
      const congressionalResult = await fetchRecentCongressionalTrades();
      await storage.createCongressionalTrades(congressionalResult.data);
      await storage.updateDataSource("congressional", congressionalResult.status, congressionalResult.recordCount, congressionalResult.errorMessage);

      // Fetch Reddit social buzz data
      const redditResult = await fetchRedditBuzz();
      await storage.createSocialBuzzBatch(redditResult.data);
      await storage.updateDataSource("reddit_buzz", redditResult.status, redditResult.recordCount, redditResult.errorMessage);

      // Run AI analysis to generate alerts
      const trades = await storage.getInsiderTrades();
      const congTrades = await storage.getCongressionalTrades();
      
      try {
        const alerts = await analyzeTradesForPatterns(trades, congTrades);
        for (const alert of alerts) {
          await storage.createAlert(alert);
        }
      } catch (aiError) {
        console.error("AI analysis skipped (no API key configured):", aiError);
      }

      res.json({ success: true, message: "Data refreshed successfully" });
    } catch (err) {
      console.error("Error refreshing data:", err);
      res.status(500).json({ error: "Failed to refresh data" });
    }
  });

  // GET /api/companies - List tracked companies
  app.get("/api/companies", async (req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  // GET /api/executives - List tracked executives
  app.get("/api/executives", async (req, res) => {
    const executives = await storage.getExecutives();
    res.json(executives);
  });

  // GET /api/data-sources - Get all data source statuses
  app.get("/api/data-sources", async (req, res) => {
    const dataSources = await storage.getDataSources();
    res.json(dataSources);
  });

  // GET /api/social-buzz - Get social buzz data
  app.get("/api/social-buzz", async (req, res) => {
    try {
      const filters = socialBuzzFiltersSchema.parse({
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sentiment: req.query.sentiment as string,
      });

      const buzz = await storage.getSocialBuzz(filters);
      res.json(buzz);
    } catch (err) {
      console.error("Error fetching social buzz:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // ============ Stock Quote Routes ============
  
  // GET /api/stock/:ticker - Get real-time stock quote from Finnhub
  app.get("/api/stock/:ticker", async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const apiKey = process.env.FINNHUB_API_KEY;
      
      if (!apiKey) {
        return res.status(503).json({ 
          error: "Stock data service not configured",
          ticker,
        });
      }

      // Fetch quote data from Finnhub
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`;
      
      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(quoteUrl),
        fetch(profileUrl),
      ]);

      if (!quoteResponse.ok) {
        console.error(`Finnhub quote API error: ${quoteResponse.status}`);
        return res.status(502).json({ error: "Failed to fetch stock data" });
      }

      const quote = await quoteResponse.json();
      const profile = profileResponse.ok ? await profileResponse.json() : {};

      // Finnhub returns c=0 for invalid tickers
      if (!quote.c || quote.c === 0) {
        return res.status(404).json({ 
          error: "Stock not found",
          ticker,
        });
      }

      res.json({
        ticker,
        name: profile.name || ticker,
        currentPrice: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
        timestamp: quote.t ? new Date(quote.t * 1000).toISOString() : new Date().toISOString(),
        logo: profile.logo || null,
        industry: profile.finnhubIndustry || null,
        marketCap: profile.marketCapitalization || null,
        weburl: profile.weburl || null,
        exchange: profile.exchange || null,
      });
    } catch (err) {
      console.error("Error fetching stock quote:", err);
      res.status(500).json({ error: "Failed to fetch stock data" });
    }
  });

  // ============ IPO Routes ============

  // GET /api/ipos - Get IPO calendar
  app.get("/api/ipos", async (req, res) => {
    try {
      const filters = ipoFiltersSchema.parse({
        status: req.query.status as string,
        stage: req.query.stage as string,
        exchange: req.query.exchange as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      const ipos = await storage.getIpos(filters);
      res.json(ipos);
    } catch (err) {
      console.error("Error fetching IPOs:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // GET /api/ipos/:id - Get single IPO
  app.get("/api/ipos/:id", async (req, res) => {
    const ipo = await storage.getIpoById(req.params.id);
    if (!ipo) {
      return res.status(404).json({ error: "IPO not found" });
    }
    res.json(ipo);
  });

  // POST /api/ipos/refresh - Trigger manual IPO check (admin/premium only)
  app.post("/api/ipos/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ error: "Premium subscription required" });
      }

      const result = await triggerManualIpoCheck();
      res.json({ 
        success: true, 
        message: `Found ${result.newIpos} new IPOs, sent ${result.notifications} notifications` 
      });
    } catch (err) {
      console.error("Error refreshing IPOs:", err);
      res.status(500).json({ error: "Failed to refresh IPOs" });
    }
  });

  // ============ Institutional Trades Routes ============

  // GET /api/institutional/funds - Get all tracked institutional funds
  app.get("/api/institutional/funds", async (req, res) => {
    try {
      const funds = await storage.getInstitutionalFunds();
      res.json(funds);
    } catch (err) {
      console.error("Error fetching institutional funds:", err);
      res.status(500).json({ error: "Failed to fetch funds" });
    }
  });

  // GET /api/institutional/funds/:id - Get single fund
  app.get("/api/institutional/funds/:id", async (req, res) => {
    const fund = await storage.getInstitutionalFundById(req.params.id);
    if (!fund) {
      return res.status(404).json({ error: "Fund not found" });
    }
    res.json(fund);
  });

  // GET /api/institutional/trades - Get institutional trades with filters
  app.get("/api/institutional/trades", async (req, res) => {
    try {
      const filters = institutionalFiltersSchema.parse({
        fundId: req.query.fundId as string,
        ticker: req.query.ticker as string,
        type: req.query.type as string,
        significance: req.query.significance as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });

      const trades = await storage.getInstitutionalTrades(filters);
      res.json(trades);
    } catch (err) {
      console.error("Error fetching institutional trades:", err);
      res.status(400).json({ error: "Invalid filters" });
    }
  });

  // GET /api/institutional/trades/:id - Get single trade
  app.get("/api/institutional/trades/:id", async (req, res) => {
    const trade = await storage.getInstitutionalTradeById(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    res.json(trade);
  });

  // POST /api/institutional/refresh - Refresh institutional trades with real SEC data
  app.post("/api/institutional/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ error: "Premium subscription required" });
      }

      console.log("[API] Clearing stale institutional trades and fetching real SEC data...");
      await clearInstitutionalTrades();
      const result = await fetchInstitutionalTrades();
      
      res.json({ 
        success: result.status !== "failed", 
        status: result.status,
        recordCount: result.recordCount,
        message: result.errorMessage || `Successfully fetched ${result.recordCount} real trades from SEC EDGAR`
      });
    } catch (err) {
      console.error("Error refreshing institutional trades:", err);
      res.status(500).json({ error: "Failed to refresh institutional trades" });
    }
  });

  // ============ Alert Preferences Routes (Premium) ============

  // GET /api/alert-preferences - Get user's alert preferences
  app.get("/api/alert-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prefs = await storage.getAlertPreferences(userId);
      
      if (!prefs) {
        return res.json({
          userId,
          emailAlertsEnabled: false,
          ipoAlertsEnabled: true,
          insiderAlertsEnabled: true,
          congressionalAlertsEnabled: true,
          patternAlertsEnabled: true,
          alertFrequency: "immediate",
          minAlertSeverity: "medium",
          watchlistTickers: [],
        });
      }
      
      res.json(prefs);
    } catch (err) {
      console.error("Error fetching alert preferences:", err);
      res.status(500).json({ error: "Failed to fetch alert preferences" });
    }
  });

  // PUT /api/alert-preferences - Update alert preferences (Premium only)
  app.put("/api/alert-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ error: "Premium subscription required to enable email alerts" });
      }

      // Get existing preferences or use defaults
      const existingPrefs = await storage.getAlertPreferences(user.id);
      const defaults = {
        userId: user.id,
        emailAlertsEnabled: false,
        ipoAlertsEnabled: true,
        insiderAlertsEnabled: true,
        congressionalAlertsEnabled: true,
        patternAlertsEnabled: true,
        alertFrequency: "immediate",
        minAlertSeverity: "medium",
        watchlistTickers: [],
      };

      // Merge: defaults -> existing -> request body (partial update support)
      const prefsData = {
        ...defaults,
        ...(existingPrefs || {}),
        ...req.body,
        userId: user.id, // Always use authenticated user's ID
      };

      const prefs = await storage.createOrUpdateAlertPreferences(prefsData);
      res.json(prefs);
    } catch (err) {
      console.error("Error updating alert preferences:", err);
      res.status(500).json({ error: "Failed to update alert preferences" });
    }
  });

  // GET /api/email-notifications - Get user's notification history
  app.get("/api/email-notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const notifications = await storage.getEmailNotifications(userId, limit);
      res.json(notifications);
    } catch (err) {
      console.error("Error fetching email notifications:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // GET /api/user-preferences - Get user's app preferences
  app.get("/api/user-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const prefs = await storage.getUserPreferences(userId);
      
      if (!prefs) {
        return res.json({
          userId,
          autoRefresh: true,
          refreshInterval: 5,
          showSampleData: true,
          defaultTradeView: "all",
          compactMode: false,
        });
      }
      
      res.json(prefs);
    } catch (err) {
      console.error("Error fetching user preferences:", err);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // PUT /api/user-preferences - Update user's app preferences
  app.put("/api/user-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const existingPrefs = await storage.getUserPreferences(userId);
      const defaults = {
        userId,
        autoRefresh: true,
        refreshInterval: 5,
        showSampleData: true,
        defaultTradeView: "all",
        compactMode: false,
      };

      const prefsData = {
        ...defaults,
        ...(existingPrefs || {}),
        ...req.body,
        userId,
      };

      const prefs = await storage.createOrUpdateUserPreferences(prefsData);
      res.json(prefs);
    } catch (err) {
      console.error("Error updating user preferences:", err);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // ============ Subscription Routes ============

  // GET /api/subscription - Get user's subscription status
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        tier: user.subscriptionTier || "free",
        expiresAt: user.subscriptionExpiresAt,
        features: user.subscriptionTier === "premium" ? {
          fullHistoricalData: true,
          ipoAlerts: true,
          emailNotifications: true,
          customWatchlists: true,
          aiPatternAnalysis: true,
          dataExports: true,
          priorityRefresh: true,
        } : {
          fullHistoricalData: false,
          ipoAlerts: false,
          emailNotifications: false,
          customWatchlists: false,
          aiPatternAnalysis: false,
          dataExports: false,
          priorityRefresh: false,
        },
      });
    } catch (err) {
      console.error("Error fetching subscription:", err);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // POST /api/subscription/upgrade - Upgrade to premium (placeholder for payment integration)
  app.post("/api/subscription/upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      const updatedUser = await storage.updateUserSubscription(userId, "premium", expiresAt);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createOrUpdateAlertPreferences({
        userId,
        emailAlertsEnabled: true,
        ipoAlertsEnabled: true,
      });

      res.json({
        success: true,
        message: "Upgraded to premium successfully",
        subscription: {
          tier: updatedUser.subscriptionTier,
          expiresAt: updatedUser.subscriptionExpiresAt,
        },
      });
    } catch (err) {
      console.error("Error upgrading subscription:", err);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  // POST /api/subscription/downgrade - Downgrade to free tier
  app.post("/api/subscription/downgrade", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const updatedUser = await storage.updateUserSubscription(userId, "free", undefined);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createOrUpdateAlertPreferences({
        userId,
        emailAlertsEnabled: false,
        ipoAlertsEnabled: false,
      });

      res.json({
        success: true,
        message: "Downgraded to free tier successfully",
        subscription: {
          tier: updatedUser.subscriptionTier,
          expiresAt: null,
        },
      });
    } catch (err) {
      console.error("Error downgrading subscription:", err);
      res.status(500).json({ error: "Failed to downgrade subscription" });
    }
  });

  // ===============================================
  // AI Trade Insights (Premium Feature)
  // ===============================================
  
  // GET /api/insights/insider/:tradeId - Get AI insight for insider trade
  app.get("/api/insights/insider/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ 
          error: "Premium subscription required",
          upgradeRequired: true,
          message: "AI-powered trade insights are a premium feature. Upgrade to unlock detailed analysis of trade motivations, patterns, and context."
        });
      }

      const trade = await storage.getInsiderTradeById(req.params.tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const { getOrGenerateInsiderTradeInsight, isOpenAIConfigured } = await import("./trade-insights");
      
      if (!isOpenAIConfigured()) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const recentTrades = await storage.getInsiderTrades({ ticker: trade.ticker, limit: 20 });
      const insight = await getOrGenerateInsiderTradeInsight(trade, recentTrades);

      if (!insight) {
        return res.status(500).json({ error: "Failed to generate insight" });
      }

      res.json(insight);
    } catch (err) {
      console.error("Error fetching insider trade insight:", err);
      res.status(500).json({ error: "Failed to get insight" });
    }
  });

  // GET /api/insights/congressional/:tradeId - Get AI insight for congressional trade
  app.get("/api/insights/congressional/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ 
          error: "Premium subscription required",
          upgradeRequired: true,
          message: "AI-powered trade insights are a premium feature. Upgrade to unlock detailed analysis of congressional trading patterns and context."
        });
      }

      const trade = await storage.getCongressionalTradeById(req.params.tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const { getOrGenerateCongressionalTradeInsight, isOpenAIConfigured } = await import("./trade-insights");
      
      if (!isOpenAIConfigured()) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const recentTrades = await storage.getCongressionalTrades({ ticker: trade.ticker, limit: 20 });
      const insight = await getOrGenerateCongressionalTradeInsight(trade, recentTrades);

      if (!insight) {
        return res.status(500).json({ error: "Failed to generate insight" });
      }

      res.json(insight);
    } catch (err) {
      console.error("Error fetching congressional trade insight:", err);
      res.status(500).json({ error: "Failed to get insight" });
    }
  });

  // GET /api/insights/institutional/:tradeId - Get AI insight for institutional trade
  app.get("/api/insights/institutional/:tradeId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.subscriptionTier !== "premium") {
        return res.status(403).json({ 
          error: "Premium subscription required",
          upgradeRequired: true,
          message: "AI-powered trade insights are a premium feature. Upgrade to unlock detailed analysis of institutional 'whale' trading patterns."
        });
      }

      const trade = await storage.getInstitutionalTradeById(req.params.tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const { getOrGenerateInstitutionalTradeInsight, isOpenAIConfigured } = await import("./trade-insights");
      
      if (!isOpenAIConfigured()) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const recentTrades = await storage.getInstitutionalTrades({ ticker: trade.ticker, limit: 20 });
      const insight = await getOrGenerateInstitutionalTradeInsight(trade, recentTrades);

      if (!insight) {
        return res.status(500).json({ error: "Failed to generate insight" });
      }

      res.json(insight);
    } catch (err) {
      console.error("Error fetching institutional trade insight:", err);
      res.status(500).json({ error: "Failed to get insight" });
    }
  });

  // GET /api/insights/status - Check if AI insights are available
  app.get("/api/insights/status", async (req, res) => {
    try {
      const { isOpenAIConfigured } = await import("./trade-insights");
      res.json({ 
        available: isOpenAIConfigured(),
        message: isOpenAIConfigured() 
          ? "AI insights are available" 
          : "AI insights require OpenAI API configuration"
      });
    } catch (err) {
      res.json({ available: false, message: "AI service error" });
    }
  });

  // Start the scheduler for IPO checks
  startScheduler();

  return httpServer;
}

// Initialize with REAL data on startup
async function initializeSampleData() {
  const existingTrades = await storage.getInsiderTrades();
  if (existingTrades.length === 0) {
    console.log("Fetching real data on startup...");
    
    // Fetch real SEC EDGAR Form 4 data
    const secResult = await fetchRecentForm4Filings();
    await storage.createInsiderTrades(secResult.data);
    await storage.updateDataSource("sec_edgar", secResult.status, secResult.recordCount, secResult.errorMessage);
    console.log(`SEC EDGAR: ${secResult.status} with ${secResult.recordCount} records`);

    // Fetch real congressional trades
    const congressionalResult = await fetchRecentCongressionalTrades();
    await storage.createCongressionalTrades(congressionalResult.data);
    await storage.updateDataSource("congressional", congressionalResult.status, congressionalResult.recordCount, congressionalResult.errorMessage);
    console.log(`Congressional: ${congressionalResult.status} with ${congressionalResult.recordCount} records`);

    // Fetch Reddit social buzz data
    const redditResult = await fetchRedditBuzz();
    await storage.createSocialBuzzBatch(redditResult.data);
    await storage.updateDataSource("reddit_buzz", redditResult.status, redditResult.recordCount, redditResult.errorMessage);
    console.log(`Reddit Buzz: ${redditResult.status} with ${redditResult.recordCount} records`);

    // Fetch real IPO data (filed + rumored from agent)
    await initializeRealIpoData();

    // Initialize institutional funds and fetch their trades
    await initializeInstitutionalFunds();
    await fetchInstitutionalTrades();
    
    // Fetch news-based trades for foreign entities (like SoftBank)
    const foreignResult = await fetchForeignInstitutionalTrades();
    console.log(`Foreign Institutional: ${foreignResult.status} with ${foreignResult.recordCount} records`);

    console.log("Real data initialized successfully");
  }
}

// Fetch real IPO data using the IPO rumor agent
async function initializeRealIpoData() {
  const existingIpos = await storage.getIpos();
  if (existingIpos.length === 0) {
    console.log("Fetching real IPO data (filed + rumored)...");
    
    try {
      const { fetchAllIpos } = await import("./ipo-fetcher");
      const result = await fetchAllIpos();
      
      let filedCount = 0;
      let rumoredCount = 0;
      let pricedCount = 0;
      
      for (const ipo of result.data) {
        const existing = await storage.getIpoBySymbolAndDate(ipo.symbol, ipo.ipoDate);
        if (!existing) {
          await storage.createIpo(ipo);
          if (ipo.stage === 'rumored') rumoredCount++;
          else if (ipo.stage === 'priced') pricedCount++;
          else filedCount++;
        }
      }
      
      console.log(`IPO data loaded: ${result.data.length} total (${rumoredCount} rumored, ${filedCount} filed, ${pricedCount} priced)`);
    } catch (error) {
      console.error("Error fetching IPO data:", error);
    }
  }
}
