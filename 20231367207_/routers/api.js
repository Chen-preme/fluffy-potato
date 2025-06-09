const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');


router.post('/user/register', async (req, res) => {
    

  //打印日志
    console.log('收到注册请求:', req.body);

    if (!req.body || typeof req.body !== 'object') {
        console.log('请求体错误或不合法:', req.body);
        return res.status(400).json({ code: 99, msg: '请求体错误或不合法' });
    }

    const { username, password, repassword } = req.body;

    if (!username || username.trim() === '') {
        return res.json({ code: 1, msg: '用户名不能为空' });
    }

    if (!password || password.trim() === '') {
        return res.json({ code: 2, msg: '密码不能为空' });
    }

    if (password !== repassword) {
        return res.json({ code: 3, msg: '两次密码不一致' });
    }

    try {
      //数据库验证
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.json({ code: 4, msg: '用户名已存在' });
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);
        
        //保存到数据库
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log('注册成功:', username);
        return res.json({ code: 0, msg: '注册成功' });
    } catch (err) {
        console.error('注册异常:', err);
        // 明确返回响应
        return res.status(500).json({ code: 500, msg: '服务器错误', error: err.message });
    }
});

//登录
router.post('/user/login', async (req, res) => {
    const { username, password } = req.body;
  
    // 基础校验
    if (!username || !password) {
      return res.json({ code: 1, msg: '用户名和密码不能为空' });
    }
  
    try {
      // 查找用户
      const user = await User.findOne({ username });
      if (!user) {
        return res.json({ code: 2, msg: '用户不存在' });
      }
  
      //  密码比对
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.json({ code: 3, msg: '密码错误' });
      }
  
      
      req.session.user = {
        _id: user._id,
        username: user.username
      };
  
      return res.json({ code: 0, msg: '登录成功', user: req.session.user });
    } catch (err) {
      console.error('登录异常:', err);
      return res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  });

  router.get('/user/info', (req, res) => {
    if (req.session.user) {
      res.json({ code: 0, user: req.session.user });
    } else {
      res.json({ code: 1, msg: '未登录' });
    }
  });
  
  router.get('/user/logout', (req, res) => {
    req.session.destroy();
    res.json({ code: 0, msg: '已退出登录' });
  });
  


module.exports = router;
