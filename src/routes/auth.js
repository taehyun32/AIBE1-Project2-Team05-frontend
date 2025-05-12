const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

router.get('/status', (req, res) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ status: 200 });      
});

router.get('/oauth2/authorization/:provider', (req, res) => {
    const provider = req.params.provider;
    const redirectUri = `http://backend.linkup.o-r.kr/oauth2/authorization/${provider}`;
    res.redirect(redirectUri);
});



module.exports = router;