/** @type {import('next').NextConfig} */
const nextConfig = {
  // 增加HTTP配置以优化网络请求
  httpAgentOptions: {
    keepAlive: true,
  },
  // 设置大页面请求超时时间
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // NEXT_FETCH_TIMEOUT配置已移除，使用其他方式处理超时
  },
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