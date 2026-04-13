import { fetchIpoCalendar, fetchIpoProspectus, fetchConfirmedIpos, fetchIpoRumors, type IpoFetchResult } from "./ipo-fetcher";
import { emailService } from "./email-service";
import { storage } from "./storage";
import type { Ipo, User, AlertPreferences, InsertIpo } from "@shared/schema";

const IPO_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const DAILY_DIGEST_HOUR = 8;

let ipoCheckIntervalId: NodeJS.Timeout | null = null;
let dailyDigestIntervalId: NodeJS.Timeout | null = null;

export async function runIpoCheck(): Promise<{ newIpos: number; notifications: number; apiError?: string }> {
  console.log("[Scheduler] Running IPO check...");
  
  try {
    const calendarResult = await fetchIpoCalendar();
    
    if (!calendarResult.success && calendarResult.error) {
      console.warn(`[Scheduler] IPO API issue: ${calendarResult.error.type} - ${calendarResult.error.message}`);
    }

    const [prospectusIpos, confirmedIpos, rumoredIpos] = await Promise.all([
      fetchIpoProspectus(),
      fetchConfirmedIpos(),
      fetchIpoRumors(),
    ]);

    const existingIpos = await storage.getIpos({});
    const existingKeys = new Set(existingIpos.map(ipo => `${ipo.company.toLowerCase()}-${ipo.ipoDate}`));
    
    const allFetchedIpos: InsertIpo[] = [...calendarResult.data, ...prospectusIpos, ...confirmedIpos, ...rumoredIpos];
    const uniqueIpos: Record<string, typeof allFetchedIpos[0]> = {};
    
    for (const ipo of allFetchedIpos) {
      const key = `${ipo.symbol}-${ipo.ipoDate}`;
      if (!uniqueIpos[key]) {
        uniqueIpos[key] = ipo;
      } else {
        const existing = uniqueIpos[key];
        if (ipo.prospectusUrl && !existing.prospectusUrl) {
          uniqueIpos[key] = { ...existing, ...ipo };
        }
        if (ipo.status === 'priced' && existing.status === 'upcoming') {
          uniqueIpos[key] = { ...existing, ...ipo, status: 'priced' };
        }
      }
    }

    const newIpos: Ipo[] = [];
    
    for (const key of Object.keys(uniqueIpos)) {
      const ipoData = uniqueIpos[key];
      const companyKey = `${ipoData.company.toLowerCase()}-${ipoData.ipoDate}`;
      if (!existingKeys.has(companyKey)) {
        const created = await storage.createIpo(ipoData);
        newIpos.push(created);
      } else {
        const existing = existingIpos.find(e => `${e.company.toLowerCase()}-${e.ipoDate}` === companyKey);
        if (existing && ipoData.status !== existing.status) {
          await storage.updateIpo(existing.id, { status: ipoData.status, offeringPrice: ipoData.offeringPrice });
        }
      }
    }

    let notificationCount = 0;

    if (newIpos.length > 0) {
      const premiumUsers = await storage.getPremiumUsersWithIpoAlerts();
      
      for (const user of premiumUsers) {
        for (const ipo of newIpos) {
          try {
            const priceRange = ipo.priceRangeLow && ipo.priceRangeHigh 
              ? `$${ipo.priceRangeLow} - $${ipo.priceRangeHigh}` 
              : undefined;

            const result = await emailService.sendIpoAlert(user.email, {
              company: ipo.company,
              symbol: ipo.symbol,
              ipoDate: ipo.ipoDate,
              priceRange,
              exchange: ipo.exchange || undefined,
              prospectusUrl: ipo.prospectusUrl || undefined,
            });

            if (result.success) {
              await storage.createEmailNotification({
                userId: user.id,
                type: 'ipo_alert',
                subject: `IPO Alert: ${ipo.company} (${ipo.symbol})`,
                contentPreview: `New IPO filing detected for ${ipo.company}`,
                status: 'sent',
                resendId: result.id,
              });
              notificationCount++;
            }
          } catch (error) {
            console.error(`[Scheduler] Failed to send IPO alert to ${user.email}:`, error);
          }
        }
      }

      for (const ipo of newIpos) {
        await storage.updateIpo(ipo.id, { notifiedAt: new Date() });
      }
    }

    console.log(`[Scheduler] IPO check complete. New: ${newIpos.length}, Notifications: ${notificationCount}`);
    return { newIpos: newIpos.length, notifications: notificationCount };
  } catch (error) {
    console.error("[Scheduler] IPO check failed:", error);
    return { newIpos: 0, notifications: 0 };
  }
}

export async function runDailyDigest(): Promise<number> {
  console.log("[Scheduler] Running daily digest...");
  
  try {
    const premiumUsers = await storage.getPremiumUsersWithDigestEnabled();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [newIpos, newAlerts, topTrades] = await Promise.all([
      storage.getIpos({ dateFrom: yesterdayStr }),
      storage.getAlerts({ limit: 10 }),
      storage.getInsiderTrades({ dateFrom: yesterdayStr, limit: 5 }),
    ]);

    let digestCount = 0;

    for (const user of premiumUsers) {
      try {
        const result = await emailService.sendDailyDigest(user.email, {
          newIpos: newIpos.length,
          newAlerts: newAlerts.length,
          topTrades: topTrades.map(t => ({
            executive: t.executive,
            company: t.company,
            type: t.type,
            value: `$${(t.value / 1000000).toFixed(2)}M`,
          })),
        });

        if (result.success) {
          await storage.createEmailNotification({
            userId: user.id,
            type: 'digest',
            subject: `InsiderSignal Daily Digest`,
            contentPreview: `${newIpos.length} new IPOs, ${newAlerts.length} alerts`,
            status: 'sent',
            resendId: result.id,
          });
          digestCount++;
        }
      } catch (error) {
        console.error(`[Scheduler] Failed to send digest to ${user.email}:`, error);
      }
    }

    console.log(`[Scheduler] Daily digest complete. Sent to ${digestCount} users`);
    return digestCount;
  } catch (error) {
    console.error("[Scheduler] Daily digest failed:", error);
    return 0;
  }
}

export function startScheduler(): void {
  console.log("[Scheduler] Starting scheduled jobs...");
  
  setTimeout(() => {
    runIpoCheck().catch(console.error);
  }, 5000);

  ipoCheckIntervalId = setInterval(() => {
    runIpoCheck().catch(console.error);
  }, IPO_CHECK_INTERVAL_MS);

  const now = new Date();
  const nextDigestTime = new Date();
  nextDigestTime.setHours(DAILY_DIGEST_HOUR, 0, 0, 0);
  if (nextDigestTime <= now) {
    nextDigestTime.setDate(nextDigestTime.getDate() + 1);
  }
  
  const msUntilDigest = nextDigestTime.getTime() - now.getTime();
  
  setTimeout(() => {
    runDailyDigest().catch(console.error);
    
    dailyDigestIntervalId = setInterval(() => {
      runDailyDigest().catch(console.error);
    }, 24 * 60 * 60 * 1000);
  }, msUntilDigest);

  console.log(`[Scheduler] IPO check every ${IPO_CHECK_INTERVAL_MS / 1000 / 60 / 60} hours`);
  console.log(`[Scheduler] Next daily digest in ${Math.round(msUntilDigest / 1000 / 60)} minutes`);
}

export function stopScheduler(): void {
  if (ipoCheckIntervalId) {
    clearInterval(ipoCheckIntervalId);
    ipoCheckIntervalId = null;
  }
  if (dailyDigestIntervalId) {
    clearInterval(dailyDigestIntervalId);
    dailyDigestIntervalId = null;
  }
  console.log("[Scheduler] Stopped all scheduled jobs");
}

export async function triggerManualIpoCheck(): Promise<{ newIpos: number; notifications: number }> {
  return runIpoCheck();
}
