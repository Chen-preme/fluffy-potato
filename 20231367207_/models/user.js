const mongoose = require('mongoose');
const schema = require('../schemas/user');
const user = require('../schemas/user');
module.exports = mongoose.model('User',schema); // 'users' 是集合名称
