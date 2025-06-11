const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  content: String,
  createTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
