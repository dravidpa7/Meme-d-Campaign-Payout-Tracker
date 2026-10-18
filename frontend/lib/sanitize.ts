import type { Platform } from './types';

// control chars, zero-width, bidi overrides
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g;

export function cleanText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(UNSAFE_CHARS, '')
    .replace(/[<>]/g, '')      // defence in depth; React already escapes output
    .replace(/\s+/g, ' ')
    .trim();
}

export const PLATFORM_HOSTS: Record<Platform, readonly string[]> = {
  Instagram: ['instagram.com', 'www.instagram.com'],
  YouTube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
};

const TRACKING_PARAMS = /^(utm_|igsh|igshid$|si$|fbclid$)/i;

/** Returns a normalised https post URL, or null if it is not an allowed one. */
export function sanitizePostUrl(raw: string, platform?: Platform): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;          // blocks javascript:, data:, http:
  if (url.username || url.password || url.port) return null; // blocks user:pass@host tricks
  const allowed = platform ? PLATFORM_HOSTS[platform] : Object.values(PLATFORM_HOSTS).flat();
  if (!allowed.includes(url.hostname.toLowerCase())) return null; // exact host match, no endsWith
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

/** For rendering stored URLs in <a href>. Undefined means render as plain text. */
export const safeHref = (raw: string): string | undefined => sanitizePostUrl(raw) ?? undefined;