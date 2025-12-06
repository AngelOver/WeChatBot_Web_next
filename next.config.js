/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // 禁用 HTML 页面缓存，确保版本更新后用户能获取最新页面
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
        // 只对 HTML 页面生效，不影响静态资源
        has: [
          { type: 'header', key: 'accept', value: '(.*text/html.*)' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
