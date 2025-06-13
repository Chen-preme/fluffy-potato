const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const Category = require('../models/category');
const Article = require('../models/article');
const Comment = require('../models/comment');
const Friendlink = require('../models/friendlink');
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

// 分类管理路由
router.get('/categories', async (req, res) => {
    try {
        // 获取当前页码，默认为第1页
        const currentPage = parseInt(req.query.page) || 1;
        // 每页显示的分类数量
        const pageSize = 10;
        // 计算跳过的文档数量
        const skip = (currentPage - 1) * pageSize;

        // 获取分类总数
        const totalCategories = await Category.countDocuments({});
        // 计算总页数
        const totalPages = Math.ceil(totalCategories / pageSize);

        // 从数据库中查询分类，按排序字段排序
        const categories = await Category.find({})
            .sort({ order: 1, _id: -1 })
            .skip(skip)
            .limit(pageSize);

        res.render('admin/category_index.html', {
            title: '分类管理',
            userInfo: req.userInfo,
            categories: categories,
            currentPage: currentPage,
            totalPages: totalPages,
            pageSize: pageSize,
            totalCategories: totalCategories
        });

    } catch (err) {
        console.error('获取分类列表失败:', err);
        res.status(500).send('服务器错误，无法获取分类列表。');
    }
});

// 添加分类
router.post('/category/add', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: '分类名称不能为空' });
        }
        
        // 检查分类名称是否已存在
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: '分类名称已存在' });
        }
        
        // 获取最大排序值
        const maxOrderCategory = await Category.findOne().sort({ order: -1 });
        const nextOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
        
        // 创建新分类
        const newCategory = new Category({
            name: name.trim(),
            description: description || '',
            order: nextOrder
        });
        
        await newCategory.save();
        
        res.json({ success: true, message: '分类添加成功' });
    } catch (err) {
        console.error('添加分类失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，添加分类失败' });
    }
});

// 更新分类
router.post('/category/update', async (req, res) => {
    try {
        const { id, name, description } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: '分类ID不能为空' });
        }
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: '分类名称不能为空' });
        }
        
        // 检查分类是否存在
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: '分类不存在' });
        }
        
        // 检查新名称是否与其他分类重复
        const existingCategory = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: '分类名称已存在' });
        }
        
        // 更新分类
        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name: name.trim(),
            description: description || ''
        }, { new: true });
        
        res.json({ success: true, message: '分类更新成功' });
    } catch (err) {
        console.error('更新分类失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，更新分类失败' });
    }
});

// 删除分类
router.post('/category/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: '分类ID不能为空' });
        }
        
        // 检查分类是否存在
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: '分类不存在' });
        }
        
        // 检查是否有文章使用此分类
        const Article = require('../models/article');
        const articlesCount = await Article.countDocuments({ category: id });
        
        if (articlesCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `无法删除，该分类下有${articlesCount}篇文章` 
            });
        }
        
        // 删除分类
        await Category.findByIdAndDelete(id);
        
        // 重新排序其他分类
        const remainingCategories = await Category.find({}).sort({ order: 1 });
        for (let i = 0; i < remainingCategories.length; i++) {
            await Category.findByIdAndUpdate(remainingCategories[i]._id, { order: i });
        }
        
        res.json({ success: true, message: '分类删除成功' });
    } catch (err) {
        console.error('删除分类失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，删除分类失败' });
    }
});

// 改变分类排序
router.post('/category/change-order', async (req, res) => {
    try {
        const { id, direction } = req.body;
        
        if (!id || !direction) {
            return res.status(400).json({ success: false, message: '参数不完整' });
        }
        
        // 获取当前分类
        const currentCategory = await Category.findById(id);
        if (!currentCategory) {
            return res.status(404).json({ success: false, message: '分类不存在' });
        }
        
        // 根据方向查找相邻的分类
        let adjacentCategory;
        if (direction === 'up') {
            // 查找排序值小于当前分类的最大排序值的分类
            adjacentCategory = await Category.findOne({ 
                order: { $lt: currentCategory.order } 
            }).sort({ order: -1 });
        } else if (direction === 'down') {
            // 查找排序值大于当前分类的最小排序值的分类
            adjacentCategory = await Category.findOne({ 
                order: { $gt: currentCategory.order } 
            }).sort({ order: 1 });
        } else {
            return res.status(400).json({ success: false, message: '无效的方向参数' });
        }
        
        // 如果没有相邻分类，则不需要交换
        if (!adjacentCategory) {
            return res.json({ success: true, message: '排序未改变' });
        }
        
        // 交换两个分类的排序值
        const tempOrder = currentCategory.order;
        currentCategory.order = adjacentCategory.order;
        adjacentCategory.order = tempOrder;
        
        await currentCategory.save();
        await adjacentCategory.save();
        
        res.json({ success: true, message: '排序更新成功' });
    } catch (err) {
        console.error('更改排序失败:', err);
        res.status(500).json({ success: false, message: '服务器错误，更改排序失败' });
    }
});

// 文章管理路由
router.get('/articles', async (req, res) => {
    try {
        // 获取当前页码，默认为第1页
        const currentPage = parseInt(req.query.page) || 1;
        // 每页显示的文章数量
        const pageSize = 10;
        // 计算跳过的文档数量
        const skip = (currentPage - 1) * pageSize;

        // 获取文章总数
        const totalArticles = await Article.countDocuments({});
        // 计算总页数
        const totalPages = Math.ceil(totalArticles / pageSize);

        // 从数据库中查询文章，添加分页，并关联分类信息
        const articles = await Article.find({})
            .populate('category')
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(pageSize);

        // 获取所有分类，用于添加和编辑文章时选择
        const categories = await Category.find({}).sort({ order: 1 });

        res.render('admin/article_index.html', {
            title: '文章管理',
            userInfo: req.userInfo,
            articles: articles,
            categories: categories,
            currentPage: currentPage,
            totalPages: totalPages,
            pageSize: pageSize,
            totalArticles: totalArticles
        });

    } catch (err) {
        console.error('获取文章列表失败:', err);
        res.status(500).send('服务器错误，无法获取文章列表。');
    }
});

// 添加文章
router.post('/article/add', async (req, res) => {
    try {
        const { title, categoryId, content, isTop, isPublic } = req.body;
        
        // 验证必填字段
        if (!title || title.trim() === '') {
            return res.json({ code: 1, message: '文章标题不能为空' });
        }
        
        if (!categoryId) {
            return res.json({ code: 1, message: '请选择文章分类' });
        }
        
        if (!content || content.trim() === '') {
            return res.json({ code: 1, message: '文章内容不能为空' });
        }
        
        // 检查分类是否存在
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.json({ code: 1, message: '所选分类不存在' });
        }
        
        // 创建新文章
        const newArticle = new Article({
            title: title.trim(),
            content: content.trim(),
            category: categoryId,
            author: req.userInfo.username, // 使用当前登录用户作为作者
            isTop: isTop === 'true' || isTop === true ? true : false,
            isPublic: isPublic === 'false' || isPublic === false ? false : true
        });
        
        await newArticle.save();
        
        res.json({ code: 0, message: '文章添加成功' });
    } catch (err) {
        console.error('添加文章失败:', err);
        res.json({ code: 1, message: '服务器错误，添加文章失败' });
    }
});

// 获取文章详情
router.get('/article/info', async (req, res) => {
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.json({ code: 1, message: '文章ID不能为空' });
        }
        
        // 查询文章详情
        const article = await Article.findById(id).populate('category');
        
        if (!article) {
            return res.json({ code: 1, message: '文章不存在' });
        }
        
        res.json({ code: 0, message: '获取成功', data: article });
    } catch (err) {
        console.error('获取文章详情失败:', err);
        res.json({ code: 1, message: '服务器错误，获取文章详情失败' });
    }
});

// 更新文章
router.post('/article/update', async (req, res) => {
    try {
        const { id, title, categoryId, content, isTop, isPublic } = req.body;
        
        // 验证必填字段
        if (!id) {
            return res.json({ code: 1, message: '文章ID不能为空' });
        }
        
        if (!title || title.trim() === '') {
            return res.json({ code: 1, message: '文章标题不能为空' });
        }
        
        if (!categoryId) {
            return res.json({ code: 1, message: '请选择文章分类' });
        }
        
        if (!content || content.trim() === '') {
            return res.json({ code: 1, message: '文章内容不能为空' });
        }
        
        // 查找文章
        const article = await Article.findById(id);
        if (!article) {
            return res.json({ code: 1, message: '文章不存在' });
        }
        
        // 检查分类是否存在
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.json({ code: 1, message: '所选分类不存在' });
        }
        
        // 更新文章
        article.title = title.trim();
        article.content = content.trim();
        article.category = categoryId;
        article.isTop = isTop === 'true' || isTop === true ? true : false;
        article.isPublic = isPublic === 'false' || isPublic === false ? false : true;
        
        await article.save();
        
        res.json({ code: 0, message: '文章更新成功' });
    } catch (err) {
        console.error('更新文章失败:', err);
        res.json({ code: 1, message: '服务器错误，更新文章失败' });
    }
});

// 删除文章
router.post('/article/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.json({ code: 1, message: '文章ID不能为空' });
        }
        
        // 检查文章是否存在
        const article = await Article.findById(id);
        if (!article) {
            return res.json({ code: 1, message: '文章不存在' });
        }
        
        // 删除文章
        await Article.findByIdAndDelete(id);
        
        res.json({ code: 0, message: '文章删除成功' });
    } catch (err) {
        console.error('删除文章失败:', err);
        res.json({ code: 1, message: '服务器错误，删除文章失败' });
    }
});

// 切换文章置顶状态
router.post('/article/toggle-top', async (req, res) => {
    try {
        // 获取参数
        const { id, isTop } = req.body;

        // 参数校验
        if (!id) {
            return res.json({ code: 1, message: '文章ID不能为空' });
        }

        // 查找文章
        const article = await Article.findById(id);
        if (!article) {
            return res.json({ code: 1, message: '文章不存在' });
        }

        // 更新置顶状态
        article.isTop = isTop;
        await article.save();

        res.json({ code: 0, message: '更新成功' });
    } catch (err) {
        console.error('切换文章置顶状态失败:', err);
        res.json({ code: 1, message: '服务器错误' });
    }
});

// 切换文章公开状态
router.post('/article/toggle-public', async (req, res) => {
    try {
        // 获取参数
        const { id, isPublic } = req.body;

        // 参数校验
        if (!id) {
            return res.json({ code: 1, message: '文章ID不能为空' });
        }

        // 查找文章
        const article = await Article.findById(id);
        if (!article) {
            return res.json({ code: 1, message: '文章不存在' });
        }

        // 更新公开状态
        article.isPublic = isPublic;
        await article.save();

        res.json({ code: 0, message: '更新成功' });
    } catch (err) {
        console.error('切换文章公开状态失败:', err);
        res.json({ code: 1, message: '服务器错误' });
    }
});





// 评论管理路由
router.get('/comments', async (req, res) => {
    try {
        // 获取当前页码，默认为第1页
        const currentPage = parseInt(req.query.page) || 1;
        // 每页显示的评论数量
        const pageSize = 10;
        // 计算跳过的文档数量
        const skip = (currentPage - 1) * pageSize;

        // 获取评论总数
        const totalComments = await Comment.countDocuments({});
        // 计算总页数
        const totalPages = Math.ceil(totalComments / pageSize);

        // 从数据库中查询评论，添加分页，并关联文章信息
        const comments = await Comment.find({})
            .populate('articleId', 'title')
            .sort({ createTime: -1 })
            .skip(skip)
            .limit(pageSize);

        res.render('admin/comment_index.html', {
            title: '评论管理',
            userInfo: req.userInfo,
            comments: comments,
            currentPage: currentPage,
            totalPages: totalPages,
            pageSize: pageSize,
            totalComments: totalComments
        });

    } catch (err) {
        console.error('获取评论列表失败:', err);
        res.status(500).send('服务器错误，无法获取评论列表。');
    }
});

// 删除评论
router.post('/comment/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        // 验证必填字段
        if (!id) {
            return res.json({ code: 1, message: '评论ID不能为空' });
        }
        
        // 查找评论
        const comment = await Comment.findById(id);
        if (!comment) {
            return res.json({ code: 1, message: '评论不存在' });
        }
        
        // 删除评论
        await Comment.findByIdAndDelete(id);
        
        res.json({ code: 0, message: '评论删除成功' });
    } catch (err) {
        console.error('删除评论失败:', err);
        res.json({ code: 1, message: '服务器错误，删除评论失败' });
    }
});


// 友情链接管理路由

// 获取友情链接列表
router.get('/friendlinks', async (req, res) => {
    try {
        // 获取分页参数
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10;
        const skip = (page - 1) * pageSize;
        
        // 查询友情链接总数
        const totalFriendlinks = await Friendlink.countDocuments();
        
        // 查询当前页的友情链接，按排序字段排序
        const friendlinks = await Friendlink.find()
            .sort({ order: 1 })
            .skip(skip)
            .limit(pageSize);
        
        // 计算总页数
        const totalPages = Math.ceil(totalFriendlinks / pageSize);
        
        // 渲染友情链接管理页面
        res.render('admin/friendlink_index', {
            title: '友情链接管理',
            userInfo: req.userInfo,
            friendlinks: friendlinks,
            currentPage: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalFriendlinks: totalFriendlinks
        });
    } catch (err) {
        console.error('获取友情链接列表失败:', err);
        res.status(500).send('服务器错误，无法获取友情链接列表。');
    }
});

// 添加友情链接
router.post('/friendlink/add', async (req, res) => {
    try {
        const { name, url, description } = req.body;
        
        // 验证必填字段
        if (!name) {
            return res.json({ success: false, message: '友情链接名称不能为空' });
        }
        
        if (!url) {
            return res.json({ success: false, message: 'URL不能为空' });
        }
        
        // 检查名称是否已存在
        const existingFriendlink = await Friendlink.findOne({ name });
        if (existingFriendlink) {
            return res.json({ success: false, message: '该友情链接名称已存在' });
        }
        
        // 获取当前最大排序值
        const maxOrderFriendlink = await Friendlink.findOne().sort({ order: -1 });
        const nextOrder = maxOrderFriendlink ? maxOrderFriendlink.order + 1 : 1;
        
        // 创建新友情链接
        const newFriendlink = new Friendlink({
            name,
            url,
            description,
            order: nextOrder,
            createTime: new Date()
        });
        
        await newFriendlink.save();
        
        res.json({ success: true, message: '友情链接添加成功' });
    } catch (err) {
        console.error('添加友情链接失败:', err);
        res.json({ success: false, message: '服务器错误，添加友情链接失败' });
    }
});

// 更新友情链接
router.post('/friendlink/update', async (req, res) => {
    try {
        const { id, name, url, description } = req.body;
        
        // 验证必填字段
        if (!id) {
            return res.json({ success: false, message: '友情链接ID不能为空' });
        }
        
        if (!name) {
            return res.json({ success: false, message: '友情链接名称不能为空' });
        }
        
        if (!url) {
            return res.json({ success: false, message: 'URL不能为空' });
        }
        
        // 查找友情链接
        const friendlink = await Friendlink.findById(id);
        if (!friendlink) {
            return res.json({ success: false, message: '友情链接不存在' });
        }
        
        // 检查名称是否已被其他友情链接使用
        const existingFriendlink = await Friendlink.findOne({ name, _id: { $ne: id } });
        if (existingFriendlink) {
            return res.json({ success: false, message: '该友情链接名称已存在' });
        }
        
        // 更新友情链接
        friendlink.name = name;
        friendlink.url = url;
        friendlink.description = description;
        
        await friendlink.save();
        
        res.json({ success: true, message: '友情链接更新成功' });
    } catch (err) {
        console.error('更新友情链接失败:', err);
        res.json({ success: false, message: '服务器错误，更新友情链接失败' });
    }
});

// 删除友情链接
router.post('/friendlink/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        // 验证必填字段
        if (!id) {
            return res.json({ success: false, message: '友情链接ID不能为空' });
        }
        
        // 查找友情链接
        const friendlink = await Friendlink.findById(id);
        if (!friendlink) {
            return res.json({ success: false, message: '友情链接不存在' });
        }
        
        // 删除友情链接
        await Friendlink.findByIdAndDelete(id);
        
        res.json({ success: true, message: '友情链接删除成功' });
    } catch (err) {
        console.error('删除友情链接失败:', err);
        res.json({ success: false, message: '服务器错误，删除友情链接失败' });
    }
});

// 改变友情链接排序
router.post('/friendlink/change-order', async (req, res) => {
    try {
        const { id, direction } = req.body;
        
        // 验证必填字段
        if (!id || !direction) {
            return res.json({ success: false, message: '参数不完整' });
        }
        
        // 查找当前友情链接
        const currentFriendlink = await Friendlink.findById(id);
        if (!currentFriendlink) {
            return res.json({ success: false, message: '友情链接不存在' });
        }
        
        let targetFriendlink;
        
        if (direction === 'up') {
            // 查找上一个友情链接（order值更小的）
            targetFriendlink = await Friendlink.findOne({
                order: { $lt: currentFriendlink.order }
            }).sort({ order: -1 });
        } else if (direction === 'down') {
            // 查找下一个友情链接（order值更大的）
            targetFriendlink = await Friendlink.findOne({
                order: { $gt: currentFriendlink.order }
            }).sort({ order: 1 });
        } else {
            return res.json({ success: false, message: '无效的方向参数' });
        }
        
        // 如果没有找到目标友情链接，说明已经是最上或最下
        if (!targetFriendlink) {
            return res.json({ success: false, message: `已经是最${direction === 'up' ? '上' : '下'}面了` });
        }
        
        // 交换两个友情链接的order值
        const tempOrder = currentFriendlink.order;
        currentFriendlink.order = targetFriendlink.order;
        targetFriendlink.order = tempOrder;
        
        // 保存更改
        await currentFriendlink.save();
        await targetFriendlink.save();
        
        res.json({ success: true, message: '排序更改成功' });
    } catch (err) {
        console.error('更改友情链接排序失败:', err);
        res.json({ success: false, message: '服务器错误，更改排序失败' });
    }
});

module.exports = router;

