import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite probar OAuth de Meta (WhatsApp/Instagram) vía túnel ngrok en dev —
  // Meta exige un origin https, así que se accede al dev server por ese dominio.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],
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
