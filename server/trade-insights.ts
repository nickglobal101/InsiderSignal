import OpenAI from "openai";
import type { InsiderTrade, CongressionalTrade, InstitutionalTrade, TradeAiInsight, InsertTradeAiInsight, TradeInsightType } from "@shared/schema";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface TradeContext {
  tradeType: TradeInsightType;
  tradeId: string;
  ticker: string;
  company: string;
  tradeDetails: string;
  recentTrades?: string;
  executiveHistory?: string;
}

function buildInsiderTradeContext(trade: InsiderTrade, recentTrades: InsiderTrade[]): TradeContext {
  const recentForTicker = recentTrades
    .filter(t => t.ticker === trade.ticker && t.id !== trade.id)
    .slice(0, 5);

  const recentTradesText = recentForTicker.length > 0
    ? `Recent trades for ${trade.ticker}: ${recentForTicker.map(t => 
        `${t.executive} (${t.title}) ${t.type} ${t.shares.toLocaleString()} shares ($${t.value.toLocaleString()}) on ${t.date}`
      ).join("; ")}`
    : "No recent insider trades for this ticker.";

  return {
    tradeType: "insider",
    tradeId: trade.id,
    ticker: trade.ticker,
    company: trade.company,
    tradeDetails: `
Trade Type: SEC Form 4 Insider Trade
Executive: ${trade.executive}
Title: ${trade.title}
Company: ${trade.company} (${trade.ticker})
Transaction Type: ${trade.type.toUpperCase()}
Shares: ${trade.shares.toLocaleString()}
Value: $${trade.value.toLocaleString()}
Price Per Share: ${trade.pricePerShare ? `$${trade.pricePerShare.toFixed(2)}` : "Not disclosed"}
Trade Date: ${trade.date}
Filing Date: ${trade.filingDate || "Not available"}
Ownership Type: ${trade.ownershipType || "Direct"}
    `.trim(),
    recentTrades: recentTradesText,
  };
}

function buildCongressionalTradeContext(trade: CongressionalTrade, recentTrades: CongressionalTrade[]): TradeContext {
  const recentForTicker = recentTrades
    .filter(t => t.ticker === trade.ticker && t.id !== trade.id)
    .slice(0, 5);

  const recentByMember = recentTrades
    .filter(t => t.member === trade.member && t.id !== trade.id)
    .slice(0, 5);

  const recentTradesText = [
    recentForTicker.length > 0
      ? `Recent congressional trades for ${trade.ticker}: ${recentForTicker.map(t =>
          `${t.member} (${t.party}-${t.state}) ${t.type} ${t.amountRange} on ${t.tradeDate}`
        ).join("; ")}`
      : "",
    recentByMember.length > 0
      ? `Recent trades by ${trade.member}: ${recentByMember.map(t =>
          `${t.ticker} ${t.type} ${t.amountRange} on ${t.tradeDate}`
        ).join("; ")}`
      : "",
  ].filter(Boolean).join("\n");

  return {
    tradeType: "congressional",
    tradeId: trade.id,
    ticker: trade.ticker,
    company: trade.company,
    tradeDetails: `
Trade Type: Congressional STOCK Act Disclosure
Member: ${trade.member}
Party: ${trade.party === "D" ? "Democrat" : trade.party === "R" ? "Republican" : "Independent"}
Chamber: ${trade.chamber}
State: ${trade.state}
Company: ${trade.company} (${trade.ticker})
Transaction Type: ${trade.type.toUpperCase()}
Amount Range: ${trade.amountRange}
Trade Date: ${trade.tradeDate}
Disclosed Date: ${trade.disclosedDate}
Committee Membership: ${trade.committee || "Not specified"}
    `.trim(),
    recentTrades: recentTradesText || "No recent congressional trades available.",
  };
}

function buildInstitutionalTradeContext(trade: InstitutionalTrade, recentTrades: InstitutionalTrade[]): TradeContext {
  const recentForFund = recentTrades
    .filter(t => t.fundId === trade.fundId && t.id !== trade.id)
    .slice(0, 5);

  const recentForTicker = recentTrades
    .filter(t => t.ticker === trade.ticker && t.id !== trade.id)
    .slice(0, 5);

  const recentTradesText = [
    recentForFund.length > 0
      ? `Recent trades by ${trade.fundName}: ${recentForFund.map(t =>
          `${t.ticker} ${t.type} ${t.shares.toLocaleString()} shares ($${(t.value / 1000000).toFixed(1)}M)`
        ).join("; ")}`
      : "",
    recentForTicker.length > 0
      ? `Recent institutional activity for ${trade.ticker}: ${recentForTicker.map(t =>
          `${t.fundName} ${t.type} ${t.shares.toLocaleString()} shares`
        ).join("; ")}`
      : "",
  ].filter(Boolean).join("\n");

  // Detect if trade is from SEC filing or news source
  const isSecFiling = trade.filingUrl?.includes("sec.gov");
  const isNewsSourced = !isSecFiling && trade.filingUrl;
  
  // Build appropriate trade type description
  let tradeTypeDescription: string;
  let dataSourceNote: string;
  
  if (isSecFiling) {
    tradeTypeDescription = "Institutional 13F Filing (SEC Disclosure)";
    dataSourceNote = `SEC Filing URL: ${trade.filingUrl}`;
  } else if (isNewsSourced) {
    // Extract source name from URL
    const url = trade.filingUrl || "";
    let sourceName = "news reports";
    if (url.includes("cnbc.com")) sourceName = "CNBC";
    else if (url.includes("yahoo.com")) sourceName = "Yahoo Finance";
    else if (url.includes("bloomberg.com")) sourceName = "Bloomberg";
    else if (url.includes("reuters.com")) sourceName = "Reuters";
    else if (url.includes("wsj.com")) sourceName = "Wall Street Journal";
    else if (url.includes("wikipedia.org")) sourceName = "public records (Wikipedia)";
    else if (url.includes("pitchbook.com")) sourceName = "PitchBook";
    else if (url.includes("tracxn.com")) sourceName = "Tracxn";
    else if (url.includes("softbank")) sourceName = "SoftBank investor relations";
    
    tradeTypeDescription = `News-Reported Institutional Activity (NOT an SEC filing - ${trade.fundName} is a foreign entity that does not file 13F forms with the SEC)`;
    dataSourceNote = `Data Source: ${sourceName}\nSource URL: ${url}\nIMPORTANT: This trade information comes from news reports and public disclosures, NOT from SEC filings. Do not reference any 13F filing or SEC disclosure in your analysis.`;
  } else {
    tradeTypeDescription = "Institutional Trade";
    dataSourceNote = "Data source not specified";
  }

  return {
    tradeType: "institutional",
    tradeId: trade.id,
    ticker: trade.ticker,
    company: trade.company,
    tradeDetails: `
Trade Type: ${tradeTypeDescription}
Fund: ${trade.fundName}
Company: ${trade.company} (${trade.ticker})
Transaction Type: ${trade.type.toUpperCase()}
Shares: ${trade.shares.toLocaleString()}
Shares Change: ${trade.sharesChange ? `${trade.sharesChange > 0 ? "+" : ""}${trade.sharesChange.toLocaleString()} (${trade.sharesChangePercent ? trade.sharesChangePercent.toFixed(1) + "%" : "N/A"})` : "New position"}
Value: $${(trade.value / 1000000).toFixed(2)} million
Portfolio Weight: ${trade.portfolioPercent ? trade.portfolioPercent.toFixed(2) + "%" : "Not disclosed"}
Report Date: ${trade.reportDate}
Quarter End: ${trade.quarterEnd}
Significance: ${trade.significance || "Not rated"}
${dataSourceNote}
    `.trim(),
    recentTrades: recentTradesText || "No recent institutional trades available.",
  };
}

async function generateInsightFromContext(context: TradeContext): Promise<InsertTradeAiInsight | null> {
  const openai = getOpenAIClient();
  if (!openai) {
    console.log("[TradeInsights] OpenAI API key not configured");
    return null;
  }

  const systemPrompt = `You are a professional financial analyst providing educational insights about stock trades. Your analysis should be:
1. Objective and data-driven
2. Educational in nature, explaining what the trade data reveals
3. Balanced, considering multiple perspectives
4. Clear about uncertainties and limitations

IMPORTANT: Always include a disclaimer that this is for educational purposes only and not financial advice.

Respond with a JSON object containing:
- analysis: A 2-3 paragraph analysis of the trade, its context, and potential implications (string)
- keyPoints: Array of 3-5 bullet points summarizing key takeaways (string array)
- confidence: Your confidence level in the analysis from 0-100 (number)

Focus on:
- What the trade size/timing might indicate
- Historical context and patterns
- Potential motivations (routine diversification, tax planning, conviction signals, etc.)
- Any relevant regulatory or disclosure context`;

  const userPrompt = `Analyze this ${context.tradeType} trade and provide educational insights:

${context.tradeDetails}

${context.recentTrades ? `\nAdditional Context:\n${context.recentTrades}` : ""}

Provide a balanced analysis focusing on what this trade data might indicate, potential motivations, and relevant context. Remember to note that trades can have many legitimate reasons.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log("[TradeInsights] No response from OpenAI");
      return null;
    }

    const parsed = JSON.parse(content);
    
    return {
      tradeType: context.tradeType,
      tradeId: context.tradeId,
      ticker: context.ticker,
      company: context.company,
      analysis: parsed.analysis || "Unable to generate analysis.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      sources: null,
      generatedByModel: MODEL,
      status: "published",
    };
  } catch (error) {
    console.error("[TradeInsights] Error generating insight:", error);
    return null;
  }
}

export async function getOrGenerateInsiderTradeInsight(
  trade: InsiderTrade,
  recentTrades: InsiderTrade[]
): Promise<TradeAiInsight | null> {
  const existing = await storage.getTradeAiInsight("insider", trade.id);
  if (existing) {
    return existing;
  }

  const context = buildInsiderTradeContext(trade, recentTrades);
  const insight = await generateInsightFromContext(context);
  
  if (insight) {
    return await storage.createTradeAiInsight(insight);
  }
  return null;
}

export async function getOrGenerateCongressionalTradeInsight(
  trade: CongressionalTrade,
  recentTrades: CongressionalTrade[]
): Promise<TradeAiInsight | null> {
  const existing = await storage.getTradeAiInsight("congressional", trade.id);
  if (existing) {
    return existing;
  }

  const context = buildCongressionalTradeContext(trade, recentTrades);
  const insight = await generateInsightFromContext(context);
  
  if (insight) {
    return await storage.createTradeAiInsight(insight);
  }
  return null;
}

export async function getOrGenerateInstitutionalTradeInsight(
  trade: InstitutionalTrade,
  recentTrades: InstitutionalTrade[]
): Promise<TradeAiInsight | null> {
  const existing = await storage.getTradeAiInsight("institutional", trade.id);
  if (existing) {
    return existing;
  }

  const context = buildInstitutionalTradeContext(trade, recentTrades);
  const insight = await generateInsightFromContext(context);
  
  if (insight) {
    return await storage.createTradeAiInsight(insight);
  }
  return null;
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
