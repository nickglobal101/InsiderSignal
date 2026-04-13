import type { InsertSocialBuzz, DataSourceStatus } from "@shared/schema";

const APEWISDOM_BASE_URL = "https://apewisdom.io/api/v1.0";
const USER_AGENT = "InsiderSignal/1.0 (contact@insidersignal.com)";

interface ApeWisdomResult {
  ticker: string;
  name: string;
  mentions: number;
  upvotes: number;
  rank: number;
  mentions_24h_ago?: number;
}

interface ApeWisdomResponse {
  results: ApeWisdomResult[];
  count: number;
}

export interface FetchResult {
  data: InsertSocialBuzz[];
  status: DataSourceStatus;
  recordCount: number;
  errorMessage: string | null;
}

function determineSentiment(mentions: number, upvotes: number, mentionsChange: number): {
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
} {
  const engagementRatio = mentions > 0 ? upvotes / mentions : 0;
  const changeRatio = mentionsChange;
  
  let score = 50;
  
  if (engagementRatio > 50) score += 15;
  else if (engagementRatio > 20) score += 10;
  else if (engagementRatio > 10) score += 5;
  
  if (changeRatio > 100) score += 20;
  else if (changeRatio > 50) score += 15;
  else if (changeRatio > 0) score += 10;
  else if (changeRatio < -50) score -= 15;
  else if (changeRatio < 0) score -= 5;
  
  score = Math.max(0, Math.min(100, score));
  
  let sentiment: "bullish" | "bearish" | "neutral";
  if (score >= 65) sentiment = "bullish";
  else if (score <= 35) sentiment = "bearish";
  else sentiment = "neutral";
  
  return { sentiment, sentimentScore: score };
}

export async function fetchRedditBuzz(): Promise<FetchResult> {
  console.log("Fetching Reddit buzz from ApeWisdom...");
  
  try {
    const response = await fetch(`${APEWISDOM_BASE_URL}/filter/all-stocks/page/1`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error("ApeWisdom API failed:", response.status, response.statusText);
      return {
        data: [],
        status: "failed",
        recordCount: 0,
        errorMessage: `ApeWisdom API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data: ApeWisdomResponse = await response.json();
    console.log(`Fetched ${data.results?.length || 0} trending stocks from ApeWisdom`);
    
    if (!data.results || data.results.length === 0) {
      return {
        data: [],
        status: "connected",
        recordCount: 0,
        errorMessage: null,
      };
    }

    const buzzes: InsertSocialBuzz[] = data.results
      .slice(0, 25)
      .map((item, index) => {
        const mentionsChange = item.mentions_24h_ago 
          ? Math.round(((item.mentions - item.mentions_24h_ago) / item.mentions_24h_ago) * 100)
          : 0;
        
        const { sentiment, sentimentScore } = determineSentiment(
          item.mentions,
          item.upvotes,
          mentionsChange
        );

        return {
          ticker: item.ticker.toUpperCase(),
          name: item.name || item.ticker,
          mentions: item.mentions,
          mentionsChange,
          upvotes: item.upvotes,
          rank: item.rank || index + 1,
          sentiment,
          sentimentScore,
          timestamp: new Date().toISOString(),
        };
      });

    return {
      data: buzzes,
      status: "connected",
      recordCount: buzzes.length,
      errorMessage: null,
    };
  } catch (err) {
    console.error("Error fetching Reddit buzz:", err);
    return {
      data: [],
      status: "failed",
      recordCount: 0,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
