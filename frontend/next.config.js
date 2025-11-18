/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comentado para habilitar SSR y rutas dinámicas
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;


