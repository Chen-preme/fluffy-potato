const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');

const session = require('express-session');

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

  if (!username || !password) {
    return res.json({ code: 1, msg: '用户名和密码不能为空' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.json({ code: 2, msg: '用户名或密码错误' });
    }

    // 设置 session
    req.session.user = {
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin
    };
   

    return res.json({
      code: 0,
      msg: '登录成功',
      userInfo: {
        _id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error('登录异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
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
  req.session.destroy((err) => { // 推荐使用回调函数处理 destroy 结果
    if (err) {
      console.error('Session destroy error:', err);
      return res.json({ code: 1, msg: '退出登录失败' });
    }
    res.json({ code: 0, msg: '已退出登录' });
  });
});

// 修改密码
router.post('/user/change-password', async (req, res) => {
  // 检查用户是否登录
  if (!req.session.user) {
    return res.json({ code: 1, msg: '未登录' });
  }

  const { oldPassword, newPassword, confirmPassword } = req.body;

  // 验证输入
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.json({ code: 2, msg: '所有密码字段都不能为空' });
  }

  if (newPassword !== confirmPassword) {
    return res.json({ code: 3, msg: '新密码与确认密码不一致' });
  }

  try {
    // 获取用户信息
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.json({ code: 4, msg: '用户不存在' });
    }

    // 验证原密码
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.json({ code: 5, msg: '原密码不正确' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    user.password = hashedPassword;
    await user.save();

    return res.json({ code: 0, msg: '密码修改成功' });
  } catch (err) {
    console.error('修改密码异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;