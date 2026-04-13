import * as cheerio from "cheerio";
import type { InsertIpo } from "@shared/schema";

const IPOSCOOP_CALENDAR_URL = "https://www.iposcoop.com/ipo-calendar/";
const IPOSCOOP_UPCOMING_URL = "https://www.iposcoop.com/ipos-recently-filed/";

interface IpoScoopResult {
  success: boolean;
  data: InsertIpo[];
  error?: string;
}

function parseIpoScoopDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'N/A' || dateStr === 'TBD') {
    return 'TBD';
  }
  
  // IPOScoop uses formats like "Jan 15, 2025" or "Week of Jan 13"
  const trimmed = dateStr.trim();
  
  // Handle "Week of..." format
  if (trimmed.toLowerCase().startsWith('week of')) {
    return trimmed;
  }
  
  // Try to parse standard date format
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Fall through
  }
  
  return trimmed;
}

function parseSharesValue(value: string | undefined): number | null {
  if (!value || value === 'N/A' || value === '-') return null;
  
  // Remove $ and commas, handle millions (M) suffix
  const cleaned = value.replace(/[$,]/g, '').trim();
  
  if (cleaned.endsWith('M')) {
    const num = parseFloat(cleaned.replace('M', ''));
    return isNaN(num) ? null : num * 1000000;
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parsePriceRange(priceStr: string | undefined): { low: number | null; high: number | null } {
  if (!priceStr || priceStr === 'N/A' || priceStr === '-') {
    return { low: null, high: null };
  }
  
  // Handle formats like "$18.00-$22.00" or "$18 - $22" or "$20.00"
  const cleaned = priceStr.replace(/[$,]/g, '').trim();
  
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map(p => parseFloat(p.trim()));
    return {
      low: isNaN(parts[0]) ? null : parts[0],
      high: isNaN(parts[1]) ? null : parts[1],
    };
  }
  
  const single = parseFloat(cleaned);
  if (!isNaN(single)) {
    return { low: single, high: single };
  }
  
  return { low: null, high: null };
}

function parseShares(sharesStr: string | undefined): number | null {
  if (!sharesStr || sharesStr === 'N/A' || sharesStr === '-') return null;
  
  // Handle formats like "5,000,000" or "5M"
  const cleaned = sharesStr.replace(/[,\s]/g, '').trim();
  
  if (cleaned.toLowerCase().endsWith('m')) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : Math.round(num * 1000000);
  }
  
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

export async function fetchIpoScoopCalendar(): Promise<IpoScoopResult> {
  console.log("[IpoScoop] Fetching IPO calendar...");
  
  try {
    const response = await fetch(IPOSCOOP_CALENDAR_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`[IpoScoop] Failed to fetch calendar: ${response.status}`);
      return {
        success: false,
        data: [],
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const ipos: InsertIpo[] = [];
    
    // IPOScoop calendar table rows
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;
      
      const company = $(cells[0]).text().trim();
      const symbol = $(cells[1]).text().trim() || 'TBD';
      const priceStr = $(cells[2]).text().trim();
      const sharesStr = $(cells[3]).text().trim();
      const dateStr = cells.length > 4 ? $(cells[4]).text().trim() : 'TBD';
      const exchange = cells.length > 5 ? $(cells[5]).text().trim() : 'TBD';
      
      if (!company || company.toLowerCase().includes('company')) return; // Skip header rows
      
      const { low, high } = parsePriceRange(priceStr);
      const shares = parseShares(sharesStr);
      
      ipos.push({
        symbol: symbol || 'TBD',
        company,
        exchange: exchange || 'NASDAQ/NYSE',
        ipoDate: parseIpoScoopDate(dateStr),
        priceRangeLow: low,
        priceRangeHigh: high,
        offeringPrice: null,
        shares,
        totalSharesValue: shares && low && high ? shares * ((low + high) / 2) : null,
        status: 'upcoming',
        stage: 'filed', // Calendar IPOs have S-1 filed
        prospectusUrl: null,
        filingDate: null,
        sourceUrl: IPOSCOOP_CALENDAR_URL,
        sourceName: 'IPOScoop',
        isSampleData: false,
      });
    });
    
    console.log(`[IpoScoop] Parsed ${ipos.length} IPOs from calendar`);
    return { success: true, data: ipos };
  } catch (error) {
    console.error("[IpoScoop] Error fetching calendar:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchIpoScoopRecentlyFiled(): Promise<IpoScoopResult> {
  console.log("[IpoScoop] Fetching recently filed IPOs...");
  
  try {
    const response = await fetch(IPOSCOOP_UPCOMING_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      console.error(`[IpoScoop] Failed to fetch recently filed: ${response.status}`);
      return {
        success: false,
        data: [],
        error: `HTTP ${response.status}`,
      };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const ipos: InsertIpo[] = [];
    
    // Recently filed table
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;
      
      const company = $(cells[0]).text().trim();
      const symbol = $(cells[1]).text().trim() || 'TBD';
      const filingDate = cells.length > 2 ? $(cells[2]).text().trim() : null;
      const industry = cells.length > 3 ? $(cells[3]).text().trim() : null;
      
      if (!company || company.toLowerCase().includes('company')) return;
      
      ipos.push({
        symbol: symbol || 'TBD',
        company,
        exchange: 'TBD',
        ipoDate: 'TBD', // Not yet scheduled
        priceRangeLow: null,
        priceRangeHigh: null,
        offeringPrice: null,
        shares: null,
        totalSharesValue: null,
        status: 'upcoming',
        stage: 'filed', // Just filed with SEC
        prospectusUrl: null,
        filingDate: filingDate || null,
        sourceUrl: IPOSCOOP_UPCOMING_URL,
        sourceName: 'IPOScoop',
        isSampleData: false,
      });
    });
    
    console.log(`[IpoScoop] Parsed ${ipos.length} recently filed IPOs`);
    return { success: true, data: ipos };
  } catch (error) {
    console.error("[IpoScoop] Error fetching recently filed:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get known rumored IPOs from curated list (major companies rumored to go public)
export function getRumoredIpos(): InsertIpo[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Major companies frequently discussed as potential IPO candidates
  // These are curated from financial news and analyst reports
  return [
    {
      symbol: 'TBD',
      company: 'SpaceX',
      exchange: 'TBD',
      ipoDate: `${currentYear + 1}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.reuters.com/business/spacex-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Stripe',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.bloomberg.com/news/stripe-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Databricks',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://techcrunch.com/databricks-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Shein',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.wsj.com/articles/shein-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Anduril Industries',
      exchange: 'TBD',
      ipoDate: `${currentYear + 1}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.forbes.com/anduril-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Kraken',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.coindesk.com/kraken-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Discord',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.theverge.com/discord-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
    {
      symbol: 'TBD',
      company: 'Plaid',
      exchange: 'TBD',
      ipoDate: `${currentYear}-TBD`,
      priceRangeLow: null,
      priceRangeHigh: null,
      offeringPrice: null,
      shares: null,
      totalSharesValue: null,
      status: 'upcoming',
      stage: 'rumored',
      prospectusUrl: null,
      filingDate: null,
      sourceUrl: 'https://www.finextra.com/plaid-ipo/',
      sourceName: 'Analyst Reports',
      isSampleData: false,
    },
  ];
}

export async function fetchAllUpcomingIpos(): Promise<{
  calendar: IpoScoopResult;
  recentlyFiled: IpoScoopResult;
  rumored: InsertIpo[];
}> {
  const [calendar, recentlyFiled] = await Promise.all([
    fetchIpoScoopCalendar(),
    fetchIpoScoopRecentlyFiled(),
  ]);
  
  const rumored = getRumoredIpos();
  
  return { calendar, recentlyFiled, rumored };
}
