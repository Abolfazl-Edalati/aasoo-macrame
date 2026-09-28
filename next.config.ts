import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon — opt it out of Server Components bundling
  // so it loads via Node's require (Next docs: serverExternalPackages).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
