const express = require('express');
const app = express();
const router = express.Router();

// OAuth2 인증 성공 후 리디렉션 처리하는 라우트
router.get('/oauth2/redirect', (req, res) => {
    try {
        // 예시: OAuth2 인증 성공 후
        const loggedIn = true;  // 로그인 성공 여부 (예시로 true 설정)
        const socialType = req.query.provider;  // 로그인한 소셜 타입 (kakao, google, naver 등)

        const host = req.headers.host;

        console.log(host)
        // 호스트 값에 따라 리디렉션 URL 설정
        const redirectUrl = `http://${host}/user-type-selection?loggedIn=${loggedIn}&socialType=${socialType}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("OAuth2 인증 처리 오류", error);
        alert("로그인 에러")
        res.status(500).send("Internal Server Error");
    }
});

app.use('/auth', router);  // '/auth' 경로 하위에 라우트 추가

module.exports = router;
