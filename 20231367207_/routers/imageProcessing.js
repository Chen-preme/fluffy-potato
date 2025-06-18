const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imageProcessingService = require('../services/imageProcessingService');

// 配置multer用于临时文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件格式'));
    }
  }
});

// 图片压缩接口
router.post('/compress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { quality = 80, progressive = true } = req.body;
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, '_compressed$&');

    const result = await imageProcessingService.compressImage(inputPath, outputPath, {
      quality: parseInt(quality),
      progressive: progressive === 'true'
    });

    // 获取处理后的文件信息
    const stats = fs.statSync(result);
    const originalStats = fs.statSync(inputPath);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '压缩成功',
      data: {
        filename: path.basename(result),
        originalSize: originalStats.size,
        compressedSize: stats.size,
        compressionRatio: ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(2) + '%',
        downloadUrl: `/api/image-processing/download/${path.basename(result)}`
      }
    });
  } catch (error) {
    console.error('图片压缩失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 图片尺寸调整接口
router.post('/resize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { width, height, fit = 'inside' } = req.body;
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, '_resized$&');

    const result = await imageProcessingService.resizeImage(inputPath, outputPath, {
      maxWidth: width ? parseInt(width) : undefined,
      maxHeight: height ? parseInt(height) : undefined,
      fit: fit
    });

    // 获取处理后的图片信息
    const info = await imageProcessingService.getImageInfo(result);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '尺寸调整成功',
      data: {
        filename: path.basename(result),
        width: info.width,
        height: info.height,
        format: info.format,
        size: info.size,
        downloadUrl: `/api/image-processing/download/${path.basename(result)}`
      }
    });
  } catch (error) {
    console.error('图片尺寸调整失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 格式转换接口
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { format, quality = 80 } = req.body;
    if (!format) {
      return res.status(400).json({ code: 1, msg: '请指定目标格式' });
    }

    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, `.${format}`);

    const result = await imageProcessingService.convertFormat(inputPath, outputPath, format, {
      quality: parseInt(quality)
    });

    // 获取处理后的图片信息
    const info = await imageProcessingService.getImageInfo(result);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '格式转换成功',
      data: {
        filename: path.basename(result),
        originalFormat: req.file.mimetype,
        newFormat: info.format,
        width: info.width,
        height: info.height,
        size: info.size,
        downloadUrl: `/api/image-processing/download/${path.basename(result)}`
      }
    });
  } catch (error) {
    console.error('格式转换失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 生成缩略图接口
router.post('/thumbnail', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { width = 200, height = 200, fit = 'cover' } = req.body;
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, '_thumb$&');

    const result = await imageProcessingService.generateThumbnail(inputPath, outputPath, {
      width: parseInt(width),
      height: parseInt(height),
      fit: fit
    });

    // 获取处理后的图片信息
    const info = await imageProcessingService.getImageInfo(result);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '缩略图生成成功',
      data: {
        filename: path.basename(result),
        width: info.width,
        height: info.height,
        size: info.size,
        downloadUrl: `/api/image-processing/download/${path.basename(result)}`
      }
    });
  } catch (error) {
    console.error('缩略图生成失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 智能压缩接口
router.post('/smart-compress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { targetSize = 500 } = req.body; // 默认目标大小500KB
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^.]+$/, '_smart_compressed$&');

    const result = await imageProcessingService.smartCompress(inputPath, outputPath, parseInt(targetSize));

    // 获取处理后的文件信息
    const stats = fs.statSync(result);
    const originalStats = fs.statSync(inputPath);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '智能压缩成功',
      data: {
        filename: path.basename(result),
        originalSize: originalStats.size,
        compressedSize: stats.size,
        compressionRatio: ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(2) + '%',
        targetSizeKB: parseInt(targetSize),
        actualSizeKB: Math.round(stats.size / 1024),
        downloadUrl: `/api/image-processing/download/${path.basename(result)}`
      }
    });
  } catch (error) {
    console.error('智能压缩失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 获取图片信息接口
router.post('/info', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const inputPath = req.file.path;
    const info = await imageProcessingService.getImageInfo(inputPath);
    
    // 清理临时文件
    fs.unlinkSync(inputPath);

    res.json({
      code: 0,
      msg: '获取图片信息成功',
      data: {
        width: info.width,
        height: info.height,
        format: info.format,
        size: info.size,
        sizeKB: Math.round(info.size / 1024),
        sizeMB: (info.size / (1024 * 1024)).toFixed(2),
        channels: info.channels,
        density: info.density,
        hasAlpha: info.hasAlpha,
        orientation: info.orientation
      }
    });
  } catch (error) {
    console.error('获取图片信息失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 批量处理接口
router.post('/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ code: 1, msg: '请上传图片文件' });
    }

    const { operation, ...options } = req.body;
    const files = req.files.map(file => file.path);
    const outputDir = path.join(__dirname, '../uploads/temp/batch_' + Date.now());

    let processOptions = {};
    
    switch (operation) {
      case 'compress':
        processOptions.compress = {
          quality: parseInt(options.quality) || 80
        };
        break;
      case 'resize':
        processOptions.resize = {
          maxWidth: parseInt(options.width) || undefined,
          maxHeight: parseInt(options.height) || undefined
        };
        break;
      case 'convert':
        processOptions.format = options.format;
        processOptions.formatOptions = {
          quality: parseInt(options.quality) || 80
        };
        break;
      default:
        return res.status(400).json({ code: 1, msg: '不支持的操作类型' });
    }

    const results = await imageProcessingService.batchProcess(files, outputDir, processOptions);
    
    // 清理原始临时文件
    files.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    res.json({
      code: 0,
      msg: '批量处理完成',
      data: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results.map(r => ({
          original: path.basename(r.original),
          success: r.success,
          error: r.error,
          downloadUrl: r.success ? `/api/image-processing/download/${path.basename(r.processed)}` : null
        }))
      }
    });
  } catch (error) {
    console.error('批量处理失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 文件下载接口
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/temp', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ code: 1, msg: '文件不存在' });
    }
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
        res.status(500).json({ code: 1, msg: '文件下载失败' });
      } else {
        // 下载完成后删除临时文件
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000); // 5秒后删除
      }
    });
  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

// 清理临时文件接口（管理员功能）
router.delete('/cleanup', (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../uploads/temp');
    
    if (!fs.existsSync(tempDir)) {
      return res.json({ code: 0, msg: '临时目录不存在' });
    }
    
    const files = fs.readdirSync(tempDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      // 删除1小时前的文件
      if (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    res.json({
      code: 0,
      msg: '清理完成',
      data: {
        deletedCount,
        remainingCount: files.length - deletedCount
      }
    });
  } catch (error) {
    console.error('清理临时文件失败:', error);
    res.status(500).json({ code: 1, msg: error.message });
  }
});

module.exports = router;