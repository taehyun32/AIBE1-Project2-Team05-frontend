// config.js
// 프록시 구성 설정 파일

module.exports = {
    // 메인 API 프록시 설정
    apiProxy: {
        target: 'https://dev-linkup.duckdns.org',
        changeOrigin: true,
        pathRewrite: {
            '^/api': '/v1',
        },
        secure: false, // SSL 인증서 검증 건너뛰기 (개발 환경용)
        // 요청 헤더 설정
        headers: {
            // 'Authorization': 'Bearer YOUR_TOKEN', // 필요한 경우 주석 해제
        },
        // 쿠키 설정
        cookieDomainRewrite: {
            '*': '' // 모든 도메인의 쿠키를 현재 호스트로 재작성
        },
        // 쿠키 보안 설정 (secure: false를 통해 http에서도 쿠키 사용 가능)
        // 참고: 실제 프로덕션 환경에서는 secure: true를 권장합니다
    },

    // 서비스별 프록시 설정
    serviceProxies: {
        auth: {
            path: '/auth',
            target: 'https://dev-linkup.duckdns.org',
            changeOrigin: true,
            pathRewrite: {
                '^/auth': '',
            },
            // 쿠키 설정
            cookieDomainRewrite: {
                '*': '' // 모든 도메인의 쿠키를 현재 호스트로 재작성
            },
            // http용 설정 (필요한 경우)
            secure: false,
        },
        uploads: {
            path: '/uploads',
            target: 'https://dev-linkup.duckdns.org',
            changeOrigin: true,
            pathRewrite: {
                '^/uploads': '/files',
            },
            cookieDomainRewrite: {
                '*': '' // 모든 도메인의 쿠키를 현재 호스트로 재작성
            }
        }
        // 추가 프록시 엔드포인트 필요시 여기에 추가
    },

    // CORS 설정
    cors: {
        // 허용할 출처 목록
        allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:8080',
            'https://eastern-rowena-jack6767-df59f302.koyeb.app',
            'https://dev-linkup.duckdns.org',

        ],
        // 허용할 HTTP 메서드
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        // 허용할 헤더
        allowedHeaders: ['Content-Type', 'Authorization'],
        // 인증 정보(쿠키, 인증 헤더 등) 포함 여부
        allowCredentials: true,
        // 브라우저가 액세스할 수 있는 헤더
        exposedHeaders: ['Set-Cookie']
    }
};