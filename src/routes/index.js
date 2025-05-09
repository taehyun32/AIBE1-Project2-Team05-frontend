const express = require('express');
const router = express.Router();

// 각 라우터 모듈 불러오기
const pagesRouter = require('./pages');
const proxyRouter = require('./proxy');
const authRouter = require('./auth');
// 라우터 연결
router.use('/', pagesRouter);  // 페이지 관련 라우트
router.use('/', proxyRouter);  // 프록시 관련 라우트
router.use('/', authRouter);  // 인증 관련 라우트


module.exports = router;