const express = require('express');
const cors = require('cors');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const routes = require('./routes'); // Import routes
const oauthRouter = require('./routes/oauth'); // Import OAuth routes
const config = require('../config'); // Import config
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// ✅ CORS 설정
const corsOptions = {
    origin: function (origin, callback) {
        // origin이 없는 경우 (같은 출처 요청) 허용
        if (!origin || config.cors.allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.allowCredentials,
    exposedHeaders: config.cors.exposedHeaders
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
app.use('/api/oauth2', oauthRouter); // OAuth 라우트 등록

// 테스트 라우터 (쿠키 읽기용)
app.get('/check-csrf', (req, res) => {
    console.log('Cookies:', req.cookies);
    res.send(req.cookies);
});

app.listen(3000, () => {
    console.log("port 3000 is open!")
})
