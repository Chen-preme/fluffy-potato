const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageProcessingService {
  constructor() {
    this.defaultOptions = {
      compression: {
        quality: 80,
        progressive: true
      },
      resize: {
        maxWidth: 1920,
        maxHeight: 1080,
        fit: 'inside',
        withoutEnlargement: true
      },
      watermark: {
        opacity: 0.3,
        position: 'southeast'
      }
    };
  }

  /**
   * 压缩图片
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径（可选）
   * @param {object} options - 压缩选项
   * @returns {Promise<string>} 处理后的文件路径
   */
  async compressImage(inputPath, outputPath = null, options = {}) {
    try {
      const opts = { ...this.defaultOptions.compression, ...options };
      const output = outputPath || inputPath;
      
      const metadata = await sharp(inputPath).metadata();
      let pipeline = sharp(inputPath);

      // 根据原始格式选择压缩方式
      switch (metadata.format) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality: opts.quality,
            progressive: opts.progressive
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: opts.quality,
            progressive: opts.progressive
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: opts.quality
          });
          break;
        default:
          // 默认转换为JPEG
          pipeline = pipeline.jpeg({
            quality: opts.quality,
            progressive: opts.progressive
          });
      }

      await pipeline.toFile(output);
      return output;
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw new Error(`图片压缩失败: ${error.message}`);
    }
  }

  /**
   * 调整图片尺寸
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {object} options - 尺寸选项
   * @returns {Promise<string>} 处理后的文件路径
   */
  async resizeImage(inputPath, outputPath, options = {}) {
    try {
      const opts = { ...this.defaultOptions.resize, ...options };
      
      await sharp(inputPath)
        .resize(opts.maxWidth, opts.maxHeight, {
          fit: opts.fit,
          withoutEnlargement: opts.withoutEnlargement
        })
        .toFile(outputPath);
        
      return outputPath;
    } catch (error) {
      console.error('图片尺寸调整失败:', error);
      throw new Error(`图片尺寸调整失败: ${error.message}`);
    }
  }

  /**
   * 格式转换
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {string} format - 目标格式 (jpeg, png, webp, avif)
   * @param {object} options - 格式选项
   * @returns {Promise<string>} 处理后的文件路径
   */
  async convertFormat(inputPath, outputPath, format, options = {}) {
    try {
      let pipeline = sharp(inputPath);
      
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality: options.quality || 80,
            progressive: options.progressive || true
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: options.quality || 80,
            progressive: options.progressive || true
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: options.quality || 80,
            effort: options.effort || 4
          });
          break;
        case 'avif':
          pipeline = pipeline.avif({
            quality: options.quality || 80,
            effort: options.effort || 4
          });
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }
      
      await pipeline.toFile(outputPath);
      return outputPath;
    } catch (error) {
      console.error('格式转换失败:', error);
      throw new Error(`格式转换失败: ${error.message}`);
    }
  }

  /**
   * 添加水印
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {string} watermarkPath - 水印图片路径
   * @param {object} options - 水印选项
   * @returns {Promise<string>} 处理后的文件路径
   */
  async addWatermark(inputPath, outputPath, watermarkPath, options = {}) {
    try {
      const opts = { ...this.defaultOptions.watermark, ...options };
      
      // 获取主图片信息
      const mainImage = sharp(inputPath);
      const { width, height } = await mainImage.metadata();
      
      // 处理水印图片
      const watermarkSize = Math.min(width, height) * 0.2; // 水印大小为主图的20%
      const watermark = await sharp(watermarkPath)
        .resize(watermarkSize, watermarkSize, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png()
        .toBuffer();
      
      // 计算水印位置
      let left, top;
      switch (opts.position) {
        case 'northwest':
          left = 10;
          top = 10;
          break;
        case 'northeast':
          left = width - watermarkSize - 10;
          top = 10;
          break;
        case 'southwest':
          left = 10;
          top = height - watermarkSize - 10;
          break;
        case 'southeast':
        default:
          left = width - watermarkSize - 10;
          top = height - watermarkSize - 10;
          break;
        case 'center':
          left = (width - watermarkSize) / 2;
          top = (height - watermarkSize) / 2;
          break;
      }
      
      await mainImage
        .composite([{
          input: watermark,
          left: Math.round(left),
          top: Math.round(top),
          blend: 'over'
        }])
        .toFile(outputPath);
        
      return outputPath;
    } catch (error) {
      console.error('添加水印失败:', error);
      throw new Error(`添加水印失败: ${error.message}`);
    }
  }

  /**
   * 生成缩略图
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {object} options - 缩略图选项
   * @returns {Promise<string>} 处理后的文件路径
   */
  async generateThumbnail(inputPath, outputPath, options = {}) {
    try {
      const { width = 200, height = 200, fit = 'cover' } = options;
      
      await sharp(inputPath)
        .resize(width, height, {
          fit: fit,
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
        
      return outputPath;
    } catch (error) {
      console.error('生成缩略图失败:', error);
      throw new Error(`生成缩略图失败: ${error.message}`);
    }
  }

  /**
   * 图片信息获取
   * @param {string} inputPath - 输入文件路径
   * @returns {Promise<object>} 图片信息
   */
  async getImageInfo(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      const stats = fs.statSync(inputPath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      console.error('获取图片信息失败:', error);
      throw new Error(`获取图片信息失败: ${error.message}`);
    }
  }

  /**
   * 批量处理图片
   * @param {Array} files - 文件路径数组
   * @param {string} outputDir - 输出目录
   * @param {object} options - 处理选项
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcess(files, outputDir, options = {}) {
    try {
      const results = [];
      
      // 确保输出目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      for (const file of files) {
        try {
          const filename = path.basename(file);
          const outputPath = path.join(outputDir, filename);
          
          let result = file;
          
          // 根据选项执行不同的处理
          if (options.compress) {
            result = await this.compressImage(result, outputPath, options.compress);
          }
          
          if (options.resize) {
            result = await this.resizeImage(result, outputPath, options.resize);
          }
          
          if (options.format) {
            const ext = `.${options.format}`;
            const newOutputPath = outputPath.replace(/\.[^.]+$/, ext);
            result = await this.convertFormat(result, newOutputPath, options.format, options.formatOptions);
          }
          
          if (options.watermark && options.watermarkPath) {
            result = await this.addWatermark(result, outputPath, options.watermarkPath, options.watermark);
          }
          
          if (options.thumbnail) {
            const thumbPath = outputPath.replace(/\.[^.]+$/, '_thumb$&');
            await this.generateThumbnail(result, thumbPath, options.thumbnail);
          }
          
          results.push({
            original: file,
            processed: result,
            success: true
          });
        } catch (error) {
          results.push({
            original: file,
            processed: null,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('批量处理失败:', error);
      throw new Error(`批量处理失败: ${error.message}`);
    }
  }

  /**
   * 智能压缩（根据文件大小自动调整压缩参数）
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @param {number} targetSizeKB - 目标文件大小（KB）
   * @returns {Promise<string>} 处理后的文件路径
   */
  async smartCompress(inputPath, outputPath, targetSizeKB = 500) {
    try {
      const stats = fs.statSync(inputPath);
      const currentSizeKB = stats.size / 1024;
      
      if (currentSizeKB <= targetSizeKB) {
        // 文件已经足够小，直接复制
        fs.copyFileSync(inputPath, outputPath);
        return outputPath;
      }
      
      // 计算压缩比例
      const ratio = targetSizeKB / currentSizeKB;
      let quality = Math.max(20, Math.min(90, Math.round(ratio * 100)));
      
      // 如果需要大幅压缩，也调整尺寸
      let resizeOptions = null;
      if (ratio < 0.3) {
        const metadata = await sharp(inputPath).metadata();
        const scaleFactor = Math.sqrt(ratio * 2); // 面积缩放
        resizeOptions = {
          width: Math.round(metadata.width * scaleFactor),
          height: Math.round(metadata.height * scaleFactor)
        };
      }
      
      let pipeline = sharp(inputPath);
      
      if (resizeOptions) {
        pipeline = pipeline.resize(resizeOptions.width, resizeOptions.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      await pipeline
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
        
      return outputPath;
    } catch (error) {
      console.error('智能压缩失败:', error);
      throw new Error(`智能压缩失败: ${error.message}`);
    }
  }
}

module.exports = new ImageProcessingService();