import type { NextConfig } from "next";

function getOrigin(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getWebSocketOrigin(origin: string | null) {
  if (!origin) {
    return null;
  }

  try {
    const url = new URL(origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.origin;
  } catch {
    return null;
  }
}

const isProduction = process.env.NODE_ENV === "production";
const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_CONVERTIX_API_URL);
const supabaseOrigin = getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const postHogOrigin = getOrigin(process.env.NEXT_PUBLIC_POSTHOG_HOST);
const supabaseWebSocketOrigin = getWebSocketOrigin(supabaseOrigin);

const connectSources = [
  "'self'",
  apiOrigin,
  supabaseOrigin,
  supabaseWebSocketOrigin,
  postHogOrigin,
  "https://vitals.vercel-insights.com",
  // Presigned uploads are sent directly from the browser to the regional S3 endpoint.
  "https://s3.eu-west-2.amazonaws.com",
  "https://*.s3.eu-west-2.amazonaws.com",
].filter((source): source is string => Boolean(source));

const scriptSources = ["'self'", "'unsafe-inline'"];

if (!isProduction) {
  // Required by the Next.js development runtime. This is never emitted in production.
  scriptSources.push("'unsafe-eval'");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  `connect-src ${connectSources.join(" ")}`,
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
