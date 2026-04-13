import type { InsertIpo } from "@shared/schema";
import { ipoRumorAgent } from "./ipo-rumor-agent";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

interface FinnhubIpoCalendarItem {
  date: string;
  exchange: string;
  name: string;
  numberOfShares: number;
  price: string;
  status: string;
  symbol: string;
  totalSharesValue: number;
}

interface FinnhubIpoResponse {
  ipoCalendar: FinnhubIpoCalendarItem[];
}

export type IpoFetchError = {
  type: 'api_error' | 'network_error' | 'parse_error';
  message: string;
};

export type IpoFetchResult = {
  success: boolean;
  data: InsertIpo[];
  error?: IpoFetchError;
  isSampleData: boolean;
};

function parseFinnhubPrice(price: string): { low: number | null; high: number | null; offering: number | null } {
  if (!price || price === '' || price === 'N/A') {
    return { low: null, high: null, offering: null };
  }
  
  if (price.includes('-')) {
    const parts = price.split('-').map(p => parseFloat(p.trim()));
    return {
      low: parts[0] || null,
      high: parts[1] || null,
      offering: null,
    };
  }
  
  const singlePrice = parseFloat(price);
  if (!isNaN(singlePrice)) {
    return { low: null, high: null, offering: singlePrice };
  }
  
  return { low: null, high: null, offering: null };
}

function mapFinnhubStatus(status: string): 'upcoming' | 'priced' | 'withdrawn' | 'filed' {
  const lowerStatus = status?.toLowerCase() || '';
  if (lowerStatus === 'priced' || lowerStatus === 'expected') {
    return 'priced';
  }
  if (lowerStatus === 'withdrawn') {
    return 'withdrawn';
  }
  if (lowerStatus === 'filed') {
    return 'filed';
  }
  return 'upcoming';
}

function mapFinnhubItem(item: FinnhubIpoCalendarItem): InsertIpo {
  const { low, high, offering } = parseFinnhubPrice(item.price);
  const status = mapFinnhubStatus(item.status);
  
  const secEdgarUrl = item.symbol 
    ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${item.symbol}&type=S-1&dateb=&owner=include&count=40`
    : null;
  
  return {
    symbol: item.symbol || 'TBD',
    company: item.name || 'Unknown Company',
    exchange: item.exchange || 'N/A',
    ipoDate: item.date,
    priceRangeLow: low,
    priceRangeHigh: high,
    offeringPrice: offering,
    shares: item.numberOfShares || null,
    totalSharesValue: item.totalSharesValue || null,
    status,
    stage: status === 'priced' ? 'priced' : 'filed',
    isSampleData: false,
    prospectusUrl: secEdgarUrl,
    filingDate: null,
    sourceUrl: secEdgarUrl || `https://finnhub.io/docs/api/ipo-calendar`,
    sourceName: 'SEC EDGAR via Finnhub',
  };
}

export async function fetchIpoCalendar(fromDate?: string, toDate?: string): Promise<IpoFetchResult> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.log("[IpoFetcher] FINNHUB_API_KEY not configured, returning empty list");
    return {
      success: true,
      data: [],
      isSampleData: false,
    };
  }

  const today = new Date();
  const from = fromDate || today.toISOString().split('T')[0];
  const to = toDate || new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const url = `${FINNHUB_BASE_URL}/calendar/ipo?from=${from}&to=${to}&token=${apiKey}`;
    console.log(`[IpoFetcher] Fetching IPO calendar from Finnhub: ${from} to ${to}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[IpoFetcher] Finnhub API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        data: [],
        error: {
          type: 'api_error',
          message: `Finnhub API returned ${response.status}: ${errorText}`,
        },
        isSampleData: false,
      };
    }

    let data: FinnhubIpoResponse;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[IpoFetcher] Failed to parse Finnhub response:", parseError);
      return {
        success: false,
        data: [],
        error: {
          type: 'parse_error',
          message: 'Failed to parse Finnhub API response',
        },
        isSampleData: false,
      };
    }
    
    const ipoCalendar = data?.ipoCalendar;
    if (!ipoCalendar || !Array.isArray(ipoCalendar)) {
      console.log("[IpoFetcher] No ipoCalendar array in Finnhub response, returning empty list");
      return {
        success: true,
        data: [],
        isSampleData: false,
      };
    }
    
    console.log(`[IpoFetcher] Fetched ${ipoCalendar.length} IPOs from Finnhub`);
    
    const mappedIpos = ipoCalendar
      .filter(item => item && item.date)
      .map(mapFinnhubItem);
    
    return {
      success: true,
      data: mappedIpos,
      isSampleData: false,
    };
  } catch (error) {
    console.error("[IpoFetcher] Network error fetching IPO calendar:", error);
    return {
      success: false,
      data: [],
      error: {
        type: 'network_error',
        message: error instanceof Error ? error.message : 'Unknown network error',
      },
      isSampleData: false,
    };
  }
}

export async function fetchIpoRumors(): Promise<InsertIpo[]> {
  console.log("[IpoFetcher] Fetching IPO rumors from agent...");
  
  try {
    const rumors = await ipoRumorAgent.scanAllSources();
    
    const mappedRumors: InsertIpo[] = rumors.map(rumor => ({
      symbol: rumor.symbol || "TBD",
      company: rumor.company,
      exchange: rumor.exchange || "TBD",
      ipoDate: rumor.estimatedDate || "TBD",
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: "upcoming",
      stage: "rumored" as const,
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: rumor.sourceUrl,
      sourceName: rumor.sourceName,
      isSampleData: false,
    }));
    
    console.log(`[IpoFetcher] Found ${mappedRumors.length} IPO rumors`);
    return mappedRumors;
  } catch (error) {
    console.error("[IpoFetcher] Error fetching IPO rumors:", error);
    return [];
  }
}

export async function fetchAllIpos(fromDate?: string, toDate?: string): Promise<IpoFetchResult> {
  console.log("[IpoFetcher] Fetching all IPO data (filed + rumored)...");
  
  const [filedResult, rumors] = await Promise.all([
    fetchIpoCalendar(fromDate, toDate),
    fetchIpoRumors(),
  ]);
  
  const allIpos = [...filedResult.data, ...rumors];
  
  console.log(`[IpoFetcher] Total IPOs: ${allIpos.length} (${filedResult.data.length} filed/priced, ${rumors.length} rumored)`);
  
  return {
    success: filedResult.success,
    data: allIpos,
    error: filedResult.error,
    isSampleData: false,
  };
}

export async function fetchIpoCalendarSimple(fromDate?: string, toDate?: string): Promise<InsertIpo[]> {
  const result = await fetchIpoCalendar(fromDate, toDate);
  return result.data;
}

export async function fetchIpoProspectus(fromDate?: string, toDate?: string): Promise<InsertIpo[]> {
  const result = await fetchIpoCalendar(fromDate, toDate);
  return result.data;
}

export async function fetchConfirmedIpos(fromDate?: string, toDate?: string): Promise<InsertIpo[]> {
  const result = await fetchIpoCalendar(fromDate, toDate);
  return result.data.filter(ipo => ipo.status === 'priced');
}
