const express = require('express');
const cors = require('cors');
// const https = require('https');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./routes'); // Import routes
const config = require('../config'); // Import config
require('dotenv').config(); // Load environment variables from .env file

// HTTPS 인증서 (로컬용 self-signed cert 예시)
// const options = {
//     key: fs.readFileSync(path.join(__dirname, '..', 'key.pem')),
//     cert: fs.readFileSync(path.join(__dirname, '..', 'cert.pem'))
// };

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

app.use(express.json());
app.use(cookieParser());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '..', 'public')));

// 라우터 설정
app.use('/', routes);

// 테스트 라우터 (쿠키 읽기용)
app.get('/check-cookie', (req, res) => {
    console.log('Cookies:', req.cookies);
    res.send(req.cookies);
});

app.listen(3000, () => {
    console.log("port 3000 is open!")
})
// ✅ HTTPS 서버 실행
// https.createServer(options, app).listen(3000, () => {
//     console.log('✅ HTTPS Express server running at https://localhost:3000');
// });
