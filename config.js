require('dotenv').config();

const config = {
    // API 프록시 설정
    apiProxy: {
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        pathRewrite: {
            '^/api': '' // '/api' 경로를 제거하고 백엔드로 요청
        }
    },

    // CORS 설정
    cors: {
        allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:8080',
            'https://eastern-rowena-jack6767-df59f302.koyeb.app',
            'https://dev-linkup.duckdns.org'
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

    // OAuth 설정
    oauth: {
        redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/oauth2/callback'
    }
};

module.exports = config;