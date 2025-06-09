const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('main/index', {
        title: '首页',
        user: req.session.user,
        isLogin: req.session.isLogin
    });
});


router.get('/detail', (req, res) => {
    res.render('main/detail', {
        title: '详情页',
        user: req.session.user,
        isLogin: req.session.isLogin
    });
});

module.exports = router;