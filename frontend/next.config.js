/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['localhost', '*.s3.amazonaws.com', '*.s3.*.amazonaws.com'],
  },
}

module.exports = nextConfig


