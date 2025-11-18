/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['localhost', '*.s3.amazonaws.com', '*.s3.*.amazonaws.com'],
  },
}

module.exports = nextConfig


