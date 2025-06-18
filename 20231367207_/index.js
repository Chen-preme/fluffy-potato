const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');
const apiRouter = require('./routers/api');
const mainRouter = require('./routers/main');
const adminRouter = require('./routers/admin');
const User = require('./models/user');
const Comment = require('./models/comment'); // 添加Comment模型引入
const Cookies = require('cookies');
const session = require('express-session');
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

// 设置视图引擎
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html');

// 中间件`
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(Cookies.express());

//  必须在路由前设置 userInfo
app.use(session({
  secret: config.app.sessionSecret || 'your_secret_key_here', 
  resave: false, // 每次请求结束后，即使 session 没有修改，也重新保存 session 到存储
  saveUninitialized: false, // 强制将未初始化的 session 保存到存储
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 设置 session 的有效期为 24 小时
    httpOnly: true, // 防止客户端 JavaScript 访问 cookie，增强安全性
    secure: process.env.NODE_ENV === 'production' // 生产环境（HTTPS）设置为 true
  }
}));

app.use(async (req, res, next) => {
  // 从 req.session 中获取用户信息，而不是手动解析 cookie
  if (req.session && req.session.user) {
    try {
      // 验证用户是否仍然存在且未被冻结
      const User = require('./models/user');
      const user = await User.findById(req.session.user._id);
      
      if (!user || user.isFrozen) {
        // 用户不存在或被冻结，清除session
        req.session.destroy();
        req.userInfo = null;
      } else {
        req.userInfo = req.session.user;
      }
    } catch (err) {
      console.error('验证用户状态失败:', err);
      req.userInfo = null;
    }
  } else {
    req.userInfo = null; 
  }
  next(); // 务必调用 next() 传递控制权
});

// 静态目录
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/main', express.static(path.join(__dirname, 'main')));

// 邮件页面
app.get('/email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'email.html'));
});

// 图片处理页面
app.get('/image-processing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'image-processing.html'));
});

// 挂载业务路由
app.use('/api', apiRouter);
app.use('/admin', adminRouter); // 将adminRouter放在mainRouter前面
app.use('/', mainRouter);       // 将mainRouter放在最后

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);

  // 加入特定文章的房间
  socket.on('join_article', (articleId) => {
    socket.join(articleId);
    console.log(`用户 ${socket.id} 加入了文章 ${articleId} 的房间`);
  });

  // 处理新评论
  socket.on('new_comment', async (data) => {
    try {
      const { articleId, userId, username, content, images } = data;
      
      // 创建新评论并保存到数据库
      const newComment = new Comment({
        articleId,
        userId,
        username,
        content,
        images: images || [],
        createTime: new Date()
      });
      
      await newComment.save();
      
      // 获取该文章的评论总数
      const commentCount = await Comment.countDocuments({ articleId });
      
      // 广播新评论到该文章的所有连接用户
      io.to(articleId).emit('comment_added', {
        comment: {
          _id: newComment._id,
          username: newComment.username,
          content: newComment.content,
          images: newComment.images,
          createTime: newComment.createTime
        },
        commentCount
      });
    } catch (error) {
      console.error('保存评论失败:', error);
      socket.emit('comment_error', { message: '评论保存失败' });
    }
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('用户已断开连接:', socket.id);
  });
});

// 连接数据库
mongoose.connect('mongodb://127.0.0.1:27017/mydb')
  .then(() => console.log('MongoDB 已连接'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 启动服务
server.listen(config.app.PORT, () => {
  console.log(`Server running at http://localhost:${config.app.PORT}`);
});