import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le vecchie pagine sono confluite in /movements: i link e i preferiti esistenti
  // portano li', con il filtro corrispondente (lib/movements.ts legge `types`).
  async redirects() {
    return [
      { source: "/incomes", destination: "/movements?types=I", permanent: false },
      { source: "/expenses", destination: "/movements?types=E", permanent: false },
      { source: "/transfers", destination: "/movements?types=T", permanent: false },
      { source: "/wallets", destination: "/movements", permanent: false },
    ];
  },
};

export default nextConfig;
