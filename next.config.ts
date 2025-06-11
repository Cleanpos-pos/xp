
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'posso.uk',
        port: '',
        pathname: '/**', // Allows any image path from posso.uk
      },
    ],
  },
};

export default nextConfig;
