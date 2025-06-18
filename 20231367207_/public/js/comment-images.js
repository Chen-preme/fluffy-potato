// 评论图片上传功能
class CommentImageUploader {
    constructor() {
        this.maxFiles = 5;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.uploadedImages = [];
        this.init();
    }

    init() {
        this.createUploadUI();
        this.bindEvents();
    }

    createUploadUI() {
        // 检查HTML中是否已存在上传区域
        const existingUploadArea = document.getElementById('imageUploadArea');
        if (existingUploadArea) {
            console.log('使用HTML中已存在的图片上传区域');
            return; // 使用HTML中已存在的元素
        }

        // 如果不存在，则动态创建（备用方案）
        const commentForm = document.querySelector('#comment-form');
        if (!commentForm) {
            console.log('未找到评论表单，无法创建上传区域');
            return;
        }

        const imageUploadHTML = `
            <div class="comment-image-upload">
                <div class="upload-area" id="image-upload-area">
                    <input type="file" id="comment-images" multiple accept="image/*" style="display: none;">
                    <div class="upload-placeholder">
                        <i class="fas fa-image"></i>
                        <span>点击或拖拽上传图片</span>
                        <small>支持 JPG、PNG、GIF、WebP 格式，最多${this.maxFiles}张，单张不超过5MB</small>
                    </div>
                </div>
                <div class="image-preview-container" id="image-preview-container"></div>
            </div>
        `;

        const commentTextarea = commentForm.querySelector('textarea');
        commentTextarea.insertAdjacentHTML('afterend', imageUploadHTML);
    }

    bindEvents() {
        // 优先查找HTML中已存在的元素
        let uploadArea = document.getElementById('imageUploadArea');
        let fileInput = document.getElementById('imageInput');
        
        // 如果HTML中不存在，则查找动态创建的元素
        if (!uploadArea) {
            uploadArea = document.getElementById('image-upload-area');
            fileInput = document.getElementById('comment-images');
        }

        if (!uploadArea || !fileInput) {
            console.error('未找到上传区域或文件输入框');
            return;
        }

        console.log('图片上传事件绑定成功');

        // 点击上传
        uploadArea.addEventListener('click', () => {
            console.log('点击上传区域');
            fileInput.click();
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            console.log('文件选择事件触发，文件数量:', e.target.files.length);
            this.handleFiles(e.target.files);
        });

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('drag-over');
            console.log('拖拽悬停事件触发');
        });

        uploadArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('拖拽进入事件触发');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
            console.log('拖拽离开事件触发');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
            console.log('拖拽放下事件触发，文件数量:', e.dataTransfer.files.length);
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(files) {
        const fileArray = Array.from(files);
        
        // 检查文件数量
        if (this.uploadedImages.length + fileArray.length > this.maxFiles) {
            alert(`最多只能上传${this.maxFiles}张图片`);
            return;
        }

        fileArray.forEach(file => {
            if (this.validateFile(file)) {
                this.uploadImage(file);
            }
        });
    }

    validateFile(file) {
        // 检查文件类型
        if (!this.allowedTypes.includes(file.type)) {
            alert(`不支持的文件格式: ${file.name}`);
            return false;
        }

        // 检查文件大小
        if (file.size > this.maxFileSize) {
            alert(`文件过大: ${file.name}，请选择小于5MB的图片`);
            return false;
        }

        return true;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('images', file);

        try {
            const response = await fetch('/api/comment/upload-images', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.code === 0 && result.data && result.data.length > 0) {
                const imageData = result.data[0];
                // 匹配数据库Comment模型的images字段结构
                const imageInfo = {
                    filename: imageData.filename,
                    originalName: imageData.originalName || file.name,
                    path: imageData.path || `/uploads/comments/${imageData.filename}`,
                    size: file.size,
                    mimetype: file.type,
                    url: imageData.url || `/uploads/comments/${imageData.filename}` // 用于前端显示
                };
                
                this.uploadedImages.push(imageInfo);
                this.addImagePreview(imageInfo);
            } else {
                alert('图片上传失败: ' + (result.msg || '未知错误'));
            }
        } catch (error) {
            console.error('上传失败:', error);
            alert('图片上传失败，请重试');
        }
    }

    addImagePreview(imageData) {
        let container = document.getElementById('imagePreviewContainer');
        if (!container) {
            container = document.getElementById('image-preview-container');
        }
        if (!container) {
            console.log('未找到图片预览容器');
            return;
        }
        
        const previewHTML = `
            <div class="image-preview-item" data-filename="${imageData.filename}">
                <img src="${imageData.url}" alt="${imageData.originalName}">
                <div class="image-preview-overlay">
                    <button type="button" class="remove-image-btn" onclick="commentImageUploader.removeImage('${imageData.filename}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="image-info">
                    <small>${imageData.originalName}</small>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', previewHTML);
    }

    removeImage(filename) {
        // 从数组中移除
        this.uploadedImages = this.uploadedImages.filter(img => img.filename !== filename);
        
        // 从DOM中移除
        const previewItem = document.querySelector(`[data-filename="${filename}"]`);
        if (previewItem) {
            previewItem.remove();
        }

        // 删除服务器上的文件
        fetch('/api/comment/delete-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ filename })
        }).catch(error => {
            console.error('删除图片失败:', error);
        });
    }

    getUploadedImages() {
        // 返回符合数据库模型的图片数据，去掉前端显示用的url字段
        return this.uploadedImages.map(img => ({
            filename: img.filename,
            originalName: img.originalName,
            path: img.path,
            size: img.size,
            mimetype: img.mimetype
        }));
    }

    clearImages() {
        this.uploadedImages = [];
        // 优先查找HTML中已存在的容器
        let container = document.getElementById('imagePreviewContainer');
        if (!container) {
            container = document.getElementById('image-preview-container');
        }
        if (container) {
            container.innerHTML = '';
        }
    }
}

// 初始化图片上传器
let commentImageUploader;
document.addEventListener('DOMContentLoaded', () => {
    commentImageUploader = new CommentImageUploader();
});

// 修改原有的评论提交函数，添加图片支持
if (typeof submitComment === 'function') {
    const originalSubmitComment = submitComment;
    submitComment = function() {
        const images = commentImageUploader ? commentImageUploader.getUploadedImages() : [];
        
        // 获取评论内容 - 修正选择器
        const contentElement = document.getElementById('messageContent');
        if (!contentElement) {
            console.error('未找到评论输入框');
            return;
        }
        
        const content = contentElement.value.trim();
        if (!content && images.length === 0) {
            alert('请输入评论内容或上传图片');
            return;
        }

        // 调用原始的submitComment函数，但添加图片数据
        if (images.length > 0) {
            // 如果有图片，需要特殊处理
            const commentData = {
                content: content,
                images: images,
                articleId: window.articleId || document.querySelector('[data-article-id]')?.dataset.articleId
            };

            if (window.socket) {
                window.socket.emit('new_comment', commentData);
                
                // 清空表单
                contentElement.value = '';
                if (commentImageUploader) {
                    commentImageUploader.clearImages();
                }
            } else {
                alert('连接异常，请刷新页面重试');
            }
        } else {
            // 没有图片时，调用原始函数
            originalSubmitComment();
        }
    };
}