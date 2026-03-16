import type { NextConfig } from "next";
import { execSync } from "child_process";

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || basePath || "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: basePath,
  assetPrefix: assetPrefix,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  env: {
    NEXT_PUBLIC_COMMIT_HASH: getCommitHash(),
  },
};

export default nextConfig;
