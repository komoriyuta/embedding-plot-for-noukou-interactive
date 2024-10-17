/** @type {import('next').NextConfig} */
const nextConfig = {
    assetPrefix: '/noukou-demo/',
    output: 'standalone',
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb' // Set desired value here
        }
    }
};

export default nextConfig;
