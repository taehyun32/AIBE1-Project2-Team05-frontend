const express = require('express');
const path = require('path');
const router = express.Router();

// 루트 경로
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// 커뮤니티 페이지
router.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'community.html'));
});

router.get('/community-detail', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'community-detail.html'));
});

// 사용자 관련 페이지
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'login.html'));
});

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'register.html'));
});

// 마이페이지 관련
router.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'mypage.html'));
});

router.get('/mypage-mentee', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'mypage-mentee.html'));
});

router.get('/write-review', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'write-review.html'));
});

// 매칭 관련 페이지
router.get('/more-details', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'more-details.html'));
});

router.get('/matching-type-selection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'matching-type-selection.html'));
});

router.get('/user-type-selection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'user-type-selection.html'));
});

router.get('/match', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'match.html'));
});

// 게시물 관련
router.get('/newPost', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'newPost.html'));
});

module.exports = router;