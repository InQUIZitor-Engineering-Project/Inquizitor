import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
  // Transpile shared workspace packages
  transpilePackages: ["@inquizitor/ui"],
};

export default nextConfig;
