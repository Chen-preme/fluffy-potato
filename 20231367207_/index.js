const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');
const apiRouter = require('./routers/api');
const mainRouter = require('./routers/main');
const adminRouter = require('./routers/admin');
const User = require('./models/user');
const Cookies = require('cookies');
const session = require('express-session');

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

app.use((req, res, next) => {
  // 从 req.session 中获取用户信息，而不是手动解析 cookie
  if (req.session && req.session.user) {
    req.userInfo = req.session.user; 
  } else {
    req.userInfo = null; 
  }
  next(); // 务必调用 next() 传递控制权
});

// 静态目录
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/main', express.static(path.join(__dirname, 'main')));



// 挂载业务路由
app.use('/api', apiRouter);
app.use('/admin', adminRouter); // 将adminRouter放在mainRouter前面
app.use('/', mainRouter);       // 将mainRouter放在最后

// 连接数据库
mongoose.connect('mongodb://127.0.0.1:27017/mydb')
  .then(() => console.log('MongoDB 已连接'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// 启动服务
app.listen(config.app.PORT, () => {
  console.log(`Server running at http://localhost:${config.app.PORT}`);
});
