/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb' // Set desired value here
        }
    }
};

export default nextConfig;
