import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  devIndicators: false,
  serverExternalPackages: ["@supabase/supabase-js"],
};
export default config;
