import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    exclude: [/app-build-manifest\.json$/, /\/reels/],
  },
});

const nextConfig: NextConfig = {
  // Tell Next.js 16 we are intentionally using webpack (required by next-pwa)
  turbopack: {},
};

export default withPWA(nextConfig);
