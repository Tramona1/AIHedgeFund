/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  
  // Minimal webpack config - avoid custom chunk optimization
  webpack: (config, { isServer }) => {
    // Fix for "exports is not defined" error
    if (!isServer) {
      config.output.globalObject = 'globalThis';
    }
    
    // Don't use custom chunk splitting at all - let Next.js handle it
    config.optimization.splitChunks = {
      chunks: 'all',
    };
    
    return config;
  }
};

module.exports = nextConfig; 