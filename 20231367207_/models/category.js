const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0 // 用于排序
  },
  createTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);