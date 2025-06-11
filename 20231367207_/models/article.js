const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String, // 或 userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    required: true
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  updateTime: {
    type: Date,
    default: Date.now
  }
});

// 每次保存前自动更新时间
articleSchema.pre('save', function (next) {
  this.updateTime = new Date();
  next();
});

module.exports = mongoose.model('Article', articleSchema);
