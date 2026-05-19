import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const localNetworkOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  .filter((entry) => entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry.address);

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: ["localhost", "127.0.0.1", ...localNetworkOrigins],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"], // Common heavy packages
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-bootstrap-key",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
