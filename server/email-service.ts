import { Resend } from 'resend';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string; success: boolean; error?: string }>;
  getName(): string;
}

class ResendProvider implements EmailProvider {
  private client: Resend | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@insidersignal.app';
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  getName(): string {
    return 'Resend';
  }

  async send(message: EmailMessage): Promise<{ id: string; success: boolean; error?: string }> {
    if (!this.client) {
      console.log('[EmailService] Resend not configured, skipping email:', message.subject);
      return { id: 'mock-' + Date.now(), success: true, error: 'Email not configured (dev mode)' };
    }

    try {
      const result = await this.client.emails.send({
        from: this.fromEmail,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (result.error) {
        return { id: '', success: false, error: result.error.message };
      }

      return { id: result.data?.id || '', success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Failed to send email:', errorMessage);
      return { id: '', success: false, error: errorMessage };
    }
  }
}

class MockEmailProvider implements EmailProvider {
  getName(): string {
    return 'Mock';
  }

  async send(message: EmailMessage): Promise<{ id: string; success: boolean; error?: string }> {
    console.log('[MockEmail] Would send email to:', message.to);
    console.log('[MockEmail] Subject:', message.subject);
    return { id: 'mock-' + Date.now(), success: true };
  }
}

class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    if (provider) {
      this.provider = provider;
    } else if (process.env.RESEND_API_KEY) {
      this.provider = new ResendProvider();
    } else {
      this.provider = new MockEmailProvider();
    }
    console.log(`[EmailService] Using provider: ${this.provider.getName()}`);
  }

  async sendIpoAlert(to: string, ipoData: {
    company: string;
    symbol: string;
    ipoDate: string;
    priceRange?: string;
    exchange?: string;
    prospectusUrl?: string;
  }): Promise<{ id: string; success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .highlight { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .btn { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New IPO Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">InsiderSignal Premium</p>
          </div>
          <div class="content">
            <h2>${ipoData.company} (${ipoData.symbol})</h2>
            <div class="highlight">
              <p><strong>IPO Date:</strong> ${ipoData.ipoDate}</p>
              ${ipoData.priceRange ? `<p><strong>Price Range:</strong> ${ipoData.priceRange}</p>` : ''}
              ${ipoData.exchange ? `<p><strong>Exchange:</strong> ${ipoData.exchange}</p>` : ''}
            </div>
            ${ipoData.prospectusUrl ? `<a href="${ipoData.prospectusUrl}" class="btn">View SEC Prospectus</a>` : ''}
            <p style="margin-top: 20px;">This IPO was just filed with the SEC. As a premium subscriber, you're among the first to know.</p>
          </div>
          <div class="footer">
            <p>You're receiving this because you have IPO alerts enabled.</p>
            <p>InsiderSignal - Trading Intelligence</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `New IPO Alert: ${ipoData.company} (${ipoData.symbol})\n\nIPO Date: ${ipoData.ipoDate}\n${ipoData.priceRange ? `Price Range: ${ipoData.priceRange}\n` : ''}${ipoData.exchange ? `Exchange: ${ipoData.exchange}\n` : ''}\n\nThis IPO was just filed with the SEC.`;

    return this.provider.send({
      to,
      subject: `IPO Alert: ${ipoData.company} (${ipoData.symbol}) - Filing Detected`,
      html,
      text,
    });
  }

  async sendPatternAlert(to: string, alertData: {
    headline: string;
    description: string;
    severity: string;
    tickers: string[];
  }): Promise<{ id: string; success: boolean; error?: string }> {
    const severityColor = alertData.severity === 'high' ? '#dc3545' : 
                          alertData.severity === 'medium' ? '#ffc107' : '#28a745';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .severity { display: inline-block; background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; }
          .tickers { background: #e3f2fd; padding: 10px 15px; border-radius: 6px; margin: 15px 0; }
          .ticker { display: inline-block; background: #2196f3; color: white; padding: 2px 8px; border-radius: 4px; margin: 2px; font-size: 14px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Pattern Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">AI-Detected Trading Pattern</p>
          </div>
          <div class="content">
            <span class="severity">${alertData.severity} Severity</span>
            <h2 style="margin-top: 15px;">${alertData.headline}</h2>
            <p>${alertData.description}</p>
            <div class="tickers">
              <strong>Related Tickers:</strong><br/>
              ${alertData.tickers.map(t => `<span class="ticker">${t}</span>`).join(' ')}
            </div>
          </div>
          <div class="footer">
            <p>You're receiving this because you have pattern alerts enabled.</p>
            <p>InsiderSignal - Trading Intelligence</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Pattern Alert: ${alertData.headline}\n\nSeverity: ${alertData.severity}\n${alertData.description}\n\nRelated Tickers: ${alertData.tickers.join(', ')}`;

    return this.provider.send({
      to,
      subject: `[${alertData.severity.toUpperCase()}] ${alertData.headline}`,
      html,
      text,
    });
  }

  async sendDailyDigest(to: string, digestData: {
    newIpos: number;
    newAlerts: number;
    topTrades: { executive: string; company: string; type: string; value: string }[];
  }): Promise<{ id: string; success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .stat { display: inline-block; background: white; padding: 15px 25px; border-radius: 8px; margin: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .stat-number { font-size: 24px; font-weight: bold; color: #2196f3; }
          .stat-label { font-size: 12px; color: #666; }
          .trade-row { background: white; padding: 12px; border-radius: 6px; margin: 8px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Daily Digest</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <div class="stat">
                <div class="stat-number">${digestData.newIpos}</div>
                <div class="stat-label">New IPOs</div>
              </div>
              <div class="stat">
                <div class="stat-number">${digestData.newAlerts}</div>
                <div class="stat-label">New Alerts</div>
              </div>
            </div>
            
            ${digestData.topTrades.length > 0 ? `
              <h3>Notable Trades</h3>
              ${digestData.topTrades.map(trade => `
                <div class="trade-row">
                  <strong>${trade.executive}</strong> - ${trade.company}<br/>
                  <span style="color: ${trade.type === 'buy' ? '#28a745' : '#dc3545'}">${trade.type.toUpperCase()}</span> ${trade.value}
                </div>
              `).join('')}
            ` : ''}
          </div>
          <div class="footer">
            <p>You're receiving this daily digest as a premium subscriber.</p>
            <p>InsiderSignal - Trading Intelligence</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Daily Digest - ${new Date().toLocaleDateString()}\n\nNew IPOs: ${digestData.newIpos}\nNew Alerts: ${digestData.newAlerts}`;

    return this.provider.send({
      to,
      subject: `InsiderSignal Daily Digest - ${new Date().toLocaleDateString()}`,
      html,
      text,
    });
  }

  getProviderName(): string {
    return this.provider.getName();
  }
}

export const emailService = new EmailService();
export { EmailService, ResendProvider, MockEmailProvider };
