const express = require('express');
const router = express.Router();


// 首页
router.get('/', (req, res) => {
  res.render('main/index', {
    title: '首页',
    userInfo: req.userInfo 
  });
});

router.get('/detail', (req, res) => {
  res.render('main/detail', {
    title: '详情页',
    userInfo: req.userInfo
  });
});

module.exports = router;


