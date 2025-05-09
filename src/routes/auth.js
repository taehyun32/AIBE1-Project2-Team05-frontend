const express = require('express');
const router = express.Router();


router.get('/status', (req, res) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ status: 200 });      
});

module.exports = router;