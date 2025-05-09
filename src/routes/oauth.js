const express = require('express');
const router = express.Router();
const http = require('http');

/**
 * OAuth2 인증 요청을 처리하는 라우트
 * @param {string} provider - OAuth 제공자 (kakao, google, naver)
 */
router.get('/authorization/:provider', (req, res) => {
  const provider = req.params.provider;
  const url = process.env.API_URL;
  const backendUrl = url + `/oauth2/authorization/${provider}`;
  
  console.log(`OAuth 요청 처리: ${provider}`);
  
  http.get(backendUrl, (backendRes) => {
    if (backendRes.statusCode === 302 || backendRes.statusCode === 301) {
      console.log(`리다이렉트 URL: ${backendRes.headers.location}`);
      res.redirect(backendRes.headers.location);
    } else {
      console.error('리다이렉트 URL을 받지 못했습니다.');
      res.status(500).send('OAuth 리다이렉트 URL을 받지 못했습니다.');
    }
  }).on('error', (error) => {
    console.error('OAuth 요청 실패:', error);
    res.status(500).send('OAuth 요청 처리 중 오류가 발생했습니다.');
  });
});

module.exports = router; 