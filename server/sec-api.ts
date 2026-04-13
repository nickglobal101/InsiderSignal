import type { InsertInsiderTrade, InsertCongressionalTrade, DataSourceStatus } from "@shared/schema";
import * as cheerio from "cheerio";

export interface FetchResult<T> {
  data: T[];
  status: DataSourceStatus;
  recordCount: number;
  errorMessage: string | null;
}

const SEC_BASE_URL = "https://data.sec.gov";
const SEC_WWW_URL = "https://www.sec.gov";
const USER_AGENT = "InsiderSignal/1.0 (contact@insidersignal.com)";

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 150;

async function rateLimitedFetch(url: string, accept = "application/json"): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: accept,
    },
  });
}

const FORTUNE_500_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
  "JPM", "V", "JNJ", "UNH", "HD", "PG", "MA", "XOM", "CVX", "LLY",
  "ABBV", "MRK", "PEP", "KO", "COST", "TMO", "AVGO", "MCD", "WMT",
  "DIS", "CSCO", "ACN", "VZ", "ADBE", "CRM", "NKE", "TXN", "INTC",
  "AMD", "NFLX", "QCOM", "HON", "IBM", "GE", "CAT", "BA", "RTX"
];

interface CompanyTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

interface SECSubmissions {
  cik: string;
  name: string;
  tickers: string[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
}

interface Form4OwnershipDoc {
  issuer: {
    issuerCik: string;
    issuerName: string;
    issuerTradingSymbol: string;
  };
  reportingOwner: {
    reportingOwnerId: { rptOwnerCik: string; rptOwnerName: string };
    reportingOwnerRelationship: {
      isDirector?: boolean;
      isOfficer?: boolean;
      officerTitle?: string;
    };
  };
  nonDerivativeTable?: {
    nonDerivativeTransaction?: Array<{
      securityTitle: { value: string };
      transactionDate: { value: string };
      transactionAmounts: {
        transactionShares: { value: number };
        transactionPricePerShare: { value: number };
        transactionAcquiredDisposedCode: { value: string };
      };
      ownershipNature?: { directOrIndirectOwnership: { value: string } };
    }>;
  };
}

const tickerToCIK: Map<string, string> = new Map();
const cikToCompanyName: Map<string, string> = new Map();
let tickerCacheLoaded = false;

async function loadTickerCache(): Promise<void> {
  if (tickerCacheLoaded) return;

  try {
    const response = await rateLimitedFetch(
      "https://www.sec.gov/files/company_tickers.json"
    );
    if (!response.ok) {
      console.error("Failed to fetch company tickers:", response.status);
      return;
    }

    const data: Record<string, CompanyTickerEntry> = await response.json();
    for (const key in data) {
      const entry = data[key];
      const cik = String(entry.cik_str);
      tickerToCIK.set(entry.ticker, cik);
      cikToCompanyName.set(cik, entry.title);
    }
    tickerCacheLoaded = true;
    console.log(`Loaded ${tickerToCIK.size} ticker mappings from SEC`);
  } catch (err) {
    console.error("Error loading ticker cache:", err);
  }
}

async function getCompanyCIK(ticker: string): Promise<string | null> {
  await loadTickerCache();
  return tickerToCIK.get(ticker) || null;
}

function formatAccessionNumber(accession: string): string {
  return accession.replace(/-/g, "");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseXMLValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseXMLNestedValue(xml: string, outerTag: string, innerTag: string): string | null {
  const outerRegex = new RegExp(`<${outerTag}[^>]*>([\\s\\S]*?)</${outerTag}>`, "i");
  const outerMatch = xml.match(outerRegex);
  if (!outerMatch) return null;
  return parseXMLValue(outerMatch[1], innerTag);
}

interface ParsedTransaction {
  securityTitle: string;
  transactionDate: string;
  shares: number;
  pricePerShare: number;
  acquiredDisposed: string;
  ownershipType: string;
}

function parseForm4XML(xml: string): {
  issuerName: string;
  issuerTicker: string;
  issuerCik: string;
  ownerName: string;
  ownerTitle: string;
  isOfficer: boolean;
  isDirector: boolean;
  transactions: ParsedTransaction[];
} | null {
  try {
    const issuerName = parseXMLNestedValue(xml, "issuer", "issuerName") || "";
    const issuerTicker = parseXMLNestedValue(xml, "issuer", "issuerTradingSymbol") || "";
    const issuerCik = parseXMLNestedValue(xml, "issuer", "issuerCik") || "";
    const ownerName = parseXMLNestedValue(xml, "reportingOwnerId", "rptOwnerName") || "";
    const officerTitle = parseXMLNestedValue(xml, "reportingOwnerRelationship", "officerTitle") || "";
    const isOfficerStr = parseXMLNestedValue(xml, "reportingOwnerRelationship", "isOfficer") || "";
    const isDirectorStr = parseXMLNestedValue(xml, "reportingOwnerRelationship", "isDirector") || "";
    
    const isOfficer = isOfficerStr === "1" || isOfficerStr.toLowerCase() === "true";
    const isDirector = isDirectorStr === "1" || isDirectorStr.toLowerCase() === "true";

    const transactions: ParsedTransaction[] = [];
    
    const nonDerivMatch = xml.match(/<nonDerivativeTable>([\s\S]*?)<\/nonDerivativeTable>/i);
    if (nonDerivMatch) {
      const transactionMatches = Array.from(
        nonDerivMatch[1].matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi)
      );
      
      for (const txMatch of transactionMatches) {
        const txXml = txMatch[1];
        const securityTitle = parseXMLNestedValue(txXml, "securityTitle", "value") || "Common Stock";
        const transactionDate = parseXMLNestedValue(txXml, "transactionDate", "value") || "";
        const sharesStr = parseXMLNestedValue(txXml, "transactionShares", "value") || "0";
        const priceStr = parseXMLNestedValue(txXml, "transactionPricePerShare", "value") || "0";
        const acquiredDisposed = parseXMLNestedValue(txXml, "transactionAcquiredDisposedCode", "value") || "D";
        const ownershipType = parseXMLNestedValue(txXml, "directOrIndirectOwnership", "value") || "D";
        
        const shares = parseFloat(sharesStr) || 0;
        const pricePerShare = parseFloat(priceStr) || 0;
        
        if (shares > 0) {
          transactions.push({
            securityTitle,
            transactionDate,
            shares,
            pricePerShare,
            acquiredDisposed,
            ownershipType: ownershipType === "D" ? "direct" : "indirect",
          });
        }
      }
    }

    return {
      issuerName,
      issuerTicker,
      issuerCik,
      ownerName,
      ownerTitle: officerTitle || (isDirector ? "Director" : ""),
      isOfficer,
      isDirector,
      transactions,
    };
  } catch (err) {
    console.error("Error parsing Form 4 XML:", err);
    return null;
  }
}

async function fetchForm4Document(
  cik: string,
  accessionNumber: string,
  primaryDocument: string,
  filingDateStr: string
): Promise<InsertInsiderTrade[]> {
  const paddedCik = cik.padStart(10, "0");
  const formattedAccession = formatAccessionNumber(accessionNumber);
  
  const xmlFilename = primaryDocument.includes("/")
    ? primaryDocument.split("/").pop()!
    : primaryDocument;
  
  const docUrl = `${SEC_WWW_URL}/Archives/edgar/data/${cik}/${formattedAccession}/${xmlFilename}`;
  
  try {
    const response = await rateLimitedFetch(docUrl, "application/xml");
    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parsed = parseForm4XML(xmlText);
    if (!parsed || parsed.transactions.length === 0) {
      return [];
    }

    const filingUrl = `${SEC_WWW_URL}/cgi-bin/browse-edgar?action=getcompany&CIK=${paddedCik}&type=4&dateb=&owner=only&count=40`;
    
    return parsed.transactions
      .filter((tx) => tx.pricePerShare > 0 && tx.shares > 0)
      .map((tx) => ({
        company: parsed.issuerName,
        ticker: parsed.issuerTicker.toUpperCase(),
        executive: parsed.ownerName,
        title: parsed.ownerTitle || (parsed.isOfficer ? "Officer" : parsed.isDirector ? "Director" : "Insider"),
        type: tx.acquiredDisposed === "A" ? "buy" : "sell",
        shares: Math.round(tx.shares),
        value: Math.round(tx.shares * tx.pricePerShare),
        pricePerShare: tx.pricePerShare,
        date: formatDate(tx.transactionDate),
        filingDate: formatDate(filingDateStr),
        filingUrl,
        cik: paddedCik,
        ownershipType: tx.ownershipType,
      }));
  } catch (err) {
    console.error(`Error fetching Form 4 document:`, err);
    return [];
  }
}

async function fetchCompanyForm4s(ticker: string): Promise<InsertInsiderTrade[]> {
  const cik = await getCompanyCIK(ticker);
  if (!cik) {
    console.log(`No CIK found for ticker ${ticker}`);
    return [];
  }

  const paddedCik = cik.padStart(10, "0");
  const submissionsUrl = `${SEC_BASE_URL}/submissions/CIK${paddedCik}.json`;

  try {
    const response = await rateLimitedFetch(submissionsUrl);
    if (!response.ok) {
      console.error(`Failed to fetch submissions for ${ticker}: ${response.status}`);
      return [];
    }

    const submissions: SECSubmissions = await response.json();
    const recent = submissions.filings.recent;
    
    const form4Indices: number[] = [];
    for (let i = 0; i < recent.form.length && form4Indices.length < 5; i++) {
      if (recent.form[i] === "4") {
        form4Indices.push(i);
      }
    }

    if (form4Indices.length === 0) {
      return [];
    }

    const trades: InsertInsiderTrade[] = [];
    for (const idx of form4Indices) {
      const accession = recent.accessionNumber[idx];
      const primaryDoc = recent.primaryDocument[idx];
      const filingDate = recent.filingDate[idx];
      
      const docTrades = await fetchForm4Document(cik, accession, primaryDoc, filingDate);
      trades.push(...docTrades);
    }

    return trades;
  } catch (err) {
    console.error(`Error fetching company Form 4s for ${ticker}:`, err);
    return [];
  }
}

export async function fetchRecentForm4Filings(): Promise<FetchResult<InsertInsiderTrade>> {
  console.log("Fetching real SEC Form 4 filings...");
  const trades: InsertInsiderTrade[] = [];
  let hasErrors = false;
  let errorMessage: string | null = null;
  
  try {
    await loadTickerCache();

    const tickersToFetch = FORTUNE_500_TICKERS.slice(0, 10);
    
    for (const ticker of tickersToFetch) {
      try {
        console.log(`Fetching Form 4s for ${ticker}...`);
        const companyTrades = await fetchCompanyForm4s(ticker);
        trades.push(...companyTrades);
        console.log(`Found ${companyTrades.length} trades for ${ticker}`);
      } catch (err) {
        console.error(`Error fetching Form 4s for ${ticker}:`, err);
        hasErrors = true;
      }
    }

    console.log(`Total trades fetched: ${trades.length}`);
    
    if (trades.length === 0) {
      // NO sample data fallback - return error state instead
      return {
        data: [],
        status: "failed",
        recordCount: 0,
        errorMessage: "SEC EDGAR API is temporarily unavailable. Unable to fetch insider trading data.",
      };
    }
    
    return {
      data: trades,
      status: hasErrors ? "partial" : "connected",
      recordCount: trades.length,
      errorMessage: hasErrors ? "Some tickers failed to fetch" : null,
    };
  } catch (err) {
    console.error("Error fetching Form 4 filings:", err);
    // NO sample data fallback - return error state instead
    return {
      data: [],
      status: "failed",
      recordCount: 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error fetching SEC data",
    };
  }
}


interface HouseStockWatcherTrade {
  disclosure_date: string;
  transaction_date: string;
  ticker: string;
  asset_description: string;
  type: string;
  amount: string;
  representative: string;
  owner: string;
  district: string;
}

interface SenateStockWatcherTrade {
  disclosure_date: string;
  transaction_date: string;
  ticker: string;
  asset_description: string;
  type: string;
  amount: string;
  senator: string;
  owner: string;
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC"
};

function extractStateFromDistrict(district: string): string {
  if (!district || district === "--") return "XX";
  const parts = district.split(/\d/);
  const stateName = parts[0].trim();
  return STATE_ABBREVIATIONS[stateName] || stateName.substring(0, 2).toUpperCase() || "XX";
}

function normalizeTradeType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("purchase") || lower.includes("buy")) return "buy";
  if (lower.includes("sale") || lower.includes("sell")) return "sell";
  if (lower.includes("exchange")) return "exchange";
  return lower;
}

function formatCongressionalDate(dateStr: string): string {
  if (!dateStr || dateStr === "--") return "Unknown";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface HouseStockWatcherTradeExtended extends HouseStockWatcherTrade {
  party?: string;
}

function detectParty(data: HouseStockWatcherTradeExtended): "D" | "R" | "I" {
  if (data.party) {
    const p = data.party.toUpperCase();
    if (p === "D" || p === "DEMOCRAT" || p === "DEMOCRATIC") return "D";
    if (p === "R" || p === "REPUBLICAN") return "R";
    if (p === "I" || p === "INDEPENDENT") return "I";
  }
  return "I";
}

interface FMPHouseTrade {
  symbol: string;
  disclosureDate: string;
  transactionDate: string;
  firstName: string;
  lastName: string;
  office: string;
  district: string;
  owner: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  capitalGainsOver200USD: string;
  comment: string;
  link: string;
}

interface FMPSenateTrade {
  symbol: string;
  disclosureDate: string;
  transactionDate: string;
  firstName: string;
  lastName: string;
  office: string;
  owner: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  comment: string;
  link: string;
}

async function fetchFMPCongressionalTrades(): Promise<InsertCongressionalTrade[]> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.log("FMP_API_KEY not configured, skipping Financial Modeling Prep data source");
    return [];
  }

  console.log("Fetching congressional trades from Financial Modeling Prep...");
  const trades: InsertCongressionalTrade[] = [];

  try {
    const [houseResponse, senateResponse] = await Promise.all([
      fetch(`https://financialmodelingprep.com/stable/house-latest?apikey=${apiKey}`),
      fetch(`https://financialmodelingprep.com/stable/senate-latest?apikey=${apiKey}`),
    ]);

    if (houseResponse.ok) {
      const houseData: FMPHouseTrade[] = await houseResponse.json();
      console.log(`Fetched ${houseData.length} House trades from FMP`);
      
      const houseTrades = houseData
        .filter((trade) => trade.symbol && trade.symbol.length <= 5)
        .slice(0, 50)
        .map((trade): InsertCongressionalTrade => ({
          member: `${trade.firstName} ${trade.lastName}`.trim() || "Unknown",
          party: "I" as const,
          chamber: "House" as const,
          state: trade.district ? trade.district.substring(0, 2) : "XX",
          ticker: trade.symbol.toUpperCase(),
          company: trade.assetDescription || trade.symbol,
          type: trade.type.toLowerCase().includes("purchase") ? "buy" : "sell",
          amountRange: trade.amount || "$1 - $15,000",
          disclosedDate: formatCongressionalDate(trade.disclosureDate),
          tradeDate: formatCongressionalDate(trade.transactionDate),
          committee: null,
        }));
      trades.push(...houseTrades);
    } else {
      console.error("Failed to fetch FMP House trades:", houseResponse.status);
    }

    if (senateResponse.ok) {
      const senateData: FMPSenateTrade[] = await senateResponse.json();
      console.log(`Fetched ${senateData.length} Senate trades from FMP`);
      
      const senateTrades = senateData
        .filter((trade) => trade.symbol && trade.symbol.length <= 5)
        .slice(0, 50)
        .map((trade): InsertCongressionalTrade => ({
          member: `${trade.firstName} ${trade.lastName}`.trim() || "Unknown",
          party: "I" as const,
          chamber: "Senate" as const,
          state: "XX",
          ticker: trade.symbol.toUpperCase(),
          company: trade.assetDescription || trade.symbol,
          type: trade.type.toLowerCase().includes("purchase") ? "buy" : "sell",
          amountRange: trade.amount || "$1 - $15,000",
          disclosedDate: formatCongressionalDate(trade.disclosureDate),
          tradeDate: formatCongressionalDate(trade.transactionDate),
          committee: null,
        }));
      trades.push(...senateTrades);
    } else {
      console.error("Failed to fetch FMP Senate trades:", senateResponse.status);
    }

    console.log(`Total FMP congressional trades: ${trades.length}`);
    return trades;
  } catch (err) {
    console.error("Error fetching FMP congressional trades:", err);
    return [];
  }
}

function formatCapitolDate(dateStr: string): string {
  if (!dateStr) return "Unknown";
  const cleaned = dateStr.replace(/\s+/g, " ").trim();
  const match = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${month} ${day}, ${year}`;
  }
  const match2 = cleaned.match(/([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/);
  if (match2) {
    const [, month, day, year] = match2;
    return `${month} ${day}, ${year}`;
  }
  return dateStr;
}

async function fetchHouseTrades(): Promise<InsertCongressionalTrade[]> {
  console.log("Fetching House trades from House Stock Watcher...");
  
  try {
    const response = await fetch("https://housestockwatcher-data.s3.us-west-2.amazonaws.com/data/all_transactions.json", {
      headers: { "User-Agent": USER_AGENT },
    });
    
    if (!response.ok) {
      console.error("Failed to fetch House trades:", response.status);
      return [];
    }

    const data: HouseStockWatcherTradeExtended[] = await response.json();
    console.log(`Fetched ${data.length} total House trades`);
    
    const recentTrades = data
      .filter((trade) => trade.ticker && trade.ticker !== "--" && trade.ticker.length <= 5)
      .slice(0, 50)
      .map((trade): InsertCongressionalTrade => ({
        member: trade.representative || "Unknown",
        party: detectParty(trade),
        chamber: "House" as const,
        state: extractStateFromDistrict(trade.district),
        ticker: trade.ticker.toUpperCase(),
        company: trade.asset_description || trade.ticker,
        type: normalizeTradeType(trade.type),
        amountRange: trade.amount || "$1 - $15,000",
        disclosedDate: formatCongressionalDate(trade.disclosure_date),
        tradeDate: formatCongressionalDate(trade.transaction_date),
        committee: null,
      }));

    console.log(`Processed ${recentTrades.length} House trades`);
    return recentTrades;
  } catch (err) {
    console.error("Error fetching House trades:", err);
    return [];
  }
}

interface SenateStockWatcherTradeExtended extends SenateStockWatcherTrade {
  party?: string;
}

function detectSenateParty(data: SenateStockWatcherTradeExtended): "D" | "R" | "I" {
  if (data.party) {
    const p = data.party.toUpperCase();
    if (p === "D" || p === "DEMOCRAT" || p === "DEMOCRATIC") return "D";
    if (p === "R" || p === "REPUBLICAN") return "R";
    if (p === "I" || p === "INDEPENDENT") return "I";
  }
  return "I";
}

async function fetchSenateTrades(): Promise<InsertCongressionalTrade[]> {
  console.log("Fetching Senate trades from Senate Stock Watcher...");
  
  try {
    const response = await fetch("https://senatestockwatcher-data.s3.us-west-2.amazonaws.com/aggregate/all_transactions.json", {
      headers: { "User-Agent": USER_AGENT },
    });
    
    if (!response.ok) {
      console.error("Failed to fetch Senate trades:", response.status);
      return [];
    }

    const data: SenateStockWatcherTradeExtended[] = await response.json();
    console.log(`Fetched ${data.length} total Senate trades`);
    
    const recentTrades = data
      .filter((trade) => trade.ticker && trade.ticker !== "--" && trade.ticker.length <= 5)
      .slice(0, 50)
      .map((trade): InsertCongressionalTrade => ({
        member: trade.senator || "Unknown",
        party: detectSenateParty(trade),
        chamber: "Senate" as const,
        state: "XX",
        ticker: trade.ticker.toUpperCase(),
        company: trade.asset_description || trade.ticker,
        type: normalizeTradeType(trade.type),
        amountRange: trade.amount || "$1 - $15,000",
        disclosedDate: formatCongressionalDate(trade.disclosure_date),
        tradeDate: formatCongressionalDate(trade.transaction_date),
        committee: null,
      }));

    console.log(`Processed ${recentTrades.length} Senate trades`);
    return recentTrades;
  } catch (err) {
    console.error("Error fetching Senate trades:", err);
    return [];
  }
}

export async function fetchRecentCongressionalTrades(): Promise<FetchResult<InsertCongressionalTrade>> {
  console.log("Fetching real congressional trades...");
  
  try {
    // Try Financial Modeling Prep first (primary source - requires FMP_API_KEY)
    let allTrades = await fetchFMPCongressionalTrades();
    
    // If FMP fails or no API key, try House/Senate Stock Watcher as fallback
    if (allTrades.length === 0) {
      console.log("FMP returned no data, trying House/Senate Stock Watcher...");
      const [houseTrades, senateTrades] = await Promise.all([
        fetchHouseTrades(),
        fetchSenateTrades(),
      ]);
      allTrades = [...houseTrades, ...senateTrades];
    }
    
    console.log(`Total congressional trades fetched: ${allTrades.length}`);
    
    if (allTrades.length === 0) {
      return {
        data: [],
        status: "failed",
        recordCount: 0,
        errorMessage: "Congressional trade data sources are temporarily unavailable. Add FMP_API_KEY secret (free from financialmodelingprep.com) to enable congressional trading data.",
      };
    }
    
    return {
      data: allTrades,
      status: "connected",
      recordCount: allTrades.length,
      errorMessage: null,
    };
  } catch (err) {
    console.error("Error fetching congressional trades:", err);
    return {
      data: [],
      status: "failed",
      recordCount: 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error fetching congressional trades",
    };
  }
}
