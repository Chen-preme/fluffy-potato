const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 评论图片上传配置
const commentImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/comments');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'comment-' + uniqueSuffix + ext);
  }
});

// 邮件附件上传配置
const emailAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/email-attachments');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'email-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 评论图片上传中间件
const uploadCommentImages = multer({
  storage: commentImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3 // 最多3张图片
  }
}).array('images', 3);

// 邮件附件上传中间件
const uploadEmailAttachments = multer({
  storage: emailAttachmentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个附件
  }
}).array('attachments', 5);

// 图片压缩处理
const compressImage = async (filePath, maxWidth = 800, quality = 80) => {
  try {
    const compressedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '_compressed.$1');
    
    await sharp(filePath)
      .resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality })
      .toFile(compressedPath);
    
    // 删除原文件，重命名压缩文件
    fs.unlinkSync(filePath);
    fs.renameSync(compressedPath, filePath);
    
    return filePath;
  } catch (error) {
    console.error('图片压缩失败:', error);
    return filePath; // 压缩失败时返回原文件
  }
};

// 处理评论图片上传的中间件
const handleCommentImageUpload = (req, res, next) => {
  uploadCommentImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ code: 1, msg: err.message });
    }
    
    // 压缩上传的图片
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          if (file.mimetype.startsWith('image/')) {
            await compressImage(file.path);
            // 更新文件大小信息
            const stats = fs.statSync(file.path);
            file.size = stats.size;
          }
        }
      } catch (error) {
        console.error('图片处理失败:', error);
      }
    }
    
    next();
  });
};

// 处理邮件附件上传的中间件
const handleEmailAttachmentUpload = (req, res, next) => {
  uploadEmailAttachments(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ code: 1, msg: err.message });
    }
    
    // 对图片附件进行压缩
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          if (file.mimetype.startsWith('image/')) {
            await compressImage(file.path, 1200, 85); // 邮件图片稍大一些
            // 更新文件大小信息
            const stats = fs.statSync(file.path);
            file.size = stats.size;
          }
        }
      } catch (error) {
        console.error('邮件图片处理失败:', error);
      }
    }
    
    next();
  });
};

module.exports = {
  handleCommentImageUpload,
  handleEmailAttachmentUpload,
  compressImage
};