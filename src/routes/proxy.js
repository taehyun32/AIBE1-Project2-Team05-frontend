const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../../config');
const router = express.Router();

// 메인 API 프록시 설정
router.use('/api', createProxyMiddleware({
    ...config.apiProxy,
    changeOrigin: true,
    cookieDomainRewrite: {
        '*': '' // 모든 도메인을 현재 호스트로 재작성
    },
    secure: false, // 도커 내부 통신은 HTTP이므로 false
    followRedirects: true,
    pathRewrite: {
        '^/api': '' // '/api' 경로를 제거하고 백엔드로 요청
    },
    onProxyReq: (proxyReq, req, res) => {
        // 요청 본문이 있는 경우 처리
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }

        // 원본 호스트 헤더 추가
        const host = req.headers.host;
        proxyReq.setHeader('X-Forwarded-Host', host);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);

        // 실제 클라이언트 IP 전달
        const realIp = req.headers['x-real-ip'] ||
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress;
        proxyReq.setHeader('X-Real-IP', realIp);

        console.log(`Forwarding request: ${req.method} ${req.url} from ${host}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        // 쿠키 헤더 처리
        if (proxyRes.headers['set-cookie']) {
            const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                // Nginx가 HTTPS로 프록시하므로 SameSite=None과 Secure 속성 추가
                let modifiedCookie = cookie
                    .replace(/SameSite=None/gi, 'SameSite=None')
                    .replace(/Domain=[^;]+/gi, `Domain=${req.headers.host}`);

                // Secure 속성이 없으면 추가
                if (!modifiedCookie.includes('Secure')) {
                    modifiedCookie += '; Secure';
                }
                return modifiedCookie;
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
            cookieDomainRewrite: '',
            secure: true, // HTTPS 환경 지원
            onProxyReq: (proxyReq, req, res) => {
                // 요청 본문이 있는 경우 처리
                if (req.body) {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }

                // 원본 호스트 헤더 추가
                const host = req.headers.host;
                proxyReq.setHeader('X-Forwarded-Host', host);
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);

                console.log(`[${name}] Forwarding request: ${req.method} ${req.url} from ${host}`);
            },
            onProxyRes: (proxyRes, req, res) => {
                // 쿠키 헤더 처리
                if (proxyRes.headers['set-cookie']) {
                    const cookies = proxyRes.headers['set-cookie'].map(cookie => {
                        // SameSite=None 및 Secure 속성을 유지
                        return cookie
                            .replace(/SameSite=None/gi, 'SameSite=None')
                            .replace(/Domain=[^;]+/gi, `Domain=${req.headers.host}`);
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
        host: req.headers.host,
        protocol: req.protocol,
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