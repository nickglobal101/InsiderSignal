import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const DEMO_SESSION_KEY = "insider_signal_demo_sessions";
const DEMO_LAST_SESSION_KEY = "insider_signal_demo_last_session";
const MAX_DEMO_SESSIONS = 3;
const SESSION_RESET_HOURS = 24;

interface DemoState {
  isDemo: boolean;
  sessionCount: number;
  shouldPromptRegister: boolean;
  maxSessionsReached: boolean;
}

export function useDemo(): DemoState {
  const { user, isLoading } = useAuth();
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    
    if (user) {
      return;
    }

    const now = Date.now();
    const lastSession = localStorage.getItem(DEMO_LAST_SESSION_KEY);
    const storedCount = localStorage.getItem(DEMO_SESSION_KEY);
    
    let currentCount = storedCount ? parseInt(storedCount, 10) : 0;
    
    if (lastSession) {
      const hoursSinceLastSession = (now - parseInt(lastSession, 10)) / (1000 * 60 * 60);
      if (hoursSinceLastSession >= SESSION_RESET_HOURS) {
        currentCount = 0;
      }
    }
    
    currentCount += 1;
    
    localStorage.setItem(DEMO_SESSION_KEY, currentCount.toString());
    localStorage.setItem(DEMO_LAST_SESSION_KEY, now.toString());
    
    setSessionCount(currentCount);
  }, [user, isLoading]);

  const isDemo = !user && !isLoading;
  const shouldPromptRegister = isDemo && sessionCount >= 2;
  const maxSessionsReached = isDemo && sessionCount > MAX_DEMO_SESSIONS;

  return {
    isDemo,
    sessionCount,
    shouldPromptRegister,
    maxSessionsReached,
  };
}
