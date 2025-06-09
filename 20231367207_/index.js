const express = require('express');
const path = require('path');
const config = require('./config');
const mongoose = require('mongoose');
const apiRouter = require('./routers/api');
const app = express();

const User = require('./models/user');

app.listen(config.app.PORT,()=>{
    console.log(`Server is running on port ${config.app.PORT}`);
})

app.engine('html',require('ejs').renderFile);
app.set('views', './views');
app.set('view engine', 'html');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));// 解析JSON和URL编码的请求体 在路由器之前使用

//挂载路由器

app.use('/admin',express.static(path.join(__dirname, 'admin')));


app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log('请求体:', req.body);
    }
    next();
});
app.use('/api', apiRouter);
app.use('/main',express.static(path.join(__dirname, 'main')));
app.use('/public', express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render('main/index.html', { title: '欢迎页面' });
  });
   
  app.get('/detail', (req, res) => {
    res.render('main/detail.html', { title: '欢迎页面' });
  });

// 设置静态文件目录 
//连接MOngoDB
mongoose.connect('mongodb://127.0.0.1:27017/mydb')
  .then(() => {
    console.log('MongoDB 已连接');
  })
  .catch(err => {
    console.error(' MongoDB 连接失败:', err);
  });