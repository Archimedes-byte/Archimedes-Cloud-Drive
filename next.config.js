/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        async_hooks: false,
        crypto: false,
        stream: false,
        util: false,
        child_process: false,
        net: false,
        tls: false,
        os: false
      };
    }
    return config;
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  }
};

module.exports = nextConfig; 