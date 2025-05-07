const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../../config');
const router = express.Router();

// 메인 API 프록시 설정
router.use('/api', createProxyMiddleware({
    ...config.apiProxy,
    changeOrigin: true,
    cookieDomainRewrite: {
        '*': ''
    },
    onProxyReq: (proxyReq, req, res) => {
        // 요청 본문이 있는 경우 처리
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
        res.status(500).send('Proxy Error');
    }
}));

// 추가 프록시 엔드포인트 설정
if (config.serviceProxies) {
    Object.entries(config.serviceProxies).forEach(([name, proxyConfig]) => {
        router.use(proxyConfig.path, createProxyMiddleware({
            ...proxyConfig,
            changeOrigin: true,
            cookieDomainRewrite: {
                '*': '' // 모든 도메인의 쿠키를 현재 도메인으로 재작성
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log(`[${name} Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            }
        }));
    });
}

// 프록시 상태 확인 엔드포인트
router.get('/proxy-status', (req, res) => {
    res.json({
        status: 'active',
        timestamp: new Date().toISOString(),
        proxies: {
            main: config.apiProxy.target,
            ...Object.fromEntries(
                Object.entries(config.serviceProxies || {}).map(
                    ([name, conf]) => [name, conf.target]
                )
            )
        }
    });
});

module.exports = router;