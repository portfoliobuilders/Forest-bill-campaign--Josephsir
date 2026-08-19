import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not add /Admin → /admin here. On Windows the matcher is case-insensitive
  // and would 308-loop `/admin` to itself. Middleware canonicalizes casing.
};

export default nextConfig;
