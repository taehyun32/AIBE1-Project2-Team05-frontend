// config.js
// This is an example of how you might structure your proxy configuration

module.exports = {
    // Main API proxy settings
    apiProxy: {
        target: 'https://dev-linkup.duckdns.org',
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/v1',
        },
        secure: false, // Set to true if you need HTTPS validation
        headers: {
            // 'Authorization': 'Bearer YOUR_TOKEN',
        }
    },

    serviceProxies: {
        auth: {
            path: '/auth',
            target: 'https://dev-linkup.duckdns.org',
            changeOrigin: true,
            pathRewrite: {
                '^/auth': '',
            }
        },
        uploads: {
            path: '/uploads',
            target: 'https://dev-linkup.duckdns.org',
            changeOrigin: true,
            pathRewrite: {
                '^/uploads': '/files',
            }
        }
        // Add more proxy endpoints as needed
    }
};