const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  articleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Article',
    required: true 
  },
  createTime: { 
    type: Date, 
    default: Date.now 
  }
});

// 创建复合索引确保用户不能重复收藏同一篇文章
favoriteSchema.index({ userId: 1, articleId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);