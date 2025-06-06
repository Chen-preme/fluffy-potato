const mongoose = require('mongoose');
module.exports = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
    },// 用户名

    password:{
         type:String,
        required: true,    
        },// 密码

    isAdmin: {
        type: Boolean,
        default: false // 是否是管理员
    }

},{timestamps: true, });// 自动添加 createdAt 和 updatedAt 字段