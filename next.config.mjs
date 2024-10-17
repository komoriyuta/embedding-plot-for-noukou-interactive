/** @type {import('next').NextConfig} */
const nextConfig = {
    assetPrefix: '/noukou-demo',
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb' // Set desired value here
        }
    }
};

export default nextConfig;
