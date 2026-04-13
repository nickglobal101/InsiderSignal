import OpenAI from "openai";
import type { InsiderTrade, CongressionalTrade, InsertAlert } from "@shared/schema";

// Lazy-load OpenAI client to avoid crash when API key is not set
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

export async function analyzeTradesForPatterns(
  insiderTrades: InsiderTrade[],
  congressionalTrades: CongressionalTrade[]
): Promise<InsertAlert[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("OpenAI API key not configured, skipping AI analysis");
    return [];
  }

  const alerts: InsertAlert[] = [];

  try {
    // Prepare trade data for analysis
    const tradesSummary = insiderTrades.map((t) => ({
      ticker: t.ticker,
      company: t.company,
      executive: t.executive,
      title: t.title,
      type: t.type,
      value: t.value,
      shares: t.shares,
      date: t.date,
    }));

    const congressionalSummary = congressionalTrades.map((t) => ({
      member: t.member,
      party: t.party,
      chamber: t.chamber,
      ticker: t.ticker,
      company: t.company,
      type: t.type,
      amountRange: t.amountRange,
      disclosedDate: t.disclosedDate,
      tradeDate: t.tradeDate,
      committee: t.committee,
    }));

    const prompt = `You are an expert financial analyst specializing in insider trading patterns and potential conflicts of interest. Analyze the following trading data and identify any concerning patterns.

INSIDER TRADES (SEC Form 4 filings):
${JSON.stringify(tradesSummary, null, 2)}

CONGRESSIONAL TRADES (STOCK Act disclosures):
${JSON.stringify(congressionalSummary, null, 2)}

Identify up to 3 most significant patterns from these categories:
1. CLUSTER_SELL - Multiple executives from the same sector selling within 48-72 hours
2. UNUSUAL_VOLUME - Trading activity significantly above historical averages
3. COORDINATED - Trades that appear coordinated across companies or individuals
4. CONGRESSIONAL_CONFLICT - Congressional trades that may relate to committee memberships

For each pattern found, provide:
- type: one of cluster_sell, unusual_volume, coordinated, congressional_conflict
- severity: high, medium, or low based on significance
- headline: A concise 8-12 word headline
- description: 2-3 sentences explaining the pattern
- tickers: Array of related stock tickers
- confidence: Number 0-100 indicating analysis confidence
- proof: Detailed explanation of the evidence supporting this alert, including specific data points, historical comparisons, and statistical reasoning

Respond with a JSON array of alerts. If no significant patterns found, return empty array [].`;

    const openai = getOpenAIClient();
    if (!openai) {
      return [];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a financial analysis AI that identifies insider trading patterns. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log("No response from OpenAI");
      return [];
    }

    const parsed = JSON.parse(content);
    const rawAlerts = parsed.alerts || parsed;

    if (Array.isArray(rawAlerts)) {
      for (const alert of rawAlerts) {
        if (alert.type && alert.severity && alert.headline) {
          alerts.push({
            type: alert.type,
            severity: alert.severity,
            headline: alert.headline,
            description: alert.description || "",
            tickers: Array.isArray(alert.tickers) ? alert.tickers : [alert.tickers],
            timestamp: new Date().toISOString(),
            confidence: alert.confidence || 50,
            proof: alert.proof || "AI analysis detected this pattern based on recent trading activity.",
            dismissed: 0,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in AI analysis:", error);
    throw error;
  }

  return alerts;
}

// Analyze a specific trade for unusual patterns
export async function analyzeSingleTrade(
  trade: InsiderTrade,
  historicalTrades: InsiderTrade[]
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const historicalForTicker = historicalTrades.filter(
      (t) => t.ticker === trade.ticker
    );

    const avgValue =
      historicalForTicker.length > 0
        ? historicalForTicker.reduce((sum, t) => sum + t.value, 0) /
          historicalForTicker.length
        : 0;

    const prompt = `Analyze this insider trade:
Executive: ${trade.executive} (${trade.title})
Company: ${trade.company} (${trade.ticker})
Type: ${trade.type}
Value: $${trade.value.toLocaleString()}
Shares: ${trade.shares.toLocaleString()}
Date: ${trade.date}

Historical average trade value for ${trade.ticker}: $${avgValue.toLocaleString()}
Number of historical trades: ${historicalForTicker.length}

Provide a brief (2-3 sentences) analysis of whether this trade is unusual and what it might signal. Focus on actionable insights.`;

    const openai = getOpenAIClient();
    if (!openai) {
      return null;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a concise financial analyst. Provide brief, actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Error analyzing single trade:", error);
    return null;
  }
}
