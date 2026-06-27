import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  typescript: {
    // 跳过生产构建的类型检查以加速部署
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
