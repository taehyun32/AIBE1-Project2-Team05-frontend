const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const routes = require('./routes'); // Import routes
const config = require('../config'); // Import config
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// ✅ CORS 설정 - 수정된 보다 관대한 CORS 정책
const corsOptions = {
    origin: function (origin, callback) {
        // 개발 환경에서는 모든 출처 허용 또는 명시된 출처만 허용
        const allowedOrigins = config.cors && config.cors.allowedOrigins
            ? config.cors.allowedOrigins
            : [
                'http://localhost:3000',
                'http://localhost:8080',
                'https://backend.linkup.o-r.kr',
                'https://frontend.linkup.o-r.kr'
            ];
            
        // origin이 없는 경우 (같은 출처 요청) 또는 허용된 출처에서 온 요청 허용
        // 개발환경에서는 모든 출처 허용 옵션도 고려
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn(`CORS 정책 위반 시도: ${origin}`);
            callback(null, true); // 일시적으로 모든 출처 허용 (프로덕션 전에 제한 필요)
        }
    },
    methods: config.cors && config.cors.allowedMethods
        ? config.cors.allowedMethods
        : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: config.cors && config.cors.allowedHeaders
        ? config.cors.allowedHeaders
        : ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
    credentials: true, // 항상 credentials 허용
    exposedHeaders: config.cors && config.cors.exposedHeaders
        ? config.cors.exposedHeaders
        : ['Content-Length', 'X-Foo', 'X-Bar'],
    maxAge: 86400 // 24시간
};
app.use(cors(corsOptions));

// ✅ 프록시 설정
app.use('/api', createProxyMiddleware(config.apiProxy));

app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '..', 'public')));

// 라우터 설정
app.use('/', routes);

// 테스트 라우터 (쿠키 읽기용)
app.get('/check-csrf', (req, res) => {
    console.log('Cookies:', req.cookies);
    res.send(req.cookies);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})