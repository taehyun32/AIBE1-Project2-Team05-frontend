const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../../config');
const router = express.Router();

// 메인 API 프록시 설정
router.use('/api', createProxyMiddleware({
    ...config.apiProxy,
    changeOrigin: true,
    cookieDomainRewrite: '', // 모든 도메인을 현재 호스트로 재작성
    secure: false, // 개발 환경에서는 false로 설정
    onProxyReq: (proxyReq, req, res) => {
        // 요청 본문이 있는 경우 처리
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }

        // 원본 호스트 헤더 추가 (필요한 경우)
        // proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    },
    onProxyRes: (proxyRes, req, res) => {
        // 쿠키 헤더 처리
        if (proxyRes.headers['set-cookie']) {
            const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                // 개발 환경에서는 Secure 속성 제거 (http에서 테스트할 경우)
                // SameSite를 Lax로 변경하여 일반적인 탐색에서 쿠키 전송
                return cookie
                    .replace(/Secure;/gi, '')
                    .replace(/SameSite=None/gi, 'SameSite=Lax');
            });
            proxyRes.headers['set-cookie'] = cookies;
        }

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
            cookieDomainRewrite: '', // 모든 도메인을 현재 호스트로 재작성
            secure: false, // 개발 환경에서는 false로 설정
            onProxyRes: (proxyRes, req, res) => {
                // 쿠키 헤더 처리
                if (proxyRes.headers['set-cookie']) {
                    const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                        // 개발 환경에서는 Secure 속성 제거 (http에서 테스트할 경우)
                        // SameSite를 Lax로 변경하여 일반적인 탐색에서 쿠키 전송
                        return cookie
                            .replace(/Secure;/gi, '')
                            .replace(/SameSite=None/gi, 'SameSite=Lax');
                    });
                    proxyRes.headers['set-cookie'] = cookies;
                }

                console.log(`[${name} Proxy] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            },
            onError: (err, req, res) => {
                console.error(`[${name} Proxy Error]`, err);
                res.status(500).send(`${name} Proxy Error`);
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