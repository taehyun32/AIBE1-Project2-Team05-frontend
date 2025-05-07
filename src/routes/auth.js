const express = require('express');
const router = express.Router();

// OAuth2 인증 경로 처리
router.get('/oauth2/authorization/:provider', (req, res) => {
    try {
        const provider = req.params.provider;
        let authUrl = '';

        // 각 소셜 로그인 제공자별 백엔드 OAuth 경로 설정
        if (provider === 'kakao') {
            authUrl = process.env.API_URL + '/oauth2/authorization/kakao';
        } else if (provider === 'naver') {
            authUrl = process.env.API_URL + '/oauth2/authorization/naver';
        } else if (provider === 'google') {
            authUrl = process.env.API_URL + '/oauth2/authorization/google';
        } else {
            return res.status(400).send('지원하지 않는 인증 제공자입니다.');
        }

        console.log(`OAuth2 인증 리다이렉트: ${authUrl}`);
        res.redirect(authUrl);
    } catch (error) {
        console.error("OAuth2 인증 요청 처리 오류", error);
        res.status(500).send("Internal Server Error");
    }
});

// OAuth2 인증 성공 후 리디렉션 처리하는 라우트
router.get('/oauth2/callback', (req, res) => {
    try {
        // 로그인 성공 여부와 소셜 타입 파라미터 가져오기
        const loggedIn = req.query.loggedIn || true;
        const socialType = req.query.socialType;

        if (!socialType) {
            return res.status(400).send("소셜 로그인 타입이 필요합니다.");
        }

        // 사용자 유형 선택 페이지로 리다이렉션
        const redirectUrl = `/user-type-selection?loggedIn=${loggedIn}&socialType=${socialType}`;
        console.log(`OAuth2 인증 성공 리다이렉트: ${redirectUrl}`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("OAuth2 인증 콜백 처리 오류", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;