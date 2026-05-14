import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@tabler/icons-react",
      "lucide-react",
      "motion",
      "@base-ui/react",
      "radix-ui",
    ],
  },
};

export default nextConfig;
