const express = require('express');
const router = express.Router();

// 각 라우터 모듈 불러오기
const pagesRouter = require('./pages');
const proxyRouter = require('./proxy');
const authRouter = require('./auth');  // 추가: auth 라우터 불러오기

// 라우터 연결
router.use('/', pagesRouter);  // 페이지 관련 라우트
router.use('/', proxyRouter);  // 프록시 관련 라우트
router.use('/auth', authRouter);  // 추가: 인증 관련 라우트

module.exports = router;