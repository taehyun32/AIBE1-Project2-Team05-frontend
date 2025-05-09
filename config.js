require('dotenv').config();

const config = {
    // API 프록시 설정
    apiProxy: {
        target: process.env.API_URL,
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        pathRewrite: {
            '^/api': '' // '/api' 경로를 제거하고 백엔드로 요청
        },
        logLevel: 'debug',
        onProxyReq: function(proxyReq, req, res) {
            console.log('Proxy Request:', req.method, req.url);
        },
        onError: function(err, req, res) {
            console.error('Proxy Error:', err);
        }
    },

    // CORS 설정
    cors: {
        allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://backend.linkup.o-r.kr/',
            'http://frontend.linkup.o-r.kr/'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Authorization',
            'Content-Type',
            'X-Requested-With',
            'Accept',
            'Origin',
            'X-CSRF-Token'
        ],
        allowCredentials: true,
        exposedHeaders: ['Authorization']
    },

};

module.exports = config;