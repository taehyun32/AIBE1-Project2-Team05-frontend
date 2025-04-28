const express = require('express');
const path = require('path'); // ★ 경로를 다루기 위한 모듈 추가
const app = express();
const PORT = process.env.PORT || 3000;

// EJS 템플릿 엔진 설정

// 정적 파일 서비스 (public 폴더 안에 있는 것들은 알아서 열어줌)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    // views/index.ejs 파일을 렌더링
});

// 다른 페이지 라우트 설정
app.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'community.html'));
});

app.get('/community-detail', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'community-detail.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

app.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'mypage.html'));
});

app.get('/mypage-mentee', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'mypage-mentee.html'));
});

app.get('/write-review', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'write-review.html'));
});

app.get('/more-details', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'more-details.html'));
});

app.get('/matching-type-selection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'matching-type-selection.html'));
});

app.get('/user-type-selection', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'user-type-selection.html'));
});

app.get('/match', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'match.html'));
});

app.get('/newPost', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'newPost.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
