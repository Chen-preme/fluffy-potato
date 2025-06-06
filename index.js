const express = require('express');
const path = require('path');
const config = require('./config');
const mongoose = require('mongoose');

const app = express();

app.listen(config.app.PORT,()=>{
    console.log(`Server is running on port ${config.app.PORT}`);
})

app.engine('html',require('ejs').renderFile);

app.set('views', './views');
app.set('view engine', 'html');

//挂载路由器
app.use('/admin',express.static(path.join(__dirname, 'admin')));
app.use('/api', express.static(path.join(__dirname, 'api')));
app.use('/main',express.static(path.join(__dirname, 'main')));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('main/index.html', { title: '欢迎页面' });
  });
   
  