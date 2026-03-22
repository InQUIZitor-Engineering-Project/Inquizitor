import type { NextConfig } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.inquizitor.pl";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["@inquizitor/ui"],
  async redirects() {
    return [
      { source: "/login", destination: `${APP_URL}/login`, permanent: false },
      { source: "/register", destination: `${APP_URL}/register`, permanent: false },
      { source: "/forgot-password", destination: `${APP_URL}/forgot-password`, permanent: false },
      { source: "/reset-password", destination: `${APP_URL}/reset-password`, permanent: false },
      { source: "/verify-email", destination: `${APP_URL}/verify-email`, permanent: false },
    ];
  },
};

export default nextConfig;
