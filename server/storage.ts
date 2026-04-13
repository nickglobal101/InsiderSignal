import {
  type User,
  type UpsertUser,
  type InsiderTrade,
  type InsertInsiderTrade,
  type CongressionalTrade,
  type InsertCongressionalTrade,
  type Alert,
  type InsertAlert,
  type Company,
  type InsertCompany,
  type Executive,
  type InsertExecutive,
  type TradeFilters,
  type CongressionalFilters,
  type AlertFilters,
  type DataSource,
  type DataSourceName,
  type DataSourceStatus,
  type SocialBuzz,
  type InsertSocialBuzz,
  type SocialBuzzFilters,
  type Ipo,
  type InsertIpo,
  type IpoFilters,
  type AlertPreferences,
  type InsertAlertPreferences,
  type EmailNotification,
  type InsertEmailNotification,
  type InstitutionalFund,
  type InsertInstitutionalFund,
  type InstitutionalTrade,
  type InsertInstitutionalTrade,
  type InstitutionalFilters,
  type TradeAiInsight,
  type InsertTradeAiInsight,
  type TradeInsightType,
  type UserPreferences,
  type InsertUserPreferences,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users (Email/Password Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: { email: string; password: string; firstName?: string | null; lastName?: string | null; disclaimerAcceptedAt?: Date | null }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserDisclaimerAccepted(id: string): Promise<User | undefined>;

  // Insider Trades
  getInsiderTrades(filters?: TradeFilters): Promise<InsiderTrade[]>;
  getInsiderTradeById(id: string): Promise<InsiderTrade | undefined>;
  createInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade>;
  createInsiderTrades(trades: InsertInsiderTrade[]): Promise<InsiderTrade[]>;
  clearInsiderTrades(): Promise<void>;

  // Congressional Trades
  getCongressionalTrades(filters?: CongressionalFilters): Promise<CongressionalTrade[]>;
  getCongressionalTradeById(id: string): Promise<CongressionalTrade | undefined>;
  createCongressionalTrade(trade: InsertCongressionalTrade): Promise<CongressionalTrade>;
  createCongressionalTrades(trades: InsertCongressionalTrade[]): Promise<CongressionalTrade[]>;
  clearCongressionalTrades(): Promise<void>;

  // Alerts
  getAlerts(filters?: AlertFilters): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: string): Promise<Alert | undefined>;
  clearAlerts(): Promise<void>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompanyByTicker(ticker: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // Executives
  getExecutives(): Promise<Executive[]>;
  getExecutivesByCompany(ticker: string): Promise<Executive[]>;
  createExecutive(executive: InsertExecutive): Promise<Executive>;

  // Search
  search(query: string): Promise<{
    trades: InsiderTrade[];
    congressionalTrades: CongressionalTrade[];
    companies: Company[];
    executives: Executive[];
  }>;

  // Metrics
  getMetrics(): Promise<{
    sellSignalsToday: number;
    buySignalsToday: number;
    executivesTracked: number;
    activeAlerts: number;
  }>;

  // Data Source Status
  getDataSources(): Promise<DataSource[]>;
  updateDataSource(name: DataSourceName, status: DataSourceStatus, recordCount: number, errorMessage?: string | null): Promise<DataSource>;

  // Social Buzz
  getSocialBuzz(filters?: SocialBuzzFilters): Promise<SocialBuzz[]>;
  createSocialBuzz(buzz: InsertSocialBuzz): Promise<SocialBuzz>;
  createSocialBuzzBatch(buzzes: InsertSocialBuzz[]): Promise<SocialBuzz[]>;
  clearSocialBuzz(): Promise<void>;

  // IPOs
  getIpos(filters?: IpoFilters): Promise<Ipo[]>;
  getIpoById(id: string): Promise<Ipo | undefined>;
  getIpoBySymbolAndDate(symbol: string, ipoDate: string): Promise<Ipo | undefined>;
  createIpo(ipo: InsertIpo): Promise<Ipo>;
  updateIpo(id: string, updates: Partial<Ipo>): Promise<Ipo | undefined>;

  // Alert Preferences
  getAlertPreferences(userId: string): Promise<AlertPreferences | undefined>;
  createOrUpdateAlertPreferences(prefs: InsertAlertPreferences): Promise<AlertPreferences>;
  
  // Email Notifications
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  getEmailNotifications(userId: string, limit?: number): Promise<EmailNotification[]>;

  // Premium Users
  getPremiumUsersWithIpoAlerts(): Promise<User[]>;
  getPremiumUsersWithDigestEnabled(): Promise<User[]>;
  updateUserSubscription(userId: string, tier: string, expiresAt?: Date): Promise<User | undefined>;

  // Institutional Funds
  getInstitutionalFunds(): Promise<InstitutionalFund[]>;
  getInstitutionalFundById(id: string): Promise<InstitutionalFund | undefined>;
  getInstitutionalFundByCik(cik: string): Promise<InstitutionalFund | undefined>;
  createInstitutionalFund(fund: InsertInstitutionalFund): Promise<InstitutionalFund>;
  
  // Institutional Trades
  getInstitutionalTrades(filters?: InstitutionalFilters): Promise<InstitutionalTrade[]>;
  getInstitutionalTradeById(id: string): Promise<InstitutionalTrade | undefined>;
  createInstitutionalTrade(trade: InsertInstitutionalTrade): Promise<InstitutionalTrade>;
  createInstitutionalTrades(trades: InsertInstitutionalTrade[]): Promise<InstitutionalTrade[]>;
  clearInstitutionalTrades(): Promise<void>;
  clearInstitutionalTradesForFund(fundId: string): Promise<void>;
  
  // Trade AI Insights
  getTradeAiInsight(tradeType: TradeInsightType, tradeId: string): Promise<TradeAiInsight | undefined>;
  createTradeAiInsight(insight: InsertTradeAiInsight): Promise<TradeAiInsight>;
  getTradeAiInsightsByTicker(ticker: string): Promise<TradeAiInsight[]>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private insiderTrades: Map<string, InsiderTrade>;
  private congressionalTrades: Map<string, CongressionalTrade>;
  private alerts: Map<string, Alert>;
  private companies: Map<string, Company>;
  private executives: Map<string, Executive>;
  private dataSources: Map<DataSourceName, DataSource>;
  private socialBuzz: Map<string, SocialBuzz>;
  private ipos: Map<string, Ipo>;
  private alertPreferences: Map<string, AlertPreferences>;
  private emailNotifications: Map<string, EmailNotification>;
  private institutionalFunds: Map<string, InstitutionalFund>;
  private institutionalTrades: Map<string, InstitutionalTrade>;
  private tradeAiInsights: Map<string, TradeAiInsight>;
  private userPreferences: Map<string, UserPreferences>;

  constructor() {
    this.users = new Map();
    this.insiderTrades = new Map();
    this.congressionalTrades = new Map();
    this.alerts = new Map();
    this.companies = new Map();
    this.executives = new Map();
    this.socialBuzz = new Map();
    this.ipos = new Map();
    this.alertPreferences = new Map();
    this.emailNotifications = new Map();
    this.institutionalFunds = new Map();
    this.institutionalTrades = new Map();
    this.tradeAiInsights = new Map();
    this.userPreferences = new Map();
    this.dataSources = new Map([
      ["sec_edgar", { name: "sec_edgar", displayName: "SEC EDGAR Form 4", status: "pending", lastUpdated: null, recordCount: 0, errorMessage: null }],
      ["congressional", { name: "congressional", displayName: "Congressional Trades", status: "pending", lastUpdated: null, recordCount: 0, errorMessage: null }],
      ["reddit_buzz", { name: "reddit_buzz", displayName: "Reddit Social Buzz", status: "pending", lastUpdated: null, recordCount: 0, errorMessage: null }],
    ]);
  }

  // Users (Email/Password Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(user => user.email === email);
  }

  async createUser(userData: { email: string; password: string; firstName?: string | null; lastName?: string | null; disclaimerAcceptedAt?: Date | null }): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: null,
      emailVerified: false,
      disclaimerAcceptedAt: userData.disclaimerAcceptedAt || null,
      subscriptionTier: "free",
      subscriptionExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? this.users.get(userData.id) : undefined;
    const now = new Date();
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: now,
      };
      this.users.set(existingUser.id, updatedUser);
      return updatedUser;
    }
    
    const id = userData.id || randomUUID();
    const user: User = { 
      id,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      emailVerified: userData.emailVerified ?? null,
      disclaimerAcceptedAt: userData.disclaimerAcceptedAt ?? null,
      subscriptionTier: userData.subscriptionTier ?? "free",
      subscriptionExpiresAt: userData.subscriptionExpiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserDisclaimerAccepted(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.disclaimerAcceptedAt = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
    return user;
  }

  // Insider Trades
  async getInsiderTrades(filters?: TradeFilters): Promise<InsiderTrade[]> {
    let trades = Array.from(this.insiderTrades.values());

    if (filters) {
      if (filters.type && filters.type !== "all") {
        trades = trades.filter((t) => t.type === filters.type);
      }
      if (filters.ticker) {
        trades = trades.filter((t) =>
          t.ticker.toLowerCase().includes(filters.ticker!.toLowerCase())
        );
      }
      if (filters.executive) {
        trades = trades.filter((t) =>
          t.executive.toLowerCase().includes(filters.executive!.toLowerCase())
        );
      }
      if (filters.minValue) {
        trades = trades.filter((t) => t.value >= filters.minValue!);
      }
    }

    // Sort by date descending (most recent first)
    trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters?.offset) {
      trades = trades.slice(filters.offset);
    }
    if (filters?.limit) {
      trades = trades.slice(0, filters.limit);
    }

    return trades;
  }

  async getInsiderTradeById(id: string): Promise<InsiderTrade | undefined> {
    return this.insiderTrades.get(id);
  }

  async createInsiderTrade(trade: InsertInsiderTrade): Promise<InsiderTrade> {
    const id = randomUUID();
    const newTrade: InsiderTrade = { 
      id,
      date: trade.date,
      title: trade.title,
      type: trade.type,
      value: trade.value,
      company: trade.company,
      executive: trade.executive,
      ticker: trade.ticker,
      shares: trade.shares,
      pricePerShare: trade.pricePerShare ?? null,
      filingDate: trade.filingDate ?? null,
      filingUrl: trade.filingUrl ?? null,
      cik: trade.cik ?? null,
      ownershipType: trade.ownershipType ?? null,
    };
    this.insiderTrades.set(id, newTrade);
    return newTrade;
  }

  async createInsiderTrades(trades: InsertInsiderTrade[]): Promise<InsiderTrade[]> {
    const created: InsiderTrade[] = [];
    for (const trade of trades) {
      const newTrade = await this.createInsiderTrade(trade);
      created.push(newTrade);
    }
    return created;
  }

  async clearInsiderTrades(): Promise<void> {
    this.insiderTrades.clear();
  }

  // Congressional Trades
  async getCongressionalTrades(filters?: CongressionalFilters): Promise<CongressionalTrade[]> {
    let trades = Array.from(this.congressionalTrades.values());

    if (filters) {
      if (filters.party && filters.party !== "all") {
        trades = trades.filter((t) => t.party === filters.party);
      }
      if (filters.chamber && filters.chamber !== "all") {
        trades = trades.filter((t) => t.chamber === filters.chamber);
      }
      if (filters.ticker) {
        trades = trades.filter((t) =>
          t.ticker.toLowerCase().includes(filters.ticker!.toLowerCase())
        );
      }
      if (filters.member) {
        trades = trades.filter((t) =>
          t.member.toLowerCase().includes(filters.member!.toLowerCase())
        );
      }
    }

    // Sort by disclosed date descending
    trades.sort((a, b) => new Date(b.disclosedDate).getTime() - new Date(a.disclosedDate).getTime());

    if (filters?.offset) {
      trades = trades.slice(filters.offset);
    }
    if (filters?.limit) {
      trades = trades.slice(0, filters.limit);
    }

    return trades;
  }

  async getCongressionalTradeById(id: string): Promise<CongressionalTrade | undefined> {
    return this.congressionalTrades.get(id);
  }

  async createCongressionalTrade(trade: InsertCongressionalTrade): Promise<CongressionalTrade> {
    const id = randomUUID();
    const newTrade: CongressionalTrade = { 
      id,
      type: trade.type,
      company: trade.company,
      ticker: trade.ticker,
      member: trade.member,
      party: trade.party,
      chamber: trade.chamber,
      state: trade.state,
      amountRange: trade.amountRange,
      disclosedDate: trade.disclosedDate,
      tradeDate: trade.tradeDate,
      committee: trade.committee ?? null,
    };
    this.congressionalTrades.set(id, newTrade);
    return newTrade;
  }

  async createCongressionalTrades(trades: InsertCongressionalTrade[]): Promise<CongressionalTrade[]> {
    const created: CongressionalTrade[] = [];
    for (const trade of trades) {
      const newTrade = await this.createCongressionalTrade(trade);
      created.push(newTrade);
    }
    return created;
  }

  async clearCongressionalTrades(): Promise<void> {
    this.congressionalTrades.clear();
  }

  // Alerts
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    let alertsList = Array.from(this.alerts.values());

    if (filters) {
      if (filters.severity && filters.severity !== "all") {
        alertsList = alertsList.filter((a) => a.severity === filters.severity);
      }
      if (filters.type && filters.type !== "all") {
        alertsList = alertsList.filter((a) => a.type === filters.type);
      }
      if (filters.dismissed !== undefined) {
        alertsList = alertsList.filter((a) => (a.dismissed === 1) === filters.dismissed);
      } else {
        // By default, show only non-dismissed alerts
        alertsList = alertsList.filter((a) => a.dismissed !== 1);
      }
    }

    // Sort by timestamp descending (most recent first)
    alertsList.sort((a, b) => {
      // Handle relative timestamps like "2 hours ago"
      return 0; // Alerts are ordered by insertion for now
    });

    if (filters?.limit) {
      alertsList = alertsList.slice(0, filters.limit);
    }

    return alertsList;
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = { 
      id,
      type: alert.type,
      timestamp: alert.timestamp,
      severity: alert.severity,
      headline: alert.headline,
      description: alert.description,
      tickers: alert.tickers,
      dismissed: alert.dismissed ?? null,
      confidence: alert.confidence ?? null,
      proof: alert.proof ?? null,
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async dismissAlert(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.dismissed = 1;
      this.alerts.set(id, alert);
    }
    return alert;
  }

  async clearAlerts(): Promise<void> {
    this.alerts.clear();
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompanyByTicker(ticker: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(
      (c) => c.ticker.toLowerCase() === ticker.toLowerCase()
    );
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const newCompany: Company = { 
      id,
      name: company.name,
      ticker: company.ticker,
      cik: company.cik ?? null,
      sector: company.sector ?? null,
      marketCap: company.marketCap ?? null,
    };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  // Executives
  async getExecutives(): Promise<Executive[]> {
    return Array.from(this.executives.values());
  }

  async getExecutivesByCompany(ticker: string): Promise<Executive[]> {
    return Array.from(this.executives.values()).filter(
      (e) => e.companyTicker.toLowerCase() === ticker.toLowerCase()
    );
  }

  async createExecutive(executive: InsertExecutive): Promise<Executive> {
    const id = randomUUID();
    const newExecutive: Executive = { 
      id,
      name: executive.name,
      title: executive.title,
      companyTicker: executive.companyTicker,
      cik: executive.cik ?? null,
    };
    this.executives.set(id, newExecutive);
    return newExecutive;
  }

  // Search across all data
  async search(query: string): Promise<{
    trades: InsiderTrade[];
    congressionalTrades: CongressionalTrade[];
    companies: Company[];
    executives: Executive[];
    institutionalFunds: InstitutionalFund[];
    institutionalTrades: InstitutionalTrade[];
  }> {
    const q = query.toLowerCase();

    const trades = Array.from(this.insiderTrades.values()).filter(
      (t) =>
        t.ticker.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.executive.toLowerCase().includes(q)
    );

    const congressionalTrades = Array.from(this.congressionalTrades.values()).filter(
      (t) =>
        t.ticker.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.member.toLowerCase().includes(q)
    );

    const companies = Array.from(this.companies.values()).filter(
      (c) =>
        c.ticker.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    );

    const executives = Array.from(this.executives.values()).filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.companyTicker.toLowerCase().includes(q)
    );

    const institutionalFunds = Array.from(this.institutionalFunds.values()).filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.manager && f.manager.toLowerCase().includes(q))
    );

    const institutionalTrades = Array.from(this.institutionalTrades.values()).filter(
      (t) =>
        t.ticker.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.fundName.toLowerCase().includes(q)
    );

    return { trades, congressionalTrades, companies, executives, institutionalFunds, institutionalTrades };
  }

  // Metrics for dashboard
  async getMetrics(): Promise<{
    sellSignalsToday: number;
    buySignalsToday: number;
    executivesTracked: number;
    activeAlerts: number;
  }> {
    const today = new Date().toDateString();
    const trades = Array.from(this.insiderTrades.values());

    const sellSignalsToday = trades.filter(
      (t) => t.type === "sell" && new Date(t.date).toDateString() === today
    ).length;

    const buySignalsToday = trades.filter(
      (t) => t.type === "buy" && new Date(t.date).toDateString() === today
    ).length;

    const executivesTracked = this.executives.size;

    const activeAlerts = Array.from(this.alerts.values()).filter(
      (a) => a.dismissed !== 1
    ).length;

    return {
      sellSignalsToday,
      buySignalsToday,
      executivesTracked,
      activeAlerts,
    };
  }

  // Data Source Status
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async updateDataSource(
    name: DataSourceName,
    status: DataSourceStatus,
    recordCount: number,
    errorMessage?: string | null
  ): Promise<DataSource> {
    const existing = this.dataSources.get(name);
    const updated: DataSource = {
      name,
      displayName: existing?.displayName || name,
      status,
      lastUpdated: new Date().toISOString(),
      recordCount,
      errorMessage: errorMessage ?? null,
    };
    this.dataSources.set(name, updated);
    return updated;
  }

  // Social Buzz
  async getSocialBuzz(filters?: SocialBuzzFilters): Promise<SocialBuzz[]> {
    let buzzes = Array.from(this.socialBuzz.values());

    if (filters) {
      if (filters.sentiment && filters.sentiment !== "all") {
        buzzes = buzzes.filter((b) => b.sentiment === filters.sentiment);
      }
    }

    buzzes.sort((a, b) => a.rank - b.rank);

    if (filters?.limit) {
      buzzes = buzzes.slice(0, filters.limit);
    }

    return buzzes;
  }

  async createSocialBuzz(buzz: InsertSocialBuzz): Promise<SocialBuzz> {
    const id = randomUUID();
    const newBuzz: SocialBuzz = { ...buzz, id };
    this.socialBuzz.set(id, newBuzz);
    return newBuzz;
  }

  async createSocialBuzzBatch(buzzes: InsertSocialBuzz[]): Promise<SocialBuzz[]> {
    const created: SocialBuzz[] = [];
    for (const buzz of buzzes) {
      const newBuzz = await this.createSocialBuzz(buzz);
      created.push(newBuzz);
    }
    return created;
  }

  async clearSocialBuzz(): Promise<void> {
    this.socialBuzz.clear();
  }

  // IPOs
  async getIpos(filters?: IpoFilters): Promise<Ipo[]> {
    let ipoList = Array.from(this.ipos.values());

    if (filters) {
      if (filters.status && filters.status !== "all") {
        ipoList = ipoList.filter(i => i.status === filters.status);
      }
      if (filters.stage && filters.stage !== "all") {
        ipoList = ipoList.filter(i => (i.stage ?? "filed") === filters.stage);
      }
      if (filters.exchange) {
        ipoList = ipoList.filter(i => i.exchange?.toLowerCase().includes(filters.exchange!.toLowerCase()));
      }
      if (filters.dateFrom) {
        ipoList = ipoList.filter(i => i.ipoDate >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        ipoList = ipoList.filter(i => i.ipoDate <= filters.dateTo!);
      }
    }

    // Sort with rumored IPOs (TBD dates) at the end
    ipoList.sort((a, b) => {
      const aIsTBD = a.ipoDate.includes('TBD') || a.ipoDate.includes('Q');
      const bIsTBD = b.ipoDate.includes('TBD') || b.ipoDate.includes('Q');
      if (aIsTBD && !bIsTBD) return 1;
      if (!aIsTBD && bIsTBD) return -1;
      if (aIsTBD && bIsTBD) return a.company.localeCompare(b.company);
      return new Date(a.ipoDate).getTime() - new Date(b.ipoDate).getTime();
    });

    if (filters?.limit) {
      ipoList = ipoList.slice(0, filters.limit);
    }

    return ipoList;
  }

  async getIpoById(id: string): Promise<Ipo | undefined> {
    return this.ipos.get(id);
  }

  async getIpoBySymbolAndDate(symbol: string, ipoDate: string): Promise<Ipo | undefined> {
    return Array.from(this.ipos.values()).find(
      i => i.symbol === symbol && i.ipoDate === ipoDate
    );
  }

  async createIpo(ipoData: InsertIpo): Promise<Ipo> {
    const now = new Date();
    const id = randomUUID();
    const ipo: Ipo = {
      id,
      symbol: ipoData.symbol,
      company: ipoData.company,
      exchange: ipoData.exchange ?? null,
      ipoDate: ipoData.ipoDate,
      priceRangeLow: ipoData.priceRangeLow ?? null,
      priceRangeHigh: ipoData.priceRangeHigh ?? null,
      offeringPrice: ipoData.offeringPrice ?? null,
      shares: ipoData.shares ?? null,
      totalSharesValue: ipoData.totalSharesValue ?? null,
      status: ipoData.status ?? "upcoming",
      stage: ipoData.stage ?? "filed",
      prospectusUrl: ipoData.prospectusUrl ?? null,
      filingDate: ipoData.filingDate ?? null,
      sourceUrl: ipoData.sourceUrl ?? null,
      sourceName: ipoData.sourceName ?? null,
      isSampleData: ipoData.isSampleData ?? false,
      notifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.ipos.set(id, ipo);
    return ipo;
  }

  async updateIpo(id: string, updates: Partial<Ipo>): Promise<Ipo | undefined> {
    const ipo = this.ipos.get(id);
    if (!ipo) return undefined;
    
    const updated: Ipo = {
      ...ipo,
      ...updates,
      updatedAt: new Date(),
    };
    this.ipos.set(id, updated);
    return updated;
  }

  // Alert Preferences
  async getAlertPreferences(userId: string): Promise<AlertPreferences | undefined> {
    return Array.from(this.alertPreferences.values()).find(p => p.userId === userId);
  }

  async createOrUpdateAlertPreferences(prefs: InsertAlertPreferences): Promise<AlertPreferences> {
    const existing = await this.getAlertPreferences(prefs.userId);
    const now = new Date();
    
    if (existing) {
      const updated: AlertPreferences = {
        ...existing,
        ...prefs,
        updatedAt: now,
      };
      this.alertPreferences.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const newPrefs: AlertPreferences = {
      id,
      userId: prefs.userId,
      emailAlertsEnabled: prefs.emailAlertsEnabled ?? false,
      ipoAlertsEnabled: prefs.ipoAlertsEnabled ?? true,
      insiderAlertsEnabled: prefs.insiderAlertsEnabled ?? true,
      congressionalAlertsEnabled: prefs.congressionalAlertsEnabled ?? true,
      patternAlertsEnabled: prefs.patternAlertsEnabled ?? true,
      alertFrequency: prefs.alertFrequency ?? "immediate",
      minAlertSeverity: prefs.minAlertSeverity ?? "medium",
      watchlistTickers: prefs.watchlistTickers ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.alertPreferences.set(id, newPrefs);
    return newPrefs;
  }

  // Email Notifications
  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const id = randomUUID();
    const newNotification: EmailNotification = {
      id,
      userId: notification.userId,
      type: notification.type,
      subject: notification.subject,
      contentPreview: notification.contentPreview ?? null,
      sentAt: new Date(),
      status: notification.status ?? "sent",
      resendId: notification.resendId ?? null,
    };
    this.emailNotifications.set(id, newNotification);
    return newNotification;
  }

  async getEmailNotifications(userId: string, limit?: number): Promise<EmailNotification[]> {
    let notifications = Array.from(this.emailNotifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0));
    
    if (limit) {
      notifications = notifications.slice(0, limit);
    }
    
    return notifications;
  }

  // Premium Users
  async getPremiumUsersWithIpoAlerts(): Promise<User[]> {
    const premiumUsers = Array.from(this.users.values()).filter(
      u => u.subscriptionTier === "premium" && 
           (!u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date())
    );
    
    const usersWithAlerts: User[] = [];
    for (const user of premiumUsers) {
      const prefs = await this.getAlertPreferences(user.id);
      if (!prefs || (prefs.emailAlertsEnabled && prefs.ipoAlertsEnabled)) {
        usersWithAlerts.push(user);
      }
    }
    
    return usersWithAlerts;
  }

  async getPremiumUsersWithDigestEnabled(): Promise<User[]> {
    const premiumUsers = Array.from(this.users.values()).filter(
      u => u.subscriptionTier === "premium" && 
           (!u.subscriptionExpiresAt || u.subscriptionExpiresAt > new Date())
    );
    
    const usersWithDigest: User[] = [];
    for (const user of premiumUsers) {
      const prefs = await this.getAlertPreferences(user.id);
      if (prefs && prefs.emailAlertsEnabled && prefs.alertFrequency === "daily") {
        usersWithDigest.push(user);
      }
    }
    
    return usersWithDigest;
  }

  async updateUserSubscription(userId: string, tier: string, expiresAt?: Date): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    user.subscriptionTier = tier;
    user.subscriptionExpiresAt = expiresAt ?? null;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  // Institutional Funds
  async getInstitutionalFunds(): Promise<InstitutionalFund[]> {
    return Array.from(this.institutionalFunds.values());
  }

  async getInstitutionalFundById(id: string): Promise<InstitutionalFund | undefined> {
    return this.institutionalFunds.get(id);
  }

  async getInstitutionalFundByCik(cik: string): Promise<InstitutionalFund | undefined> {
    return Array.from(this.institutionalFunds.values()).find(f => f.cik === cik);
  }

  async createInstitutionalFund(fund: InsertInstitutionalFund): Promise<InstitutionalFund> {
    const id = randomUUID();
    const newFund: InstitutionalFund = {
      id,
      name: fund.name,
      cik: fund.cik ?? null,
      manager: fund.manager ?? null,
      aum: fund.aum ?? null,
      type: fund.type ?? null,
      headquarters: fund.headquarters ?? null,
      founded: fund.founded ?? null,
      description: fund.description ?? null,
      logoUrl: fund.logoUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.institutionalFunds.set(id, newFund);
    return newFund;
  }

  // Institutional Trades
  async getInstitutionalTrades(filters?: InstitutionalFilters): Promise<InstitutionalTrade[]> {
    let trades = Array.from(this.institutionalTrades.values());
    
    if (filters?.fundId) {
      trades = trades.filter(t => t.fundId === filters.fundId);
    }
    if (filters?.ticker) {
      trades = trades.filter(t => t.ticker.toLowerCase().includes(filters.ticker!.toLowerCase()));
    }
    if (filters?.type && filters.type !== "all") {
      trades = trades.filter(t => t.type === filters.type);
    }
    if (filters?.significance && filters.significance !== "all") {
      trades = trades.filter(t => t.significance === filters.significance);
    }
    
    trades.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    
    if (filters?.offset) {
      trades = trades.slice(filters.offset);
    }
    if (filters?.limit) {
      trades = trades.slice(0, filters.limit);
    }
    
    return trades;
  }

  async getInstitutionalTradeById(id: string): Promise<InstitutionalTrade | undefined> {
    return this.institutionalTrades.get(id);
  }

  async createInstitutionalTrade(trade: InsertInstitutionalTrade): Promise<InstitutionalTrade> {
    const id = randomUUID();
    const newTrade: InstitutionalTrade = {
      id,
      fundId: trade.fundId,
      fundName: trade.fundName,
      ticker: trade.ticker,
      company: trade.company,
      type: trade.type,
      shares: trade.shares,
      sharesChange: trade.sharesChange ?? null,
      sharesChangePercent: trade.sharesChangePercent ?? null,
      value: trade.value,
      valueChange: trade.valueChange ?? null,
      portfolioPercent: trade.portfolioPercent ?? null,
      reportDate: trade.reportDate,
      quarterEnd: trade.quarterEnd,
      filingUrl: trade.filingUrl ?? null,
      significance: trade.significance ?? null,
      createdAt: new Date(),
    };
    this.institutionalTrades.set(id, newTrade);
    return newTrade;
  }

  async createInstitutionalTrades(trades: InsertInstitutionalTrade[]): Promise<InstitutionalTrade[]> {
    const created: InstitutionalTrade[] = [];
    for (const trade of trades) {
      const newTrade = await this.createInstitutionalTrade(trade);
      created.push(newTrade);
    }
    return created;
  }

  async clearInstitutionalTrades(): Promise<void> {
    this.institutionalTrades.clear();
  }

  async clearInstitutionalTradesForFund(fundId: string): Promise<void> {
    const entries = Array.from(this.institutionalTrades.entries());
    for (const [key, trade] of entries) {
      if (trade.fundId === fundId) {
        this.institutionalTrades.delete(key);
      }
    }
  }

  // Trade AI Insights
  async getTradeAiInsight(tradeType: TradeInsightType, tradeId: string): Promise<TradeAiInsight | undefined> {
    const insights = Array.from(this.tradeAiInsights.values());
    return insights.find(i => i.tradeType === tradeType && i.tradeId === tradeId);
  }

  async createTradeAiInsight(insight: InsertTradeAiInsight): Promise<TradeAiInsight> {
    const newInsight: TradeAiInsight = {
      ...insight,
      id: randomUUID(),
      keyPoints: insight.keyPoints || null,
      confidence: insight.confidence || null,
      sources: insight.sources || null,
      generatedByModel: insight.generatedByModel || null,
      status: insight.status || "published",
      generatedAt: new Date(),
    };
    this.tradeAiInsights.set(newInsight.id, newInsight);
    return newInsight;
  }

  async getTradeAiInsightsByTicker(ticker: string): Promise<TradeAiInsight[]> {
    const insights = Array.from(this.tradeAiInsights.values());
    return insights.filter(i => i.ticker.toLowerCase() === ticker.toLowerCase());
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const prefs = Array.from(this.userPreferences.values());
    return prefs.find(p => p.userId === userId);
  }

  async createOrUpdateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(prefs.userId);
    const now = new Date();
    if (existing) {
      const updated: UserPreferences = {
        ...existing,
        ...prefs,
        updatedAt: now,
      };
      this.userPreferences.set(existing.id, updated);
      return updated;
    } else {
      const newPrefs: UserPreferences = {
        id: randomUUID(),
        userId: prefs.userId,
        autoRefresh: prefs.autoRefresh ?? true,
        refreshInterval: prefs.refreshInterval ?? 5,
        showSampleData: prefs.showSampleData ?? true,
        defaultTradeView: prefs.defaultTradeView ?? "all",
        compactMode: prefs.compactMode ?? false,
        createdAt: now,
        updatedAt: now,
      };
      this.userPreferences.set(newPrefs.id, newPrefs);
      return newPrefs;
    }
  }
}

// Database-backed storage that uses PostgreSQL for IPOs and Institutional Trades
import { db } from "./db";
import { ipos as iposTable, institutionalFunds as fundsTable, institutionalTrades as instTradesTable, tradeAiInsights as insightsTable, users as usersTable, userPreferences as userPrefsTable } from "@shared/schema";
import { eq, and, or, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";

export class DatabaseStorage extends MemStorage {
  // Override IPO methods to use PostgreSQL
  
  async getIpos(filters?: IpoFilters): Promise<Ipo[]> {
    try {
      let query = db.select().from(iposTable);
      
      const conditions: any[] = [];
      
      if (filters?.status && filters.status !== "all") {
        conditions.push(eq(iposTable.status, filters.status));
      }
      if (filters?.stage && filters.stage !== "all") {
        conditions.push(eq(iposTable.stage, filters.stage));
      }
      if (filters?.exchange) {
        conditions.push(ilike(iposTable.exchange, `%${filters.exchange}%`));
      }
      if (filters?.dateFrom) {
        conditions.push(gte(iposTable.ipoDate, filters.dateFrom));
      }
      if (filters?.dateTo) {
        conditions.push(lte(iposTable.ipoDate, filters.dateTo));
      }
      
      let result: Ipo[];
      if (conditions.length > 0) {
        result = await db.select().from(iposTable).where(and(...conditions));
      } else {
        result = await db.select().from(iposTable);
      }
      
      // Sort with rumored IPOs (TBD dates) at the end
      result.sort((a, b) => {
        const aIsTBD = a.ipoDate.includes('TBD') || a.ipoDate.includes('Q') || a.ipoDate.includes('H');
        const bIsTBD = b.ipoDate.includes('TBD') || b.ipoDate.includes('Q') || b.ipoDate.includes('H');
        if (aIsTBD && !bIsTBD) return 1;
        if (!aIsTBD && bIsTBD) return -1;
        if (aIsTBD && bIsTBD) return a.company.localeCompare(b.company);
        return new Date(a.ipoDate).getTime() - new Date(b.ipoDate).getTime();
      });
      
      if (filters?.limit) {
        result = result.slice(0, filters.limit);
      }
      
      return result;
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching IPOs from database:", error);
      return super.getIpos(filters);
    }
  }

  async getIpoById(id: string): Promise<Ipo | undefined> {
    try {
      const result = await db.select().from(iposTable).where(eq(iposTable.id, id));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching IPO by ID:", error);
      return super.getIpoById(id);
    }
  }

  async getIpoBySymbolAndDate(symbol: string, ipoDate: string): Promise<Ipo | undefined> {
    try {
      const result = await db.select().from(iposTable).where(
        and(eq(iposTable.symbol, symbol), eq(iposTable.ipoDate, ipoDate))
      );
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching IPO by symbol and date:", error);
      return super.getIpoBySymbolAndDate(symbol, ipoDate);
    }
  }

  async createIpo(ipoData: InsertIpo): Promise<Ipo> {
    try {
      const result = await db.insert(iposTable).values({
        symbol: ipoData.symbol,
        company: ipoData.company,
        exchange: ipoData.exchange ?? null,
        ipoDate: ipoData.ipoDate,
        priceRangeLow: ipoData.priceRangeLow ?? null,
        priceRangeHigh: ipoData.priceRangeHigh ?? null,
        offeringPrice: ipoData.offeringPrice ?? null,
        shares: ipoData.shares ?? null,
        totalSharesValue: ipoData.totalSharesValue ?? null,
        status: ipoData.status ?? "upcoming",
        stage: ipoData.stage ?? "filed",
        prospectusUrl: ipoData.prospectusUrl ?? null,
        filingDate: ipoData.filingDate ?? null,
        sourceUrl: ipoData.sourceUrl ?? null,
        sourceName: ipoData.sourceName ?? null,
        isSampleData: ipoData.isSampleData ?? false,
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error creating IPO:", error);
      return super.createIpo(ipoData);
    }
  }

  async updateIpo(id: string, updates: Partial<Ipo>): Promise<Ipo | undefined> {
    try {
      const result = await db.update(iposTable)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(iposTable.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error updating IPO:", error);
      return super.updateIpo(id, updates);
    }
  }

  // Institutional Funds - Database backed
  async getInstitutionalFunds(): Promise<InstitutionalFund[]> {
    try {
      return await db.select().from(fundsTable);
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching institutional funds:", error);
      return super.getInstitutionalFunds();
    }
  }

  async getInstitutionalFundById(id: string): Promise<InstitutionalFund | undefined> {
    try {
      const result = await db.select().from(fundsTable).where(eq(fundsTable.id, id));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching fund by ID:", error);
      return super.getInstitutionalFundById(id);
    }
  }

  async getInstitutionalFundByCik(cik: string): Promise<InstitutionalFund | undefined> {
    try {
      const result = await db.select().from(fundsTable).where(eq(fundsTable.cik, cik));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching fund by CIK:", error);
      return super.getInstitutionalFundByCik(cik);
    }
  }

  async createInstitutionalFund(fund: InsertInstitutionalFund): Promise<InstitutionalFund> {
    try {
      const result = await db.insert(fundsTable).values({
        name: fund.name,
        cik: fund.cik ?? null,
        manager: fund.manager ?? null,
        aum: fund.aum ?? null,
        type: fund.type ?? null,
        headquarters: fund.headquarters ?? null,
        founded: fund.founded ?? null,
        description: fund.description ?? null,
        logoUrl: fund.logoUrl ?? null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error creating institutional fund:", error);
      return super.createInstitutionalFund(fund);
    }
  }

  // Institutional Trades - Database backed
  async getInstitutionalTrades(filters?: InstitutionalFilters): Promise<InstitutionalTrade[]> {
    try {
      const conditions: any[] = [];
      
      if (filters?.fundId) {
        conditions.push(eq(instTradesTable.fundId, filters.fundId));
      }
      if (filters?.ticker) {
        conditions.push(ilike(instTradesTable.ticker, `%${filters.ticker}%`));
      }
      if (filters?.type && filters.type !== "all") {
        conditions.push(eq(instTradesTable.type, filters.type));
      }
      if (filters?.significance && filters.significance !== "all") {
        conditions.push(eq(instTradesTable.significance, filters.significance));
      }
      
      let result: InstitutionalTrade[];
      if (conditions.length > 0) {
        result = await db.select().from(instTradesTable).where(and(...conditions)).orderBy(desc(instTradesTable.reportDate));
      } else {
        result = await db.select().from(instTradesTable).orderBy(desc(instTradesTable.reportDate));
      }
      
      if (filters?.offset) {
        result = result.slice(filters.offset);
      }
      if (filters?.limit) {
        result = result.slice(0, filters.limit);
      }
      
      return result;
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching institutional trades:", error);
      return super.getInstitutionalTrades(filters);
    }
  }

  async getInstitutionalTradeById(id: string): Promise<InstitutionalTrade | undefined> {
    try {
      const result = await db.select().from(instTradesTable).where(eq(instTradesTable.id, id));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching institutional trade by ID:", error);
      return super.getInstitutionalTradeById(id);
    }
  }

  async createInstitutionalTrade(trade: InsertInstitutionalTrade): Promise<InstitutionalTrade> {
    try {
      const result = await db.insert(instTradesTable).values({
        fundId: trade.fundId,
        fundName: trade.fundName,
        ticker: trade.ticker,
        company: trade.company,
        type: trade.type,
        shares: trade.shares,
        sharesChange: trade.sharesChange ?? null,
        sharesChangePercent: trade.sharesChangePercent ?? null,
        value: trade.value,
        valueChange: trade.valueChange ?? null,
        portfolioPercent: trade.portfolioPercent ?? null,
        reportDate: trade.reportDate,
        quarterEnd: trade.quarterEnd,
        filingUrl: trade.filingUrl ?? null,
        significance: trade.significance ?? null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error creating institutional trade:", error);
      return super.createInstitutionalTrade(trade);
    }
  }

  async createInstitutionalTrades(trades: InsertInstitutionalTrade[]): Promise<InstitutionalTrade[]> {
    const created: InstitutionalTrade[] = [];
    for (const trade of trades) {
      const newTrade = await this.createInstitutionalTrade(trade);
      created.push(newTrade);
    }
    return created;
  }

  async clearInstitutionalTrades(): Promise<void> {
    try {
      await db.delete(instTradesTable);
    } catch (error) {
      console.error("[DatabaseStorage] Error clearing institutional trades:", error);
      return super.clearInstitutionalTrades();
    }
  }

  async clearInstitutionalTradesForFund(fundId: string): Promise<void> {
    try {
      await db.delete(instTradesTable).where(eq(instTradesTable.fundId, fundId));
    } catch (error) {
      console.error("[DatabaseStorage] Error clearing trades for fund:", error);
      return super.clearInstitutionalTradesForFund(fundId);
    }
  }

  // Trade AI Insights - Database backed
  async getTradeAiInsight(tradeType: TradeInsightType, tradeId: string): Promise<TradeAiInsight | undefined> {
    try {
      const result = await db.select().from(insightsTable)
        .where(and(
          eq(insightsTable.tradeType, tradeType),
          eq(insightsTable.tradeId, tradeId)
        ));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching trade AI insight:", error);
      return super.getTradeAiInsight(tradeType, tradeId);
    }
  }

  async createTradeAiInsight(insight: InsertTradeAiInsight): Promise<TradeAiInsight> {
    try {
      const result = await db.insert(insightsTable).values({
        tradeType: insight.tradeType,
        tradeId: insight.tradeId,
        ticker: insight.ticker,
        company: insight.company,
        analysis: insight.analysis,
        keyPoints: insight.keyPoints ?? null,
        confidence: insight.confidence ?? null,
        sources: insight.sources ?? null,
        generatedByModel: insight.generatedByModel ?? null,
        status: insight.status ?? "published",
      }).returning();
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error creating trade AI insight:", error);
      return super.createTradeAiInsight(insight);
    }
  }

  async getTradeAiInsightsByTicker(ticker: string): Promise<TradeAiInsight[]> {
    try {
      const result = await db.select().from(insightsTable)
        .where(ilike(insightsTable.ticker, ticker));
      return result;
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching trade AI insights by ticker:", error);
      return super.getTradeAiInsightsByTicker(ticker);
    }
  }

  // User methods - Database backed
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(usersTable).where(eq(usersTable.id, id));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching user by ID:", error);
      return super.getUser(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching user by email:", error);
      return super.getUserByEmail(email);
    }
  }

  async createUser(userData: { email: string; password: string; firstName?: string | null; lastName?: string | null; disclaimerAcceptedAt?: Date | null }): Promise<User> {
    try {
      const result = await db.insert(usersTable).values({
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        disclaimerAcceptedAt: userData.disclaimerAcceptedAt ?? null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error creating user:", error);
      return super.createUser(userData);
    }
  }

  async updateUserSubscription(userId: string, tier: string, expiresAt?: Date): Promise<User | undefined> {
    try {
      const result = await db.update(usersTable)
        .set({
          subscriptionTier: tier,
          subscriptionExpiresAt: expiresAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userId))
        .returning();
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error updating user subscription:", error);
      return super.updateUserSubscription(userId, tier, expiresAt);
    }
  }

  async updateUserDisclaimerAccepted(id: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const result = await db.update(usersTable)
        .set({
          disclaimerAcceptedAt: now,
          updatedAt: now,
        })
        .where(eq(usersTable.id, id))
        .returning();
      
      if (result[0]) {
        return result[0];
      }
      
      // If update didn't find rows, fetch the user to confirm existence
      const user = await this.getUser(id);
      if (user) {
        // User exists but update failed - try to return current state
        console.warn("[DatabaseStorage] Disclaimer update returned no rows for existing user:", id);
      }
      return user;
    } catch (error) {
      console.error("[DatabaseStorage] Error updating user disclaimer:", error);
      // On error, update in-memory and also try to sync to DB
      const memUser = await super.updateUserDisclaimerAccepted(id);
      if (memUser) {
        // Attempt to persist the in-memory change to DB
        try {
          await db.update(usersTable)
            .set({
              disclaimerAcceptedAt: memUser.disclaimerAcceptedAt,
              updatedAt: memUser.updatedAt,
            })
            .where(eq(usersTable.id, id));
        } catch (syncError) {
          console.error("[DatabaseStorage] Failed to sync disclaimer to DB:", syncError);
        }
      }
      return memUser;
    }
  }

  async search(query: string): Promise<{
    trades: InsiderTrade[];
    congressionalTrades: CongressionalTrade[];
    companies: Company[];
    executives: Executive[];
    institutionalFunds: InstitutionalFund[];
    institutionalTrades: InstitutionalTrade[];
  }> {
    const baseResults = await super.search(query);
    
    try {
      const q = query.toLowerCase();
      
      const institutionalFunds = await db.select().from(fundsTable).where(
        or(
          ilike(fundsTable.name, `%${q}%`),
          ilike(fundsTable.manager, `%${q}%`)
        )
      );
      
      const institutionalTrades = await db.select().from(instTradesTable).where(
        or(
          ilike(instTradesTable.ticker, `%${q}%`),
          ilike(instTradesTable.company, `%${q}%`),
          ilike(instTradesTable.fundName, `%${q}%`)
        )
      );
      
      return {
        ...baseResults,
        institutionalFunds,
        institutionalTrades,
      };
    } catch (error) {
      console.error("[DatabaseStorage] Error in search:", error);
      return baseResults;
    }
  }

  // User Preferences - Database backed
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const result = await db.select().from(userPrefsTable).where(eq(userPrefsTable.userId, userId));
      return result[0];
    } catch (error) {
      console.error("[DatabaseStorage] Error fetching user preferences:", error);
      return super.getUserPreferences(userId);
    }
  }

  async createOrUpdateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    try {
      const existing = await this.getUserPreferences(prefs.userId);
      const now = new Date();
      
      if (existing) {
        const result = await db.update(userPrefsTable)
          .set({
            autoRefresh: prefs.autoRefresh ?? existing.autoRefresh,
            refreshInterval: prefs.refreshInterval ?? existing.refreshInterval,
            showSampleData: prefs.showSampleData ?? existing.showSampleData,
            defaultTradeView: prefs.defaultTradeView ?? existing.defaultTradeView,
            compactMode: prefs.compactMode ?? existing.compactMode,
            updatedAt: now,
          })
          .where(eq(userPrefsTable.id, existing.id))
          .returning();
        return result[0];
      } else {
        const result = await db.insert(userPrefsTable).values({
          userId: prefs.userId,
          autoRefresh: prefs.autoRefresh ?? true,
          refreshInterval: prefs.refreshInterval ?? 5,
          showSampleData: prefs.showSampleData ?? true,
          defaultTradeView: prefs.defaultTradeView ?? "all",
          compactMode: prefs.compactMode ?? false,
        }).returning();
        return result[0];
      }
    } catch (error) {
      console.error("[DatabaseStorage] Error creating/updating user preferences:", error);
      return super.createOrUpdateUserPreferences(prefs);
    }
  }
}

export const storage = new DatabaseStorage();
