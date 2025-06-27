import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || basePath || "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: basePath,
  assetPrefix: assetPrefix,
};

export default nextConfig;
