const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const Article = require('../models/article');
const Comment = require('../models/comment');
const Favorite = require('../models/favorite');
const { handleCommentImageUpload, handleEmailAttachmentUpload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

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

    // 检查用户是否被冻结
    if (user.isFrozen) {
      return res.json({ code: 3, msg: '账户已被冻结，无法登录' });
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






// 获取文章评论列表
router.get('/comments', async (req, res) => {
  try {
    const { articleId, page = 1, limit = 10 } = req.query;
    
    if (!articleId) {
      return res.json({ code: 1, msg: '缺少文章ID参数' });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // 获取评论总数
    const total = await Comment.countDocuments({ articleId });
    
    // 获取分页评论数据
    const comments = await Comment.find({ articleId })
      .sort({ createTime: -1 }) // 按创建时间倒序排列
      .skip(skip)
      .limit(limitNum)
      .lean(); // 使用lean()提高查询性能
    
    // 计算分页信息
    const pages = Math.ceil(total / limitNum);
    
    return res.json({
      code: 0,
      msg: '获取成功',
      data: {
        comments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (err) {
    console.error('获取评论列表异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取文章评论数量
router.get('/comments/count', async (req, res) => {
  try {
    const { articleIds } = req.query;
    
    if (!articleIds) {
      return res.json({ code: 1, msg: '缺少文章ID参数' });
    }
    
    const articleIdArray = articleIds.split(',');
    const counts = {};
    
    // 批量获取每篇文章的评论数量
    for (const articleId of articleIdArray) {
      const count = await Comment.countDocuments({ articleId });
      counts[articleId] = count;
    }
    
    return res.json({
      code: 0,
      msg: '获取成功',
      data: counts
    });
  } catch (err) {
    console.error('获取评论数量异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 上传评论图片
router.post('/comment/upload-images', handleCommentImageUpload, async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 1, msg: '请先登录' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.json({ code: 2, msg: '请选择要上传的图片' });
    }
    
    const images = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/comments/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    return res.json({
      code: 0,
      msg: '图片上传成功',
      data: images
    });
  } catch (err) {
    console.error('上传评论图片异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 删除评论图片
router.delete('/comment/delete-image', async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 1, msg: '请先登录' });
    }
    
    const { filename } = req.body;
    
    if (!filename) {
      return res.json({ code: 2, msg: '缺少文件名参数' });
    }
    
    const filePath = path.join(__dirname, '../uploads/comments', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return res.json({
      code: 0,
      msg: '图片删除成功'
    });
  } catch (err) {
    console.error('删除评论图片异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 添加收藏
router.post('/favorite/add', async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 1, msg: '请先登录' });
    }
    
    const { articleId } = req.body;
    if (!articleId) {
      return res.json({ code: 2, msg: '缺少文章ID' });
    }
    
    // 检查文章是否存在
    const article = await Article.findById(articleId);
    if (!article) {
      return res.json({ code: 3, msg: '文章不存在' });
    }
    
    // 检查是否已经收藏
    const existingFavorite = await Favorite.findOne({
      userId: req.userInfo._id,
      articleId: articleId
    });
    
    if (existingFavorite) {
      return res.json({ code: 4, msg: '已经收藏过了' });
    }
    
    // 创建收藏记录
    const favorite = new Favorite({
      userId: req.userInfo._id,
      articleId: articleId
    });
    
    await favorite.save();
    
    return res.json({
      code: 0,
      msg: '收藏成功'
    });
  } catch (err) {
    console.error('添加收藏异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 取消收藏
router.post('/favorite/remove', async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 1, msg: '请先登录' });
    }
    
    const { articleId } = req.body;
    if (!articleId) {
      return res.json({ code: 2, msg: '缺少文章ID' });
    }
    
    // 删除收藏记录
    const result = await Favorite.deleteOne({
      userId: req.userInfo._id,
      articleId: articleId
    });
    
    if (result.deletedCount === 0) {
      return res.json({ code: 3, msg: '未找到收藏记录' });
    }
    
    return res.json({
      code: 0,
      msg: '取消收藏成功'
    });
  } catch (err) {
    console.error('取消收藏异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取收藏列表
router.get('/favorites', async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 1, msg: '请先登录' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 获取收藏总数
    const total = await Favorite.countDocuments({ userId: req.userInfo._id });
    const pages = Math.ceil(total / limit);
    
    // 获取收藏列表，关联文章信息
    const favorites = await Favorite.find({ userId: req.userInfo._id })
      .populate({
        path: 'articleId',
        populate: {
          path: 'category author',
          select: 'name username'
        }
      })
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit);
    
    // 过滤掉已删除的文章
    const validFavorites = favorites.filter(fav => fav.articleId);
    
    return res.json({
      code: 0,
      msg: '获取成功',
      data: {
        favorites: validFavorites,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error('获取收藏列表异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 检查文章是否已收藏
router.get('/favorite/check', async (req, res) => {
  try {
    if (!req.userInfo) {
      return res.json({ code: 0, data: { isFavorited: false } });
    }
    
    const { articleId } = req.query;
    if (!articleId) {
      return res.json({ code: 2, msg: '缺少文章ID' });
    }
    
    const favorite = await Favorite.findOne({
      userId: req.userInfo._id,
      articleId: articleId
    });
    
    return res.json({
      code: 0,
      data: { isFavorited: !!favorite }
    });
  } catch (err) {
    console.error('检查收藏状态异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 邮件发送相关接口
const emailService = require('../services/emailService');

// 发送用户间邮件（支持附件）
router.post('/email/send', handleEmailAttachmentUpload, async (req, res) => {
  try {
    // 检查用户是否登录
    if (!req.session.user) {
      return res.json({ code: 1, msg: '请先登录' });
    }

    const { toUsername, subject, content } = req.body;

    // 验证必填字段
    if (!toUsername || !subject || !content) {
      return res.json({ code: 2, msg: '收件人、主题和内容不能为空' });
    }

    // 查找发送者信息
    const fromUser = await User.findById(req.session.user._id);
    if (!fromUser) {
      return res.json({ code: 3, msg: '发送者不存在' });
    }

    // 查找接收者信息
    const toUser = await User.findOne({ username: toUsername });
    if (!toUser) {
      return res.json({ code: 4, msg: '接收者不存在' });
    }

    // 检查接收者是否设置了邮箱
    if (!toUser.email) {
      return res.json({ code: 5, msg: '接收者未设置邮箱地址' });
    }

    // 验证邮箱格式
    if (!emailService.validateEmail(toUser.email)) {
      return res.json({ code: 6, msg: '接收者邮箱格式不正确' });
    }

    // 处理附件
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
    }

    // 发送邮件
    const result = await emailService.sendUserToUserEmail(
      fromUser,
      toUser.email,
      subject,
      content,
      attachments
    );

    if (result.success) {
      return res.json({ 
        code: 0, 
        msg: '邮件发送成功', 
        messageId: result.messageId,
        attachmentCount: attachments.length
      });
    } else {
      return res.json({ code: 7, msg: result.message || '邮件发送失败' });
    }

  } catch (err) {
    console.error('发送邮件异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 获取所有用户列表（用于选择收件人）
router.get('/users/list', async (req, res) => {
  try {
    // 检查用户是否登录
    if (!req.session.user) {
      return res.json({ code: 1, msg: '请先登录' });
    }

    // 获取所有用户（排除当前用户和被冻结的用户）
    const users = await User.find({
      _id: { $ne: req.session.user._id },
      isFrozen: false
    }).select('username email').sort({ username: 1 });

    return res.json({
      code: 0,
      msg: '获取成功',
      data: users.map(user => ({
        username: user.username,
        hasEmail: !!user.email
      }))
    });

  } catch (err) {
    console.error('获取用户列表异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// 更新用户邮箱
router.post('/user/update-email', async (req, res) => {
  try {
    // 检查用户是否登录
    if (!req.session.user) {
      return res.json({ code: 1, msg: '请先登录' });
    }

    const { email } = req.body;

    // 验证邮箱格式
    if (email && !emailService.validateEmail(email)) {
      return res.json({ code: 2, msg: '邮箱格式不正确' });
    }

    // 检查邮箱是否已被其他用户使用
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: req.session.user._id } 
      });
      if (existingUser) {
        return res.json({ code: 3, msg: '该邮箱已被其他用户使用' });
      }
    }

    // 更新用户邮箱
    await User.findByIdAndUpdate(req.session.user._id, { 
      email: email || null 
    });

    return res.json({ code: 0, msg: '邮箱更新成功' });

  } catch (err) {
    console.error('更新邮箱异常:', err);
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

module.exports = router;