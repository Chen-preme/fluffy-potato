const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Article = require('../models/article');
const path = require('path');


// 首页
router.get('/', async (req, res) => {
  try {
    // 获取当前页码
    let page = Number(req.query.page || 1);
    let limit = 10; // 每页显示10篇文章
    let skip = (page - 1) * limit;
    
    // 查询条件：公开的文章
    let where = { isPublic: true };
    
    // 获取文章总数
    let count = await Article.countDocuments(where);
    
    // 计算总页数
    let pages = Math.ceil(count / limit);
    page = Math.min(page, pages); // 页码不能超过总页数
    page = Math.max(page, 1); // 页码不能小于1
    
    // 获取文章列表，按置顶和创建时间排序
    let articles = await Article.find(where)
      .sort({isTop: -1, createTime: -1})
      .limit(limit)
      .skip(skip)
      .populate(['category', 'author']); // 关联分类和作者信息
    
    // 获取分类列表
    let categories = await Category.find();
    
    res.render('main/index', {
      title: '首页',
      userInfo: req.userInfo,
      articles: articles,
      count: count,
      pages: pages,
      page: page,
      categories: categories
    });
  } catch (err) {
    console.error('首页渲染失败:', err);
    res.render('main/index', {
      title: '首页',
      userInfo: req.userInfo,
      articles: [],
      count: 0,
      pages: 1,
      page: 1,
      categories: []
    });
  }
});

router.get('/detail', async (req, res) => {
    try {
        let id = req.query.id || '';
        console.log('详情页请求 - 文章ID:', id); // 添加调试日志
        
        let data = {
            userInfo: req.userInfo,
            categories: [],
            article: null
        };

        // 获取分类列表
        try {
            let categories = await Category.find();
            data.categories = categories;
            console.log('获取分类列表成功，数量:', categories.length); // 添加调试日志
        } catch (err) {
            console.error('获取分类列表失败:', err);
            // 不影响页面渲染，继续执行
        }

        // 获取文章详情
        if (id) {
            try {
                // 使用mongoose.Types.ObjectId确保ID格式正确
                const mongoose = require('mongoose');
                let article;
                try {
                    const objectId = new mongoose.Types.ObjectId(id);
                    console.log('转换后的ObjectId:', objectId); // 添加调试日志
                    
                    article = await Article.findOne({
                        _id: objectId
                    });
                    
                    // 如果找到文章，再尝试populate
                    if (article) {
                        try {
                            await article.populate(['category', 'author']);
                        } catch (populateErr) {
                            console.warn('Populate失败，可能是数据格式问题:', populateErr.message);
                            // 即使populate失败，也继续使用文章数据
                        }
                    }
                    
                    console.log('查询结果:', article ? '找到文章' : '未找到文章'); // 添加调试日志
                } catch (idErr) {
                    console.error('无效的文章ID格式:', id, idErr);
                    // ID格式无效，不抛出错误，继续渲染页面
                }
                
                if (article) {
                    // 阅读数增加，但跳过验证以避免author字段格式问题
                    try {
                        article.views = (article.views || 0) + 1;
                        await article.save({ validateBeforeSave: false });
                    } catch (saveErr) {
                        console.warn('保存阅读数失败:', saveErr.message);
                        // 即使保存失败，也继续使用文章数据
                    }
                    data.article = article;
                    console.log('文章详情设置成功，标题:', article.title); // 添加调试日志
                } else {
                    console.log('文章不存在或已被删除'); // 添加调试日志
                }
            } catch (err) {
                console.error('获取文章详情失败:', err);
                // 不抛出错误，继续渲染页面
            }
        } else {
            console.log('未提供文章ID'); // 添加调试日志
        }

        console.log('渲染详情页，article存在:', !!data.article); // 添加调试日志
        res.render('main/detail.html', data);
    } catch (e) {
        console.error('渲染详情页失败:', e);
        // 即使出错也尝试渲染页面
        res.render('main/detail.html', {
            userInfo: req.userInfo,
            categories: [],
            article: null
        });
    }
});



// 收藏页面
router.get('/favorites', async (req, res) => {
    try {
        // 获取分类列表
        let categories = await Category.find();
        
        res.render('main/favorites', {
            title: '我的收藏',
            userInfo: req.userInfo,
            categories: categories
        });
    } catch (err) {
        console.error('收藏页面渲染失败:', err);
        res.render('main/favorites', {
            title: '我的收藏',
            userInfo: req.userInfo,
            categories: []
        });
    }
});

// 邮件发送页面
router.get('/email', async (req, res) => {
    try {
        // 获取分类列表
        let categories = await Category.find();
        
        res.render('main/email', {
            title: '发送邮件',
            userInfo: req.userInfo,
            categories: categories
        });
    } catch (err) {
        console.error('邮件页面渲染失败:', err);
        res.render('main/email', {
            title: '发送邮件',
            userInfo: req.userInfo,
            categories: []
        });
    }
});

// 图片处理页面
router.get('/image-processing', async (req, res) => {
    try {
        // 获取分类列表
        let categories = await Category.find();
        
        res.render('main/image-processing', {
            title: '图片处理',
            userInfo: req.userInfo,
            categories: categories
        });
    } catch (err) {
        console.error('图片处理页面渲染失败:', err);
        res.sendFile(path.join(__dirname, '../public', 'image-processing.html'));
    }
});

module.exports = router;


