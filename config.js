// config.js
// This is an example of how you might structure your proxy configuration

module.exports = {
    // Main API proxy settings
    apiProxy: {
        target: 'https://dev-linkup.duckdns.org/',
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/v1', // Rewrite /api to /v1 on the target server
        },
        secure: false, // Set to true if you need HTTPS validation
        // Add auth headers if needed
        headers: {
            // 'Authorization': 'Bearer YOUR_TOKEN',
        }
    },

    // Additional proxy endpoints can be defined here
    serviceProxies: {
        auth: {
            path: '/auth',
            target: 'https://dev-linkup.duckdns.org/',
            changeOrigin: true,
            pathRewrite: {
                '^/auth': '',
            }
        },
        uploads: {
            path: '/uploads',
            target: 'https://dev-linkup.duckdns.org/',
            changeOrigin: true,
            pathRewrite: {
                '^/uploads': '/files',
            }
        }
        // Add more proxy endpoints as needed
    }
};