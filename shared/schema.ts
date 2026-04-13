import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription tier types
export type SubscriptionTier = "free" | "premium";

// User storage table for email/password auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  disclaimerAcceptedAt: timestamp("disclaimer_accepted_at"),
  subscriptionTier: text("subscription_tier").default("free").notNull(), // "free" | "premium"
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, emailVerified: true, disclaimerAcceptedAt: true, subscriptionTier: true, subscriptionExpiresAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Insider Trade - SEC Form 4 filing data
export const insiderTrades = pgTable("insider_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company: text("company").notNull(),
  ticker: text("ticker").notNull(),
  executive: text("executive").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "buy" | "sell" | "exercise"
  shares: integer("shares").notNull(),
  value: real("value").notNull(),
  pricePerShare: real("price_per_share"),
  date: text("date").notNull(),
  filingDate: text("filing_date"),
  filingUrl: text("filing_url"),
  cik: text("cik"),
  ownershipType: text("ownership_type"), // "direct" | "indirect"
});

export const insertInsiderTradeSchema = createInsertSchema(insiderTrades).omit({ id: true });
export type InsertInsiderTrade = z.infer<typeof insertInsiderTradeSchema>;
export type InsiderTrade = typeof insiderTrades.$inferSelect;

// Congressional Trade - STOCK Act disclosure
export const congressionalTrades = pgTable("congressional_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  member: text("member").notNull(),
  party: text("party").notNull(), // "D" | "R" | "I"
  chamber: text("chamber").notNull(), // "Senate" | "House"
  state: text("state").notNull(),
  ticker: text("ticker").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(), // "buy" | "sell"
  amountRange: text("amount_range").notNull(), // e.g., "$15,001 - $50,000"
  disclosedDate: text("disclosed_date").notNull(),
  tradeDate: text("trade_date").notNull(),
  committee: text("committee"), // relevant committee membership if any
});

export const insertCongressionalTradeSchema = createInsertSchema(congressionalTrades).omit({ id: true });
export type InsertCongressionalTrade = z.infer<typeof insertCongressionalTradeSchema>;
export type CongressionalTrade = typeof congressionalTrades.$inferSelect;

// Alert - AI-detected trading patterns
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "cluster_sell" | "unusual_volume" | "coordinated" | "congressional_conflict"
  severity: text("severity").notNull(), // "high" | "medium" | "low"
  headline: text("headline").notNull(),
  description: text("description").notNull(),
  tickers: text("tickers").array().notNull(),
  timestamp: text("timestamp").notNull(),
  confidence: real("confidence"), // 0-100
  proof: text("proof"), // AI analysis reasoning/evidence
  dismissed: integer("dismissed").default(0), // 0 = active, 1 = dismissed
});

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// Company - tracked companies (Fortune 500 focus)
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ticker: text("ticker").notNull().unique(),
  sector: text("sector"),
  cik: text("cik"),
  marketCap: real("market_cap"),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Executive - tracked executives
export const executives = pgTable("executives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  companyTicker: text("company_ticker").notNull(),
  cik: text("cik"),
});

export const insertExecutiveSchema = createInsertSchema(executives).omit({ id: true });
export type InsertExecutive = z.infer<typeof insertExecutiveSchema>;
export type Executive = typeof executives.$inferSelect;

// Frontend-compatible types (for API responses)
export type TradeType = "buy" | "sell" | "exercise";
export type Party = "D" | "R" | "I";
export type Chamber = "Senate" | "House";
export type AlertType = "cluster_sell" | "unusual_volume" | "coordinated" | "congressional_conflict";
export type Severity = "high" | "medium" | "low";

// API filter types
export const tradeFiltersSchema = z.object({
  type: z.enum(["buy", "sell", "exercise", "all"]).optional(),
  ticker: z.string().optional(),
  executive: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minValue: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type TradeFilters = z.infer<typeof tradeFiltersSchema>;

export const congressionalFiltersSchema = z.object({
  party: z.enum(["D", "R", "I", "all"]).optional(),
  chamber: z.enum(["Senate", "House", "all"]).optional(),
  ticker: z.string().optional(),
  member: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type CongressionalFilters = z.infer<typeof congressionalFiltersSchema>;

export const alertFiltersSchema = z.object({
  severity: z.enum(["high", "medium", "low", "all"]).optional(),
  type: z.enum(["cluster_sell", "unusual_volume", "coordinated", "congressional_conflict", "all"]).optional(),
  dismissed: z.boolean().optional(),
  limit: z.number().optional(),
});

export type AlertFilters = z.infer<typeof alertFiltersSchema>;

// Data Source Status - tracks API connection health
export type DataSourceName = "sec_edgar" | "congressional" | "reddit_buzz";
export type DataSourceStatus = "connected" | "failed" | "partial" | "pending";

export interface DataSource {
  name: DataSourceName;
  displayName: string;
  status: DataSourceStatus;
  lastUpdated: string | null;
  recordCount: number;
  errorMessage: string | null;
}

// Social Buzz - Reddit trending stocks
export interface SocialBuzz {
  id: string;
  ticker: string;
  name: string;
  mentions: number;
  mentionsChange: number;
  upvotes: number;
  rank: number;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  timestamp: string;
}

export type InsertSocialBuzz = Omit<SocialBuzz, "id">;

export const socialBuzzFiltersSchema = z.object({
  limit: z.number().optional(),
  sentiment: z.enum(["bullish", "bearish", "neutral", "all"]).optional(),
});

export type SocialBuzzFilters = z.infer<typeof socialBuzzFiltersSchema>;

// IPO - Initial Public Offering tracking
export const ipos = pgTable("ipos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  company: text("company").notNull(),
  exchange: text("exchange"), // NYSE, NASDAQ, etc.
  ipoDate: text("ipo_date").notNull(),
  priceRangeLow: real("price_range_low"),
  priceRangeHigh: real("price_range_high"),
  offeringPrice: real("offering_price"),
  shares: integer("shares"),
  totalSharesValue: real("total_shares_value"),
  status: text("status").notNull().default("upcoming"), // "upcoming" | "priced" | "trading" | "withdrawn"
  stage: text("stage").notNull().default("filed"), // "rumored" | "filed" | "priced" - progression through IPO process
  prospectusUrl: text("prospectus_url"),
  filingDate: text("filing_date"),
  sourceUrl: text("source_url"), // link to original data source (SEC filing, news article, etc.)
  sourceName: text("source_name"), // "Finnhub" | "IPOScoop" | "SEC EDGAR" | etc.
  isSampleData: boolean("is_sample_data").default(false), // true if this is placeholder/sample data
  notifiedAt: timestamp("notified_at"), // when premium users were notified
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIpoSchema = createInsertSchema(ipos).omit({ id: true, createdAt: true, updatedAt: true, notifiedAt: true });
export type InsertIpo = z.infer<typeof insertIpoSchema>;
export type Ipo = typeof ipos.$inferSelect;
export type IpoStatus = "upcoming" | "priced" | "trading" | "withdrawn";
export type IpoStage = "rumored" | "filed" | "priced";

// Alert Preferences - user notification settings (premium feature)
export const alertPreferences = pgTable("alert_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailAlertsEnabled: boolean("email_alerts_enabled").default(false),
  ipoAlertsEnabled: boolean("ipo_alerts_enabled").default(true),
  insiderAlertsEnabled: boolean("insider_alerts_enabled").default(true),
  congressionalAlertsEnabled: boolean("congressional_alerts_enabled").default(true),
  patternAlertsEnabled: boolean("pattern_alerts_enabled").default(true),
  alertFrequency: text("alert_frequency").default("immediate"), // "immediate" | "daily" | "weekly"
  minAlertSeverity: text("min_alert_severity").default("medium"), // "low" | "medium" | "high"
  watchlistTickers: text("watchlist_tickers").array(), // specific tickers to track
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAlertPreferencesSchema = createInsertSchema(alertPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlertPreferences = z.infer<typeof insertAlertPreferencesSchema>;
export type AlertPreferences = typeof alertPreferences.$inferSelect;
export type AlertFrequency = "immediate" | "daily" | "weekly";

// Email notification log - tracks sent notifications
export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "ipo_alert" | "pattern_alert" | "insider_alert" | "digest"
  subject: text("subject").notNull(),
  contentPreview: text("content_preview"),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent"), // "sent" | "failed" | "bounced"
  resendId: text("resend_id"), // email provider message ID
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({ id: true, sentAt: true });
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// IPO filter types
export const ipoFiltersSchema = z.object({
  status: z.enum(["upcoming", "priced", "trading", "withdrawn", "all"]).optional(),
  stage: z.enum(["rumored", "filed", "priced", "all"]).optional(),
  exchange: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.number().optional(),
});

export type IpoFilters = z.infer<typeof ipoFiltersSchema>;

// Institutional Funds - major investment firms and funds
export const institutionalFunds = pgTable("institutional_funds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cik: text("cik").unique(), // SEC CIK number
  manager: text("manager"), // Notable manager (e.g., "Masayoshi Son", "Warren Buffett")
  aum: real("aum"), // Assets under management in billions
  type: text("type"), // "hedge_fund" | "mutual_fund" | "pension" | "sovereign" | "private_equity"
  headquarters: text("headquarters"),
  founded: integer("founded"),
  description: text("description"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInstitutionalFundSchema = createInsertSchema(institutionalFunds).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInstitutionalFund = z.infer<typeof insertInstitutionalFundSchema>;
export type InstitutionalFund = typeof institutionalFunds.$inferSelect;

// Institutional Trades - 13F filing position changes
export const institutionalTrades = pgTable("institutional_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fundId: varchar("fund_id").notNull().references(() => institutionalFunds.id),
  fundName: text("fund_name").notNull(),
  ticker: text("ticker").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(), // "buy" | "sell" | "new_position" | "exit"
  shares: integer("shares").notNull(),
  sharesChange: integer("shares_change"), // change from previous quarter
  sharesChangePercent: real("shares_change_percent"), // percentage change
  value: real("value").notNull(), // current position value in $
  valueChange: real("value_change"), // change from previous quarter
  portfolioPercent: real("portfolio_percent"), // % of fund's portfolio
  reportDate: text("report_date").notNull(), // 13F filing date
  quarterEnd: text("quarter_end").notNull(), // quarter ending date
  filingUrl: text("filing_url"),
  significance: text("significance"), // "high" | "medium" | "low" - based on value/change magnitude
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInstitutionalTradeSchema = createInsertSchema(institutionalTrades).omit({ id: true, createdAt: true });
export type InsertInstitutionalTrade = z.infer<typeof insertInstitutionalTradeSchema>;
export type InstitutionalTrade = typeof institutionalTrades.$inferSelect;

export const institutionalFiltersSchema = z.object({
  fundId: z.string().optional(),
  ticker: z.string().optional(),
  type: z.enum(["buy", "sell", "new_position", "exit", "all"]).optional(),
  significance: z.enum(["high", "medium", "low", "all"]).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type InstitutionalFilters = z.infer<typeof institutionalFiltersSchema>;

// AI Trade Insights - cached AI-generated analysis for trades (Premium feature)
export const tradeAiInsights = pgTable("trade_ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tradeType: text("trade_type").notNull(), // "insider" | "congressional" | "institutional"
  tradeId: varchar("trade_id").notNull(), // references the specific trade
  ticker: text("ticker").notNull(),
  company: text("company").notNull(),
  analysis: text("analysis").notNull(), // AI-generated insight text
  keyPoints: text("key_points").array(), // bullet points summary
  confidence: real("confidence"), // 0-100 confidence score
  sources: text("sources").array(), // URLs or references used
  generatedByModel: text("generated_by_model"), // e.g., "gpt-4o"
  status: text("status").default("published"), // "draft" | "published" | "error"
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertTradeAiInsightSchema = createInsertSchema(tradeAiInsights).omit({ id: true, generatedAt: true });
export type InsertTradeAiInsight = z.infer<typeof insertTradeAiInsightSchema>;
export type TradeAiInsight = typeof tradeAiInsights.$inferSelect;
export type TradeInsightType = "insider" | "congressional" | "institutional";

// User Preferences - app display and behavior settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  autoRefresh: boolean("auto_refresh").default(true),
  refreshInterval: integer("refresh_interval").default(5), // in minutes
  showSampleData: boolean("show_sample_data").default(true),
  defaultTradeView: text("default_trade_view").default("all"), // "all" | "buys" | "sells"
  compactMode: boolean("compact_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
