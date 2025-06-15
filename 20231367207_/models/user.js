const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true }, // 邮箱字段，可选但唯一
    isAdmin: { type: Boolean, default: false }, 
    isFrozen: { type: Boolean, default: false },
    createTime: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
