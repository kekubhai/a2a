/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@a2a/db', '@a2a/redis', '@a2a/sdk', '@a2a/shared-types'],
  eslint: {
    // Lint is run separately in CI; don't block builds.
    ignoreDuringBuilds: true,
  },
  env: {
    // Ensure DATABASE_URL is available at build time
    DATABASE_URL: process.env.DATABASE_URL,
  },
  webpack: (config) => {
    // Solana / wallet libs reference optional native deps.
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
