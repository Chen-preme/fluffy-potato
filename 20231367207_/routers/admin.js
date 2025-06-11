const express = require('express');
const router = express.Router();

// 管理员权限检查中间件
router.use(function(req, res, next) {
    if (!req.userInfo || !req.userInfo.isAdmin) { // 增加对 req.userInfo 存在的检查
        return res.send('对不起，只有管理员才能登陆'); // 使用 return 避免继续执行
    }
    next();
});

// 后台管理首页路由
router.get('/', (req, res) => { 
    res.render('admin/index', {
        userInfo: req.userInfo
    }); 
});

module.exports = router;

