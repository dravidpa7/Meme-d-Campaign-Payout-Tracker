import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const headers = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // CSP only in prod: React dev tooling needs eval.
  ...(isProd
    ? [{
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      }]
    : []),
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: { removeConsole: true }, // strips console.* from production builds
  async headers() {
    return [{ source: '/(.*)', headers }];
  },
};

export default config;