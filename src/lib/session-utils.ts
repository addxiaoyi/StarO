/**
 * Session management utilities
 */

import type { Session } from "better-auth/types";

/**
 * Session status for UI display
 */
export type SessionStatus = "active" | "expired" | "expiring_soon" | "invalid";

/**
 * Check if session is about to expire (within 24 hours)
 */
export function isSessionExpiringSoon(session: Session): boolean {
  const expiresAt = new Date(session.expiresAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return expiresAt - now < twentyFourHours;
}

/**
 * Get session status
 */
export function getSessionStatus(session: Session | null): SessionStatus {
  if (!session) {
    return "invalid";
  }

  const expiresAt = new Date(session.expiresAt).getTime();
  const now = Date.now();

  if (expiresAt < now) {
    return "expired";
  }

  if (isSessionExpiringSoon(session)) {
    return "expiring_soon";
  }

  return "active";
}

/**
 * Format session expiry for display
 */
export function formatSessionExpiry(expiresAt: string | Date): string {
  const expiryDate = new Date(expiresAt);
  const now = new Date();

  const diffMs = expiryDate.getTime() - now.getTime();

  if (diffMs < 0) {
    return "已过期";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays} 天后过期`;
  }

  if (diffHours > 0) {
    return `${diffHours} 小时后过期`;
  }

  return "即将过期";
}

/**
 * Get device info from user agent
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  const browserPatterns = [
    { name: "Chrome", pattern: /Chrome\/(\d+)/ },
    { name: "Firefox", pattern: /Firefox\/(\d+)/ },
    { name: "Safari", pattern: /Version\/(\d+).*Safari/ },
    { name: "Edge", pattern: /Edg\/(\d+)/ },
    { name: "Opera", pattern: /OPR\/(\d+)/ },
  ];

  const osPatterns = [
    { name: "Windows", pattern: /Windows NT (\d+\.\d+)/ },
    { name: "macOS", pattern: /Mac OS X (\d+[._]\d+)/ },
    { name: "Linux", pattern: /Linux/ },
    { name: "iOS", pattern: /iPhone.*OS (\d+[._]\d+)/ },
    { name: "Android", pattern: /Android (\d+)/ },
  ];

  let browser = "Unknown Browser";
  let os = "Unknown OS";

  for (const { name, pattern } of browserPatterns) {
    if (pattern.test(userAgent)) {
      const match = userAgent.match(pattern);
      browser = match ? `${name} ${match[1]}` : name;
      break;
    }
  }

  for (const { name, pattern } of osPatterns) {
    if (pattern.test(userAgent)) {
      const match = userAgent.match(pattern);
      os = match ? `${name} ${match[1].replace(/_/g, ".")}` : name;
      break;
    }
  }

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const device = isMobile ? "Mobile" : "Desktop";

  return { browser, os, device };
}
