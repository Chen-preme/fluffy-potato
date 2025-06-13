const mongoose = require('mongoose');

const friendlinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
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

module.exports = mongoose.model('Friendlink', friendlinkSchema);