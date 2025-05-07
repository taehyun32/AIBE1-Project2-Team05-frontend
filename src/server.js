const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../config');

// 라우터 불러오기
const routes = require('./routes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(logger);

// 라우터 설정
app.use('/', routes);

// 오류 처리 미들웨어는 항상 마지막에 추가
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Proxying requests from /api/* to ${config.apiProxy.target}`);

    if (config.serviceProxies) {
        Object.entries(config.serviceProxies).forEach(([name, proxyConfig]) => {
            console.log(`Registered proxy for ${proxyConfig.path} -> ${proxyConfig.target}`);
        });
    }
});