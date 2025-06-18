// 邮件附件上传功能
class EmailAttachmentUploader {
    constructor() {
        this.maxFiles = 10;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxTotalSize = 25 * 1024 * 1024; // 25MB总大小限制
        this.allowedTypes = [
            // 图片
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
            // 文档
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            // 压缩文件
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
        ];
        this.attachments = [];
        this.init();
    }

    init() {
        this.createUploadUI();
        this.bindEvents();
    }

    createUploadUI() {
        const emailForm = document.querySelector('#email-form');
        if (!emailForm) return;

        const attachmentUploadHTML = `
            <div class="email-attachment-upload">
                <label class="form-label">附件</label>
                <div class="upload-area" id="attachment-upload-area">
                    <input type="file" id="email-attachments" multiple style="display: none;">
                    <div class="upload-placeholder">
                        <i class="fas fa-paperclip"></i>
                        <span>点击或拖拽上传附件</span>
                        <small>支持图片、文档、压缩包等格式，最多${this.maxFiles}个文件，单个文件不超过10MB，总大小不超过25MB</small>
                    </div>
                </div>
                <div class="attachment-list" id="attachment-list"></div>
                <div class="upload-progress" id="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <span class="progress-text" id="progress-text">0%</span>
                </div>
            </div>
        `;

        const contentTextarea = emailForm.querySelector('textarea[name="content"]');
        contentTextarea.closest('.form-group').insertAdjacentHTML('afterend', attachmentUploadHTML);
    }

    bindEvents() {
        const uploadArea = document.getElementById('attachment-upload-area');
        const fileInput = document.getElementById('email-attachments');

        if (!uploadArea || !fileInput) return;

        // 点击上传
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // 表单提交事件
        const emailForm = document.querySelector('#email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitEmailWithAttachments();
            });
        }
    }

    handleFiles(files) {
        const fileArray = Array.from(files);
        
        // 检查文件数量
        if (this.attachments.length + fileArray.length > this.maxFiles) {
            alert(`最多只能上传${this.maxFiles}个附件`);
            return;
        }

        // 检查总大小
        const currentTotalSize = this.attachments.reduce((sum, file) => sum + file.size, 0);
        const newFilesSize = fileArray.reduce((sum, file) => sum + file.size, 0);
        
        if (currentTotalSize + newFilesSize > this.maxTotalSize) {
            alert('附件总大小不能超过25MB');
            return;
        }

        fileArray.forEach(file => {
            if (this.validateFile(file)) {
                this.addAttachment(file);
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
            alert(`文件过大: ${file.name}，请选择小于10MB的文件`);
            return false;
        }

        return true;
    }

    addAttachment(file) {
        const attachmentData = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            id: Date.now() + Math.random()
        };

        this.attachments.push(attachmentData);
        this.renderAttachmentList();
    }

    removeAttachment(id) {
        this.attachments = this.attachments.filter(attachment => attachment.id !== id);
        this.renderAttachmentList();
    }

    renderAttachmentList() {
        const listContainer = document.getElementById('attachment-list');
        if (!listContainer) return;

        if (this.attachments.length === 0) {
            listContainer.innerHTML = '';
            return;
        }

        const totalSize = this.attachments.reduce((sum, file) => sum + file.size, 0);
        
        const listHTML = `
            <div class="attachment-summary">
                <span>已选择 ${this.attachments.length} 个文件，总大小: ${this.formatFileSize(totalSize)}</span>
            </div>
            <div class="attachment-items">
                ${this.attachments.map(attachment => `
                    <div class="attachment-item" data-id="${attachment.id}">
                        <div class="attachment-icon">
                            <i class="${this.getFileIcon(attachment.type)}"></i>
                        </div>
                        <div class="attachment-info">
                            <div class="attachment-name">${attachment.name}</div>
                            <div class="attachment-size">${this.formatFileSize(attachment.size)}</div>
                        </div>
                        <button type="button" class="remove-attachment-btn" onclick="emailAttachmentUploader.removeAttachment(${attachment.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        listContainer.innerHTML = listHTML;
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'fas fa-file-archive';
        if (mimeType.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showProgress(percent) {
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressContainer && progressFill && progressText) {
            progressContainer.style.display = 'block';
            progressFill.style.width = percent + '%';
            progressText.textContent = Math.round(percent) + '%';
        }
    }

    hideProgress() {
        const progressContainer = document.getElementById('upload-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    async submitEmailWithAttachments() {
        const form = document.getElementById('email-form');
        const formData = new FormData(form);

        // 添加附件
        this.attachments.forEach(attachment => {
            formData.append('attachments', attachment.file);
        });

        try {
            this.showProgress(0);
            
            const xhr = new XMLHttpRequest();
            
            // 上传进度
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    this.showProgress(percent);
                }
            });

            // 请求完成
            xhr.addEventListener('load', () => {
                this.hideProgress();
                
                if (xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.code === 0) {
                        alert('邮件发送成功！');
                        form.reset();
                        this.attachments = [];
                        this.renderAttachmentList();
                    } else {
                        alert(result.msg || '邮件发送失败');
                    }
                } else {
                    alert('邮件发送失败，请重试');
                }
            });

            // 请求错误
            xhr.addEventListener('error', () => {
                this.hideProgress();
                alert('邮件发送失败，请检查网络连接');
            });

            xhr.open('POST', '/api/email/send');
            xhr.send(formData);

        } catch (error) {
            this.hideProgress();
            console.error('发送邮件失败:', error);
            alert('邮件发送失败，请重试');
        }
    }
}

// 初始化附件上传器
let emailAttachmentUploader;
document.addEventListener('DOMContentLoaded', () => {
    emailAttachmentUploader = new EmailAttachmentUploader();
});