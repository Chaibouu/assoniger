/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optimisations pour Next.js 15
    experimental: {
        // Amélioration des performances
        optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
        // Amélioration du bundling
        turbo: {
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                },
            },
        },
    },

    // Configuration des images
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "img.clerk.com",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "assets.aceternity.com",
                pathname: "**"
            },
        ],
        // Amélioration des performances d'image
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Amélioration de la compression
    compress: true,

    // Configuration des en-têtes de sécurité
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },

    // Amélioration du tree-shaking
    webpack: (config, { dev, isServer }) => {
        // Optimisations pour la production
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            };
        }

        return config;
    },
};

export default nextConfig;
