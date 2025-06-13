const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
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

//用户管理
router.get('/users', async (req, res) => { 
    try {
        // 获取当前页码，默认为第1页
        const currentPage = parseInt(req.query.page) || 1;
        // 每页显示的用户数量
        const pageSize = 10;
        // 计算跳过的文档数量
        const skip = (currentPage - 1) * pageSize;

        // 获取用户总数
        const totalUsers = await User.countDocuments({});
        // 计算总页数
        const totalPages = Math.ceil(totalUsers / pageSize);

        // 从数据库中查询用户，添加分页
        const users = await User.find({})
            .sort({ _id: -1 })
            .skip(skip)
            .limit(pageSize);

        res.render('admin/user_index.html', {
            title: '用户管理',       
            userInfo: req.userInfo, 
            users: users,           
            currentPage: currentPage, 
            totalPages: totalPages,   
            pageSize: pageSize,       
            totalUsers: totalUsers    // 添加这一行
        });

    } catch (err) {
        // 错误处理
        console.error('获取用户列表失败:', err);
        res.status(500).send('服务器错误，无法获取用户列表。');
    }
});



// 重置用户密码
router.post('/user/reset-password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        
        if (!userId || !newPassword) {
            return res.status(400).json({ success: false, message: '用户ID和新密码不能为空' });
        }
        
        // 对新密码进行加密
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // 更新用户密码
        const updatedUser = await User.findByIdAndUpdate(userId, {
            password: hashedPassword
        }, { new: true });
        
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        res.json({ success: true, message: '密码重置成功' });
    } catch (err) {
        console.error('重置密码失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，重置密码失败' });
    }
}); 

// 冻结/解冻用户账号
router.post('/user/toggle-freeze', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: '用户ID不能为空' });
        }
        
        // 获取用户当前状态
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        // 切换冻结状态
        const updatedUser = await User.findByIdAndUpdate(userId, {
            isFrozen: !user.isFrozen
        }, { new: true });
        
        const statusMessage = updatedUser.isFrozen ? '用户已冻结' : '用户已解冻';
        
        res.json({ 
            success: true, 
            message: statusMessage,
            isFrozen: updatedUser.isFrozen
        });
    } catch (err) {
        console.error('切换用户状态失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，操作失败' });
    }
});

module.exports = router;

