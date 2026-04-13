import { storage } from "./storage";
import type { InsertInstitutionalFund, InsertInstitutionalTrade } from "@shared/schema";

const TRACKED_FUNDS: InsertInstitutionalFund[] = [
  {
    name: "SoftBank Group",
    cik: "0001710350",
    manager: "Masayoshi Son",
    aum: 180,
    type: "private_equity",
    headquarters: "Tokyo, Japan",
    founded: 1981,
    description: "Japanese multinational conglomerate known for Vision Fund investments in tech companies",
  },
  {
    name: "Two Sigma Investments",
    cik: "0001179392",
    manager: "John Overdeck & David Siegel",
    aum: 60,
    type: "hedge_fund",
    headquarters: "New York, NY",
    founded: 2001,
    description: "Quantitative hedge fund using AI and machine learning for trading strategies",
  },
  {
    name: "BlackRock",
    cik: "0001364742",
    manager: "Larry Fink",
    aum: 10000,
    type: "mutual_fund",
    headquarters: "New York, NY",
    founded: 1988,
    description: "World's largest asset manager with extensive ETF and index fund offerings",
  },
  {
    name: "Berkshire Hathaway",
    cik: "0001067983",
    manager: "Warren Buffett",
    aum: 700,
    type: "hedge_fund",
    headquarters: "Omaha, NE",
    founded: 1965,
    description: "Legendary investment firm led by Warren Buffett",
  },
  {
    name: "Vanguard Group",
    cik: "0000102909",
    manager: null,
    aum: 8400,
    type: "mutual_fund",
    headquarters: "Malvern, PA",
    founded: 1975,
    description: "One of the largest investment management companies with low-cost index funds",
  },
  {
    name: "ARK Investment Management",
    cik: "0001697748",
    manager: "Cathie Wood",
    aum: 30,
    type: "hedge_fund",
    headquarters: "St. Petersburg, FL",
    founded: 2014,
    description: "Focuses on disruptive innovation in technology, genomics, and fintech",
  },
  {
    name: "Renaissance Technologies",
    cik: "0001037389",
    manager: "Jim Simons",
    aum: 130,
    type: "hedge_fund",
    headquarters: "East Setauket, NY",
    founded: 1982,
    description: "Legendary quant hedge fund known for the Medallion Fund's returns",
  },
  {
    name: "Bridgewater Associates",
    cik: "0001350694",
    manager: "Ray Dalio",
    aum: 150,
    type: "hedge_fund",
    headquarters: "Westport, CT",
    founded: 1975,
    description: "World's largest hedge fund known for systematic macro strategies",
  },
  {
    name: "Citadel Advisors",
    cik: "0001423053",
    manager: "Ken Griffin",
    aum: 60,
    type: "hedge_fund",
    headquarters: "Miami, FL",
    founded: 1990,
    description: "Multi-strategy hedge fund and major market maker",
  },
];

const SEC_USER_AGENT = "InsiderSignal contact@insidersignal.com";

interface SEC13FFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  primaryDocument: string;
  form: string;
}

interface SECHolding {
  nameOfIssuer: string;
  titleOfClass: string;
  cusip: string;
  value: number;
  shrsOrPrnAmt: {
    sshPrnamt: number;
    sshPrnamtType: string;
  };
  investmentDiscretion: string;
  votingAuthority: {
    Sole: number;
    Shared: number;
    None: number;
  };
}

export async function initializeInstitutionalFunds(): Promise<void> {
  console.log("[InstitutionalFetcher] Initializing tracked institutional funds...");
  
  for (const fundData of TRACKED_FUNDS) {
    try {
      const existing = await storage.getInstitutionalFundByCik(fundData.cik!);
      if (!existing) {
        await storage.createInstitutionalFund(fundData);
        console.log(`[InstitutionalFetcher] Created fund: ${fundData.name}`);
      }
    } catch (error) {
      console.error(`[InstitutionalFetcher] Error creating fund ${fundData.name}:`, error);
    }
  }
  
  console.log("[InstitutionalFetcher] Funds initialization complete");
}

export async function fetchInstitutionalTrades(): Promise<{
  status: "connected" | "failed" | "partial";
  recordCount: number;
  errorMessage: string | null;
}> {
  console.log("[InstitutionalFetcher] Fetching REAL institutional trades from SEC EDGAR...");
  
  try {
    const funds = await storage.getInstitutionalFunds();
    let totalTrades = 0;
    let hasErrors = false;
    
    for (const fund of funds) {
      if (!fund.cik) continue;
      
      try {
        const trades = await fetchRealSEC13FData(fund.id, fund.name, fund.cik);
        if (trades.length > 0) {
          // Clear existing trades for this fund to avoid duplicates
          await storage.clearInstitutionalTradesForFund(fund.id);
          await storage.createInstitutionalTrades(trades);
          totalTrades += trades.length;
          console.log(`[InstitutionalFetcher] Fetched ${trades.length} real trades for ${fund.name}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`[InstitutionalFetcher] Error fetching for ${fund.name}:`, error);
        hasErrors = true;
      }
    }
    
    console.log(`[InstitutionalFetcher] Fetched ${totalTrades} REAL trades from SEC EDGAR`);
    
    if (totalTrades === 0) {
      return { 
        status: "failed", 
        recordCount: 0, 
        errorMessage: "Unable to fetch 13F filings from SEC EDGAR. The SEC API may be temporarily unavailable." 
      };
    }
    
    return { 
      status: hasErrors ? "partial" : "connected", 
      recordCount: totalTrades, 
      errorMessage: hasErrors ? "Some funds failed to fetch" : null 
    };
  } catch (error) {
    console.error("[InstitutionalFetcher] Error:", error);
    return { 
      status: "failed", 
      recordCount: 0, 
      errorMessage: error instanceof Error ? error.message : "Unknown error fetching SEC data" 
    };
  }
}

async function fetchRealSEC13FData(
  fundId: string,
  fundName: string,
  cik: string
): Promise<InsertInstitutionalTrade[]> {
  const cleanCik = cik.replace(/^0+/, "");
  const paddedCik = cik.padStart(10, "0");
  
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;
  
  const response = await fetch(submissionsUrl, {
    headers: {
      "User-Agent": SEC_USER_AGENT,
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`SEC API error: ${response.status} for CIK ${cik}`);
  }
  
  const data = await response.json();
  
  const recent13FFilings = find13FFilings(data);
  
  if (recent13FFilings.length === 0) {
    console.log(`[InstitutionalFetcher] No 13F-HR filings found for ${fundName}`);
    return [];
  }
  
  const latestFiling = recent13FFilings[0];
  console.log(`[InstitutionalFetcher] Found 13F filing for ${fundName}: filed ${latestFiling.filingDate}, report period ${latestFiling.reportDate}`);
  
  // Fetch current quarter holdings
  const currentHoldings = await fetch13FHoldings(cleanCik, latestFiling.accessionNumber);
  
  // Fetch previous quarter holdings if available (for comparison to determine BUY/SELL)
  let previousHoldingsMap: Map<string, SECHolding> = new Map();
  if (recent13FFilings.length >= 2) {
    const previousFiling = recent13FFilings[1];
    console.log(`[InstitutionalFetcher] Comparing with previous quarter: ${previousFiling.reportDate}`);
    const previousHoldings = await fetch13FHoldings(cleanCik, previousFiling.accessionNumber);
    for (const holding of previousHoldings) {
      previousHoldingsMap.set(holding.cusip, holding);
    }
  }
  
  const trades: InsertInstitutionalTrade[] = [];
  const processedCusips = new Set<string>();
  
  // Calculate total portfolio value for portfolio percentage calculation
  const totalPortfolioValue = currentHoldings.reduce((sum, h) => sum + (h.value * 1000), 0);
  
  // Process current holdings - detect BUY, new_position, or reduced positions (partial sell)
  for (const holding of currentHoldings.slice(0, 20)) {
    const ticker = cusipToTicker(holding.cusip, holding.nameOfIssuer);
    const value = holding.value * 1000;
    const shares = holding.shrsOrPrnAmt.sshPrnamt;
    const previousHolding = previousHoldingsMap.get(holding.cusip);
    processedCusips.add(holding.cusip);
    
    let tradeType: "buy" | "sell" | "new_position" | "exit";
    let sharesChange: number | null = null;
    let sharesChangePercent: number | null = null;
    
    if (!previousHolding) {
      // New position - wasn't held last quarter
      tradeType = "new_position";
      sharesChange = shares;
    } else {
      const prevShares = previousHolding.shrsOrPrnAmt.sshPrnamt;
      sharesChange = shares - prevShares;
      sharesChangePercent = prevShares > 0 ? Math.round((sharesChange / prevShares) * 100) : null;
      
      if (sharesChange > 0) {
        tradeType = "buy";
      } else if (sharesChange < 0) {
        tradeType = "sell";
      } else {
        // No change - skip this holding as there's no trade activity
        continue;
      }
    }
    
    // Calculate portfolio percentage
    const portfolioPercent = totalPortfolioValue > 0 
      ? Math.round((value / totalPortfolioValue) * 10000) / 100  // Round to 2 decimal places
      : null;
    
    trades.push({
      fundId,
      fundName,
      ticker,
      company: holding.nameOfIssuer,
      type: tradeType,
      shares,
      sharesChange,
      sharesChangePercent,
      value,
      valueChange: null,
      portfolioPercent,
      reportDate: latestFiling.filingDate,
      quarterEnd: latestFiling.reportDate,
      filingUrl: buildSECFilingUrl(cleanCik, latestFiling.accessionNumber, latestFiling.primaryDocument),
      significance: determineSignificance(value),
    });
  }
  
  // Find EXIT positions (was in previous quarter, not in current = fully sold)
  if (previousHoldingsMap.size > 0) {
    for (const [cusip, prevHolding] of Array.from(previousHoldingsMap.entries())) {
      if (!processedCusips.has(cusip)) {
        // This position was completely exited
        const ticker = cusipToTicker(cusip, prevHolding.nameOfIssuer);
        const prevShares = prevHolding.shrsOrPrnAmt.sshPrnamt;
        const prevValue = prevHolding.value * 1000;
        
        trades.push({
          fundId,
          fundName,
          ticker,
          company: prevHolding.nameOfIssuer,
          type: "exit",
          shares: 0,
          sharesChange: -prevShares,
          sharesChangePercent: -100,
          value: 0,
          valueChange: -prevValue,
          portfolioPercent: null,
          reportDate: latestFiling.filingDate,
          quarterEnd: latestFiling.reportDate,
          filingUrl: buildSECFilingUrl(cleanCik, latestFiling.accessionNumber, latestFiling.primaryDocument),
          significance: determineSignificance(prevValue),
        });
        
        // Limit exit positions too
        if (trades.filter(t => t.type === "exit").length >= 5) break;
      }
    }
  }
  
  // Sort by absolute value change (most significant trades first) and limit total
  trades.sort((a, b) => {
    const aChange = Math.abs(a.sharesChange || 0);
    const bChange = Math.abs(b.sharesChange || 0);
    return bChange - aChange;
  });
  
  return trades.slice(0, 15);
}

function find13FFilings(submissionsData: any): SEC13FFiling[] {
  const filings: SEC13FFiling[] = [];
  
  if (submissionsData.filings?.recent) {
    const recent = submissionsData.filings.recent;
    const forms = recent.form || [];
    const accessionNumbers = recent.accessionNumber || [];
    const filingDates = recent.filingDate || [];
    const reportDates = recent.reportDate || [];
    const primaryDocuments = recent.primaryDocument || [];
    
    for (let i = 0; i < forms.length && filings.length < 4; i++) {
      const form = forms[i];
      if (form === "13F-HR" || form === "13F-HR/A") {
        filings.push({
          form,
          accessionNumber: accessionNumbers[i],
          filingDate: filingDates[i],
          reportDate: reportDates[i] || filingDates[i],
          primaryDocument: primaryDocuments[i],
        });
      }
    }
  }
  
  return filings;
}

async function fetch13FHoldings(cik: string, accessionNumber: string): Promise<SECHolding[]> {
  const accessionFormatted = accessionNumber.replace(/-/g, "");
  const infoTableUrl = `https://data.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/infotable.xml`;
  
  try {
    const response = await fetch(infoTableUrl, {
      headers: {
        "User-Agent": SEC_USER_AGENT,
        "Accept": "application/xml, text/xml",
      },
    });
    
    if (!response.ok) {
      console.log(`[InstitutionalFetcher] infotable.xml not found, trying primary-doc.xml`);
      return await fetchHoldingsFromPrimaryDoc(cik, accessionNumber);
    }
    
    const xmlText = await response.text();
    return parseInfoTableXml(xmlText);
  } catch (error) {
    console.error(`[InstitutionalFetcher] Error fetching holdings:`, error);
    return [];
  }
}

async function fetchHoldingsFromPrimaryDoc(cik: string, accessionNumber: string): Promise<SECHolding[]> {
  const accessionFormatted = accessionNumber.replace(/-/g, "");
  
  try {
    const indexHtmUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/${accessionNumber}-index.htm`;
    const response = await fetch(indexHtmUrl, {
      headers: {
        "User-Agent": SEC_USER_AGENT,
        "Accept": "text/html",
      },
    });
    
    if (!response.ok) {
      console.log(`[InstitutionalFetcher] Could not fetch index.htm for ${accessionNumber}`);
      return [];
    }
    
    const htmlText = await response.text();
    
    const xmlMatches = htmlText.match(/href="[^"]*\/([^"\/]+\.xml)"/gi) || [];
    
    for (const match of xmlMatches) {
      const filenameMatch = match.match(/href="[^"]*\/([^"\/]+\.xml)"/i);
      if (!filenameMatch) continue;
      
      const filename = filenameMatch[1];
      
      if (filename.toLowerCase() === 'primary_doc.xml') continue;
      if (filename.toLowerCase().includes('xsl')) continue;
      
      const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/${filename}`;
      console.log(`[InstitutionalFetcher] Trying holdings file: ${filename}`);
      
      const xmlResponse = await fetch(xmlUrl, {
        headers: {
          "User-Agent": SEC_USER_AGENT,
          "Accept": "application/xml, text/xml",
        },
      });
      
      if (xmlResponse.ok) {
        const xmlText = await xmlResponse.text();
        
        if (xmlText.includes('<infoTable>') || xmlText.includes('<informationTable')) {
          console.log(`[InstitutionalFetcher] Found holdings in ${filename}`);
          return parseInfoTableXml(xmlText);
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error(`[InstitutionalFetcher] Error fetching from primary doc:`, error);
    return [];
  }
}

function parseInfoTableXml(xmlText: string): SECHolding[] {
  const holdings: SECHolding[] = [];
  
  const infoTableRegex = /<infoTable[^>]*>([\s\S]*?)<\/infoTable>/gi;
  let match;
  
  while ((match = infoTableRegex.exec(xmlText)) !== null && holdings.length < 20) {
    const entry = match[1];
    
    const nameMatch = entry.match(/<nameOfIssuer[^>]*>([^<]+)<\/nameOfIssuer>/i);
    const cusipMatch = entry.match(/<cusip[^>]*>([^<]+)<\/cusip>/i);
    const valueMatch = entry.match(/<value[^>]*>([^<]+)<\/value>/i);
    const sharesMatch = entry.match(/<sshPrnamt[^>]*>([^<]+)<\/sshPrnamt>/i);
    const titleMatch = entry.match(/<titleOfClass[^>]*>([^<]+)<\/titleOfClass>/i);
    
    if (nameMatch && valueMatch && sharesMatch) {
      holdings.push({
        nameOfIssuer: nameMatch[1].trim(),
        titleOfClass: titleMatch?.[1]?.trim() || "COM",
        cusip: cusipMatch?.[1]?.trim() || "",
        value: parseInt(valueMatch[1].replace(/,/g, ""), 10) || 0,
        shrsOrPrnAmt: {
          sshPrnamt: parseInt(sharesMatch[1].replace(/,/g, ""), 10) || 0,
          sshPrnamtType: "SH",
        },
        investmentDiscretion: "SOLE",
        votingAuthority: { Sole: 0, Shared: 0, None: 0 },
      });
    }
  }
  
  holdings.sort((a, b) => b.value - a.value);
  
  return holdings;
}

function buildSECFilingUrl(cik: string, accessionNumber: string, primaryDocument?: string): string {
  const accessionFormatted = accessionNumber.replace(/-/g, "");
  
  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionFormatted}/${primaryDocument}`;
  }
  
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F-HR&dateb=&owner=include&count=10`;
}

const CUSIP_TICKER_MAP: Record<string, string> = {
  "67066G104": "NVDA",
  "037833100": "AAPL",
  "594918104": "MSFT",
  "88160R101": "TSLA",
  "023135106": "AMZN",
  "30303M102": "META",
  "02079K305": "GOOGL",
  "02079K107": "GOOG",
  "084670702": "BRK.B",
  "084670108": "BRK.A",
  "478160104": "JNJ",
  "742718109": "PG",
  "46625H100": "JPM",
  "92826C839": "V",
  "254687106": "DIS",
  "172967424": "C",
  "931142103": "WMT",
  "00206R102": "T",
  "891160509": "TM",
  "Y8162K157": "SONY",
  "00724F101": "ADBE",
  "79466L302": "CRM",
  "22160K105": "COST",
  "458140100": "INTC",
  "007903107": "AMD",
  "035420103": "ABNB",
  "76954A103": "RBLX",
  // Additional CUSIPs for commonly traded stocks
  "68389X105": "ORCL",
  "46120E602": "INTC",
  "30231G102": "XOM",
  "166764100": "CVX",
  "91324P102": "UNH",
  "571748102": "MA",
  "713448108": "PEP",
  "191216100": "KO",
  "459200101": "IBM",
  "617446448": "MRK",
  "00287Y109": "ABBV",
  "57636Q104": "MC",
  "29379V103": "ENPH",
  "88579Y101": "TXG",  // 10X Genomics
  "68243Q106": "FLWS", // 1-800-FLOWERS.COM
  "00846U101": "A",    // Agilent
  "00971T101": "AKAM", // Akamai
  "00130H105": "ADP",  // Automatic Data Processing
  "00724P101": "ADSK", // Autodesk
  "04621X108": "AVGO", // Broadcom
  "09857L108": "BKNG", // Booking Holdings
  "12572Q105": "CDNS", // Cadence Design
  "192446102": "CL",   // Colgate-Palmolive
  "126408103": "CME",  // CME Group
  "20030N101": "CMCSA", // Comcast
  "233331107": "DHR",  // Danaher
  "239734107": "DDOG", // Datadog
  "24906P109": "DE",   // Deere
  "278865100": "EBAY", // eBay
  "26875P101": "NET",  // Cloudflare
  "302491303": "FMC",  // FMC Corporation
  "344849104": "F",    // Ford Motor
  "345370860": "FTNT", // Fortinet
  "38141G104": "GS",   // Goldman Sachs
  "40434L105": "HDB",  // HDFC Bank
  "438516106": "HON",  // Honeywell
  "44919P508": "HUBS", // HubSpot
  "45256B101": "INFY", // Infosys
  "49338L103": "KHC",  // Kraft Heinz
  "50076Q106": "KLAC", // KLA Corp
  "532457108": "LLY",  // Eli Lilly
  "548661107": "LRCX", // Lam Research
  "55354G100": "MPC",  // Marathon Petroleum
  "58933Y105": "MU",   // Micron Technology
  "609207105": "MCD",  // McDonald's
  "62944T105": "NOW",  // ServiceNow
  "642135100": "NFLX", // Netflix
  "654106103": "NKE",  // Nike
  "670346105": "OXY",  // Occidental Petroleum
  "70450Y103": "PANW", // Palo Alto Networks
  "717081103": "PFE",  // Pfizer
  "74762E102": "QCOM", // Qualcomm
  "756109104": "REGN", // Regeneron
  "780259305": "ROKU", // Roku
  "78409V104": "SBUX", // Starbucks
  "808513105": "SCHW", // Charles Schwab
  "81362J104": "SEDG", // SolarEdge
  "824348106": "SHOP", // Shopify
  "82968B103": "SNOW", // Snowflake
  "848536100": "SQ",   // Block/Square
  "858119100": "STZ",  // Constellation Brands
  "872540109": "TJX",  // TJX Companies
  "883556102": "TMO",  // Thermo Fisher
  "90214J101": "TWLO", // Twilio
  "902494103": "TWTR", // Twitter (old)
  "91332U101": "UBER", // Uber
  "92532F100": "VEEV", // Veeva Systems
  "92343V104": "VZ",   // Verizon
  "92345Y106": "VMW",  // VMware
  "98138H101": "WDAY", // Workday
  "98978V103": "ZM",   // Zoom
  "98980L101": "ZS",   // Zscaler
  "001055102": "AFL",  // Aflac
  "00282410": "ABT",   // Abbott Labs
};

// Company name to ticker mapping for better fallback
const COMPANY_NAME_TICKER_MAP: Record<string, string> = {
  "1 800 FLOWERS": "FLWS",
  "1-800-FLOWERS": "FLWS",
  "1800 FLOWERS": "FLWS",
  "10X GENOMICS": "TXG",
  "3D SYSTEMS": "DDD",
  "3M": "MMM",
  "A10 NETWORKS": "ATEN",
  "ABCELLERA": "ABCL",
  "ABIOMED": "ABMD",
  "ACCENTURE": "ACN",
  "ADOBE": "ADBE",
  "ADVANCED MICRO": "AMD",
  "AGILENT": "A",
  "AIRBNB": "ABNB",
  "AKAMAI": "AKAM",
  "ALIBABA": "BABA",
  "ALLEGRO": "ALGM",
  "ALLSTATE": "ALL",
  "ALTRIA": "MO",
  "AMGEN": "AMGN",
  "AMPHENOL": "APH",
  "ANALOG DEVICES": "ADI",
  "ANSYS": "ANSS",
  "APPLIED MATERIALS": "AMAT",
  "ARISTA": "ANET",
  "ARM HOLDINGS": "ARM",
  "ASML": "ASML",
  "ATLASSIAN": "TEAM",
  "AUTODESK": "ADSK",
  "AUTOMATIC DATA": "ADP",
  "AUTOZONE": "AZO",
  "BAKER HUGHES": "BKR",
  "BANK OF AMERICA": "BAC",
  "BAIDU": "BIDU",
  "BIOGEN": "BIIB",
  "BLACKROCK": "BLK",
  "BLOCK": "SQ",
  "BOEING": "BA",
  "BOOKING HOLDINGS": "BKNG",
  "BRISTOL-MYERS": "BMY",
  "BROADCOM": "AVGO",
  "CADENCE": "CDNS",
  "CAPITAL ONE": "COF",
  "CARDINAL HEALTH": "CAH",
  "CATERPILLAR": "CAT",
  "CHARTER COMM": "CHTR",
  "CHEVRON": "CVX",
  "CHIPOTLE": "CMG",
  "CISCO": "CSCO",
  "CITIGROUP": "C",
  "CLOUDFLARE": "NET",
  "CME GROUP": "CME",
  "COCA-COLA": "KO",
  "COGNIZANT": "CTSH",
  "COLGATE": "CL",
  "COMCAST": "CMCSA",
  "CONOCOPHILLIPS": "COP",
  "COREWEAVE": "CRWV",
  "COSTCO": "COST",
  "CROWDSTRIKE": "CRWD",
  "DANAHER": "DHR",
  "DATADOG": "DDOG",
  "DEERE": "DE",
  "DELTA AIR": "DAL",
  "DOCUSIGN": "DOCU",
  "DOORDASH": "DASH",
  "DOW": "DOW",
  "DUPONT": "DD",
  "EBAY": "EBAY",
  "ELECTRONIC ARTS": "EA",
  "ELI LILLY": "LLY",
  "EMERSON": "EMR",
  "EOG RESOURCES": "EOG",
  "EQUINIX": "EQIX",
  "ESTEE LAUDER": "EL",
  "ETSY": "ETSY",
  "EXXON": "XOM",
  "FEDEX": "FDX",
  "FIDELITY": "FIS",
  "FISERV": "FISV",
  "FORD": "F",
  "FORTINET": "FTNT",
  "GENERAL DYNAMICS": "GD",
  "GENERAL ELECTRIC": "GE",
  "GENERAL MOTORS": "GM",
  "GILEAD": "GILD",
  "GOLDMAN SACHS": "GS",
  "HALLIBURTON": "HAL",
  "HOME DEPOT": "HD",
  "HONEYWELL": "HON",
  "HP": "HPQ",
  "HUBSPOT": "HUBS",
  "HUMANA": "HUM",
  "IBM": "IBM",
  "ILLUMINA": "ILMN",
  "INFOSYS": "INFY",
  "INTEL": "INTC",
  "INTUIT": "INTU",
  "INTUITIVE SURGICAL": "ISRG",
  "IREN": "IREN",
  "JABIL": "JBL",
  "JD.COM": "JD",
  "JOHNSON & JOHNSON": "JNJ",
  "JPMORGAN": "JPM",
  "KLA": "KLAC",
  "KRAFT": "KHC",
  "KROGER": "KR",
  "LAM RESEARCH": "LRCX",
  "LINDE": "LIN",
  "LOCKHEED MARTIN": "LMT",
  "LOWE'S": "LOW",
  "LULULEMON": "LULU",
  "LYFT": "LYFT",
  "MARATHON": "MRO",
  "MARRIOTT": "MAR",
  "MARSH MCLENNAN": "MMC",
  "MARVELL": "MRVL",
  "MASTERCARD": "MA",
  "MCDONALD'S": "MCD",
  "MCKESSON": "MCK",
  "MEDTRONIC": "MDT",
  "MERCK": "MRK",
  "MICRON": "MU",
  "MODERNA": "MRNA",
  "MONGODB": "MDB",
  "MONDELEZ": "MDLZ",
  "MORGAN STANLEY": "MS",
  "NETFLIX": "NFLX",
  "NIKE": "NKE",
  "NIO": "NIO",
  "NORTHROP": "NOC",
  "OCCIDENTAL": "OXY",
  "OKTA": "OKTA",
  "ON SEMICONDUCTOR": "ON",
  "ORACLE": "ORCL",
  "O'REILLY": "ORLY",
  "PALO ALTO": "PANW",
  "PAYPAL": "PYPL",
  "PEPSICO": "PEP",
  "PFIZER": "PFE",
  "PHILIP MORRIS": "PM",
  "PINTEREST": "PINS",
  "PROCTER": "PG",
  "PRUDENTIAL": "PRU",
  "QUALCOMM": "QCOM",
  "RAYTHEON": "RTX",
  "REGENERON": "REGN",
  "ROBLOX": "RBLX",
  "ROKU": "ROKU",
  "ROSS STORES": "ROST",
  "RTX": "RTX",
  "SALESFORCE": "CRM",
  "SCHLUMBERGER": "SLB",
  "SCHWAB": "SCHW",
  "SERVICENOW": "NOW",
  "SHELL": "SHEL",
  "SHOPIFY": "SHOP",
  "SNAP": "SNAP",
  "SNOWFLAKE": "SNOW",
  "SOLAREDGE": "SEDG",
  "SOUNDHOUND": "SOUN",
  "SPOTIFY": "SPOT",
  "SQUARE": "SQ",
  "STARBUCKS": "SBUX",
  "STRYKER": "SYK",
  "SYNOPSYS": "SNPS",
  "T-MOBILE": "TMUS",
  "TARGET": "TGT",
  "TEXAS INSTRUMENTS": "TXN",
  "THERMO FISHER": "TMO",
  "TJX": "TJX",
  "TOAST": "TOST",
  "TRADE DESK": "TTD",
  "TWILIO": "TWLO",
  "TWITTER": "TWTR",
  "UNION PACIFIC": "UNP",
  "UNITED HEALTH": "UNH",
  "UNITED PARCEL": "UPS",
  "UNITEDHEALTH": "UNH",
  "UNITY": "U",
  "UPS": "UPS",
  "VALERO": "VLO",
  "VEEVA": "VEEV",
  "VERIZON": "VZ",
  "VERTEX": "VRTX",
  "VISA": "V",
  "VMWARE": "VMW",
  "WALGREENS": "WBA",
  "WALMART": "WMT",
  "WELLS FARGO": "WFC",
  "WORKDAY": "WDAY",
  "XCEL": "XEL",
  "XILINX": "XLNX",
  "ZOOM": "ZM",
  "ZSCALER": "ZS",
};

function cusipToTicker(cusip: string, companyName: string): string {
  // First try CUSIP lookup
  if (CUSIP_TICKER_MAP[cusip]) {
    return CUSIP_TICKER_MAP[cusip];
  }
  
  const name = companyName.toUpperCase();
  
  // Try matching against company name patterns
  for (const [pattern, ticker] of Object.entries(COMPANY_NAME_TICKER_MAP)) {
    if (name.includes(pattern)) {
      return ticker;
    }
  }
  
  // Legacy direct name checks
  if (name.includes("NVIDIA")) return "NVDA";
  if (name.includes("APPLE")) return "AAPL";
  if (name.includes("MICROSOFT")) return "MSFT";
  if (name.includes("TESLA")) return "TSLA";
  if (name.includes("AMAZON")) return "AMZN";
  if (name.includes("META PLATFORMS") || name.includes("FACEBOOK")) return "META";
  if (name.includes("ALPHABET") || name.includes("GOOGLE")) return "GOOGL";
  if (name.includes("BERKSHIRE")) return "BRK.B";
  if (name.includes("ARM HOLDINGS")) return "ARM";
  if (name.includes("UBER")) return "UBER";
  if (name.includes("COINBASE")) return "COIN";
  if (name.includes("PALANTIR")) return "PLTR";
  
  // Improved fallback: find first alphabetic word that's at least 2 chars
  const words = companyName.split(/\s+/);
  for (const word of words) {
    // Skip purely numeric or very short words
    const cleaned = word.replace(/[^A-Za-z]/g, "");
    if (cleaned.length >= 2 && /^[A-Za-z]+$/.test(cleaned)) {
      return cleaned.substring(0, 4).toUpperCase();
    }
  }
  
  // If all else fails, use first 4 chars of company name without numbers
  const alphaOnly = companyName.replace(/[^A-Za-z\s]/g, "").trim();
  if (alphaOnly.length >= 2) {
    return alphaOnly.substring(0, 4).toUpperCase();
  }
  
  return cusip.substring(0, 4);
}

function determineSignificance(value: number): "high" | "medium" | "low" {
  if (value > 1000000000) return "high";
  if (value > 100000000) return "medium";
  return "low";
}

export async function clearInstitutionalTrades(): Promise<void> {
  console.log("[InstitutionalFetcher] Clearing stale institutional trade data...");
  await storage.clearInstitutionalTrades();
  console.log("[InstitutionalFetcher] Stale data cleared");
}
