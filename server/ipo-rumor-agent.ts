import * as cheerio from "cheerio";

interface IpoRumor {
  company: string;
  symbol: string;
  exchange: string;
  estimatedDate: string;
  sourceUrl: string;
  sourceName: string;
  headline: string;
  confidence: "high" | "medium" | "low";
  mentions: number;
  discoveredAt: Date;
}

const IPO_KEYWORDS = [
  "ipo",
  "going public",
  "initial public offering",
  "s-1 filing",
  "direct listing",
  "public offering",
  "planning ipo",
  "ipo rumor",
  "considering going public",
  "preparing for ipo",
  "confidential ipo filing",
];

const KNOWN_IPO_CANDIDATES: { company: string; keywords: string[]; estimatedDate: string }[] = [
  { company: "SpaceX", keywords: ["spacex", "space exploration technologies"], estimatedDate: "2026-TBD" },
  { company: "Stripe", keywords: ["stripe", "stripe payments"], estimatedDate: "2025-TBD" },
  { company: "Databricks", keywords: ["databricks"], estimatedDate: "2025-TBD" },
  { company: "Discord", keywords: ["discord"], estimatedDate: "2025-TBD" },
  { company: "Klarna", keywords: ["klarna"], estimatedDate: "2025-H1" },
  { company: "Plaid", keywords: ["plaid"], estimatedDate: "2025-TBD" },
  { company: "Chime", keywords: ["chime financial", "chime bank"], estimatedDate: "2025-TBD" },
  { company: "Shein", keywords: ["shein"], estimatedDate: "2025-H1" },
  { company: "Canva", keywords: ["canva"], estimatedDate: "2025-TBD" },
  { company: "Revolut", keywords: ["revolut"], estimatedDate: "2025-TBD" },
  { company: "OpenAI", keywords: ["openai"], estimatedDate: "2026-TBD" },
  { company: "Anthropic", keywords: ["anthropic"], estimatedDate: "2026-TBD" },
  { company: "Anduril", keywords: ["anduril"], estimatedDate: "2025-TBD" },
  { company: "Scale AI", keywords: ["scale ai"], estimatedDate: "2025-TBD" },
  { company: "CoreWeave", keywords: ["coreweave"], estimatedDate: "2025-H1" },
  { company: "ServiceTitan", keywords: ["servicetitan"], estimatedDate: "2025-Q1" },
  { company: "Medline Industries", keywords: ["medline industries"], estimatedDate: "2025-TBD" },
  { company: "StubHub", keywords: ["stubhub"], estimatedDate: "2025-Q1" },
  { company: "Sailpoint", keywords: ["sailpoint"], estimatedDate: "2025-TBD" },
];

export class IpoRumorAgent {
  private rumors: Map<string, IpoRumor> = new Map();
  private lastScan: Date | null = null;

  async scanAllSources(): Promise<IpoRumor[]> {
    console.log("[IpoRumorAgent] Starting comprehensive IPO rumor scan...");
    const allRumors: IpoRumor[] = [];

    try {
      const [googleNewsRumors, redditRumors, apeWisdomRumors] = await Promise.all([
        this.scanGoogleNews(),
        this.scanRedditRss(),
        this.crossReferenceWithApeWisdom(),
      ]);

      allRumors.push(...googleNewsRumors, ...redditRumors, ...apeWisdomRumors);

      for (const rumor of allRumors) {
        const key = rumor.company.toLowerCase();
        const existing = this.rumors.get(key);
        if (!existing || rumor.confidence === "high" || rumor.mentions > (existing.mentions || 0)) {
          this.rumors.set(key, rumor);
        }
      }

      this.lastScan = new Date();
      console.log(`[IpoRumorAgent] Scan complete. Found ${allRumors.length} total rumors, ${this.rumors.size} unique companies`);

      return Array.from(this.rumors.values());
    } catch (error) {
      console.error("[IpoRumorAgent] Error during scan:", error);
      return Array.from(this.rumors.values());
    }
  }

  async scanGoogleNews(): Promise<IpoRumor[]> {
    console.log("[IpoRumorAgent] Scanning Google News RSS for IPO discussions...");
    const rumors: IpoRumor[] = [];

    for (const candidate of KNOWN_IPO_CANDIDATES) {
      try {
        const articles = await this.searchGoogleNewsRss(candidate.company);
        
        for (const article of articles) {
          if (this.isIpoRelated(article.title)) {
            rumors.push({
              company: candidate.company,
              symbol: "TBD",
              exchange: "TBD",
              estimatedDate: candidate.estimatedDate,
              sourceUrl: article.url,
              sourceName: article.source,
              headline: article.title.substring(0, 200),
              confidence: "medium",
              mentions: 1,
              discoveredAt: new Date(article.publishedAt || Date.now()),
            });
            break;
          }
        }
        
        await this.delay(500);
      } catch (error) {
        console.error(`[IpoRumorAgent] Error searching Google News for ${candidate.company}:`, error);
      }
    }

    console.log(`[IpoRumorAgent] Found ${rumors.length} IPO rumors from Google News`);
    return rumors;
  }

  private async searchGoogleNewsRss(query: string): Promise<Array<{title: string; url: string; source: string; publishedAt: string}>> {
    const articles: Array<{title: string; url: string; source: string; publishedAt: string}> = [];

    try {
      const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " IPO")}&hl=en-US&gl=US&ceid=US:en`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
      });

      if (!response.ok) {
        return articles;
      }

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      const items: Array<{title: string; link: string; pubDate: string; source: string}> = [];
      $("item").slice(0, 5).each((_, item) => {
        const title = $(item).find("title").text();
        const link = $(item).find("link").text();
        const pubDate = $(item).find("pubDate").text();
        const source = $(item).find("source").text() || "Google News";
        
        if (title && link) {
          items.push({ title, link, pubDate, source });
        }
      });

      for (const item of items) {
        let finalUrl = item.link;
        
        if (item.link.includes("news.google.com")) {
          const resolvedUrl = await this.resolveGoogleNewsUrl(item.link);
          if (resolvedUrl) {
            finalUrl = resolvedUrl;
          }
        }
        
        articles.push({
          title: item.title,
          url: finalUrl,
          source: item.source,
          publishedAt: item.pubDate,
        });
      }
    } catch (error) {
      console.error(`[IpoRumorAgent] Google News RSS error for "${query}":`, error);
    }

    return articles;
  }

  private async resolveGoogleNewsUrl(googleUrl: string): Promise<string | null> {
    try {
      const response = await fetch(googleUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      
      if (response.url && response.url !== googleUrl) {
        return response.url;
      }
    } catch {
      // Fallback: try to extract URL from the encoded path
    }
    
    return googleUrl;
  }

  private extractSourceFromGoogleUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace("www.", "").split(".")[0];
    } catch {
      return "Unknown";
    }
  }

  async scanRedditRss(): Promise<IpoRumor[]> {
    console.log("[IpoRumorAgent] Scanning Reddit RSS feeds for IPO discussions...");
    const rumors: IpoRumor[] = [];
    
    const subreddits = ["stocks", "investing", "wallstreetbets", "stockmarket"];

    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/search.rss?q=ipo&restrict_sr=on&sort=new&limit=25`;
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
        });

        if (!response.ok) {
          continue;
        }

        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });

        $("entry").slice(0, 10).each((_, entry) => {
          const title = $(entry).find("title").text();
          const link = $(entry).find("link").attr("href") || "";
          const published = $(entry).find("published").text();
          const content = $(entry).find("content").text();
          const fullText = title + " " + content;

          if (this.isIpoRelated(fullText)) {
            for (const candidate of KNOWN_IPO_CANDIDATES) {
              const mentioned = candidate.keywords.some((kw) => 
                fullText.toLowerCase().includes(kw.toLowerCase())
              );
              
              if (mentioned) {
                const existingRumor = rumors.find(r => r.company === candidate.company);
                if (!existingRumor) {
                  rumors.push({
                    company: candidate.company,
                    symbol: "TBD",
                    exchange: "TBD",
                    estimatedDate: candidate.estimatedDate,
                    sourceUrl: link,
                    sourceName: `Reddit r/${subreddit}`,
                    headline: title.substring(0, 200),
                    confidence: "low",
                    mentions: 1,
                    discoveredAt: new Date(published || Date.now()),
                  });
                }
              }
            }
          }
        });

        await this.delay(1000);
      } catch (error) {
        console.error(`[IpoRumorAgent] Error scanning r/${subreddit} RSS:`, error);
      }
    }

    console.log(`[IpoRumorAgent] Found ${rumors.length} IPO mentions on Reddit RSS`);
    return rumors;
  }

  async crossReferenceWithApeWisdom(): Promise<IpoRumor[]> {
    console.log("[IpoRumorAgent] Cross-referencing with ApeWisdom trending stocks...");
    const rumors: IpoRumor[] = [];

    try {
      const response = await fetch("https://apewisdom.io/api/v1.0/filter/all-stocks/page/1", {
        headers: {
          "User-Agent": "InsiderSignal/1.0",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        console.log(`[IpoRumorAgent] ApeWisdom returned ${response.status}`);
        return rumors;
      }

      const data = await response.json();
      const trendingStocks = data?.results || [];

      for (const stock of trendingStocks.slice(0, 50)) {
        const name = (stock.name || "").toLowerCase();
        
        for (const candidate of KNOWN_IPO_CANDIDATES) {
          const isMatch = candidate.keywords.some(kw => 
            name.includes(kw.toLowerCase()) || 
            (stock.ticker || "").toLowerCase() === kw.toLowerCase()
          );
          
          if (isMatch && stock.mentions > 5) {
            const existingRumor = rumors.find(r => r.company === candidate.company);
            if (!existingRumor) {
              rumors.push({
                company: candidate.company,
                symbol: stock.ticker || "TBD",
                exchange: "TBD",
                estimatedDate: candidate.estimatedDate,
                sourceUrl: `https://apewisdom.io/stocks/${stock.ticker || candidate.company.toLowerCase().replace(/\s+/g, '')}`,
                sourceName: "ApeWisdom (Reddit Aggregator)",
                headline: `${candidate.company} trending on Reddit with ${stock.mentions} mentions`,
                confidence: stock.mentions > 50 ? "medium" : "low",
                mentions: stock.mentions,
                discoveredAt: new Date(),
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("[IpoRumorAgent] ApeWisdom cross-reference error:", error);
    }

    console.log(`[IpoRumorAgent] Found ${rumors.length} IPO candidates from ApeWisdom`);
    return rumors;
  }

  private isIpoRelated(text: string): boolean {
    const lowerText = text.toLowerCase();
    return IPO_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  }

  private extractEstimatedDate(text: string): string {
    const yearPatterns = [
      /\b(202[4-9])\b/,
      /\bq[1-4]\s*(202[4-9])/i,
      /\b(early|mid|late)\s*(202[4-9])/i,
    ];

    for (const pattern of yearPatterns) {
      const match = text.match(pattern);
      if (match) {
        const year = match[1] || match[2];
        if (text.toLowerCase().includes("q1")) return `${year}-Q1`;
        if (text.toLowerCase().includes("q2")) return `${year}-Q2`;
        if (text.toLowerCase().includes("q3")) return `${year}-Q3`;
        if (text.toLowerCase().includes("q4")) return `${year}-Q4`;
        if (text.toLowerCase().includes("first half") || text.toLowerCase().includes("early")) return `${year}-H1`;
        if (text.toLowerCase().includes("second half") || text.toLowerCase().includes("late")) return `${year}-H2`;
        return `${year}-TBD`;
      }
    }

    return "TBD";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRumors(): IpoRumor[] {
    return Array.from(this.rumors.values());
  }

  getLastScanTime(): Date | null {
    return this.lastScan;
  }
}

export const ipoRumorAgent = new IpoRumorAgent();
