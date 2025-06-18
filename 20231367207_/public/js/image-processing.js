class ImageProcessor {
    constructor() {
        this.currentFile = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupTabs();
        this.setupSliders();
    }

    bindEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');

        // 点击上传
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // 文件选择
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
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
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // 批量操作选择变化
        const batchOperation = document.getElementById('batchOperation');
        if (batchOperation) {
            batchOperation.addEventListener('change', () => {
                this.updateBatchOptions();
            });
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // 移除所有活动状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // 激活当前标签
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    setupSliders() {
        // 压缩质量滑块
        const compressQuality = document.getElementById('compressQuality');
        const qualityValue = document.getElementById('qualityValue');
        if (compressQuality && qualityValue) {
            compressQuality.addEventListener('input', () => {
                qualityValue.textContent = compressQuality.value;
            });
        }

        // 转换质量滑块
        const convertQuality = document.getElementById('convertQuality');
        const convertQualityValue = document.getElementById('convertQualityValue');
        if (convertQuality && convertQualityValue) {
            convertQuality.addEventListener('input', () => {
                convertQualityValue.textContent = convertQuality.value;
            });
        }
    }

    async handleFileSelect(file) {
        if (!this.isValidImageFile(file)) {
            this.showError('请选择有效的图片文件');
            return;
        }

        this.currentFile = file;
        
        // 显示预览
        this.showPreview(file);
        
        // 获取图片信息
        await this.getImageInfo(file);
        
        // 显示处理选项
        document.getElementById('processingOptions').style.display = 'block';
    }

    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB限制
    }

    showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalImage = document.getElementById('originalImage');
            originalImage.src = e.target.result;
            document.getElementById('previewContainer').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    async getImageInfo(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/image-processing/info', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.code === 0) {
                this.displayImageInfo(result.data, 'originalInfo');
            }
        } catch (error) {
            console.error('获取图片信息失败:', error);
        }
    }

    displayImageInfo(info, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">尺寸</div>
                    <div class="info-value">${info.width} × ${info.height}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">格式</div>
                    <div class="info-value">${info.format.toUpperCase()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">文件大小</div>
                    <div class="info-value">${info.sizeMB} MB</div>
                </div>
                <div class="info-item">
                    <div class="info-label">颜色通道</div>
                    <div class="info-value">${info.channels}</div>
                </div>
            </div>
        `;
    }

    showProgress(text = '处理中...') {
        const progressContainer = document.getElementById('progressContainer');
        const progressText = document.getElementById('progressText');
        const progressBar = document.getElementById('progressBar');
        
        progressContainer.classList.remove('hidden');
        progressText.textContent = text;
        progressBar.style.width = '0%';
        
        // 模拟进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
        }, 200);
        
        return interval;
    }

    hideProgress(interval) {
        if (interval) clearInterval(interval);
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressContainer.classList.add('hidden');
        }, 500);
    }

    showResult(data, type = 'success') {
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');
        
        let content = '';
        
        if (type === 'success') {
            content = `
                <div class="result-info">
                    <h4><i class="fas fa-check-circle"></i> 处理成功</h4>
                    ${this.formatResultData(data)}
                    <div style="margin-top: 15px;">
                        <a href="${data.downloadUrl}" class="btn btn-success" download>
                            <i class="fas fa-download"></i> 下载处理后的图片
                        </a>
                    </div>
                </div>
            `;
            
            // 显示处理后的图片
            if (data.downloadUrl) {
                const processedImage = document.getElementById('processedImage');
                processedImage.src = data.downloadUrl;
                processedImage.classList.remove('hidden');
                
                // 显示处理后的信息
                if (data.width && data.height) {
                    this.displayProcessedInfo(data);
                }
            }
        } else {
            content = `
                <div class="error-info">
                    <h4><i class="fas fa-exclamation-triangle"></i> 处理失败</h4>
                    <p>${data.message || '未知错误'}</p>
                </div>
            `;
        }
        
        resultContent.innerHTML = content;
        resultContainer.classList.remove('hidden');
    }

    formatResultData(data) {
        let html = '<div class="info-grid">';
        
        if (data.filename) {
            html += `
                <div class="info-item">
                    <div class="info-label">文件名</div>
                    <div class="info-value">${data.filename}</div>
                </div>
            `;
        }
        
        if (data.width && data.height) {
            html += `
                <div class="info-item">
                    <div class="info-label">尺寸</div>
                    <div class="info-value">${data.width} × ${data.height}</div>
                </div>
            `;
        }
        
        if (data.compressedSize || data.size) {
            const size = data.compressedSize || data.size;
            html += `
                <div class="info-item">
                    <div class="info-label">文件大小</div>
                    <div class="info-value">${(size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
            `;
        }
        
        if (data.compressionRatio) {
            html += `
                <div class="info-item">
                    <div class="info-label">压缩率</div>
                    <div class="info-value">${data.compressionRatio}</div>
                </div>
            `;
        }
        
        if (data.format || data.newFormat) {
            const format = data.newFormat || data.format;
            html += `
                <div class="info-item">
                    <div class="info-label">格式</div>
                    <div class="info-value">${format.toUpperCase()}</div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    displayProcessedInfo(data) {
        const processedInfo = document.getElementById('processedInfo');
        processedInfo.innerHTML = this.formatResultData(data);
        processedInfo.classList.remove('hidden');
    }

    showError(message) {
        this.showResult({ message }, 'error');
    }

    async makeRequest(endpoint, formData, progressText) {
        const progressInterval = this.showProgress(progressText);
        
        try {
            const response = await fetch(`/api/image-processing/${endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            this.hideProgress(progressInterval);
            
            if (result.code === 0) {
                this.showResult(result.data, 'success');
            } else {
                this.showError(result.msg || '处理失败');
            }
        } catch (error) {
            this.hideProgress(progressInterval);
            this.showError('网络错误: ' + error.message);
        }
    }

    updateBatchOptions() {
        const operation = document.getElementById('batchOperation').value;
        const optionsContainer = document.getElementById('batchOptions');
        
        let html = '';
        
        switch (operation) {
            case 'compress':
                html = `
                    <label for="batchQuality">压缩质量 (1-100)</label>
                    <input type="range" id="batchQuality" class="form-control" min="1" max="100" value="80">
                    <span id="batchQualityValue">80</span>
                `;
                break;
            case 'resize':
                html = `
                    <label for="batchWidth">宽度 (像素)</label>
                    <input type="number" id="batchWidth" class="form-control" placeholder="留空保持比例">
                    <label for="batchHeight">高度 (像素)</label>
                    <input type="number" id="batchHeight" class="form-control" placeholder="留空保持比例">
                `;
                break;
            case 'convert':
                html = `
                    <label for="batchFormat">目标格式</label>
                    <select id="batchFormat" class="form-control">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </select>
                    <label for="batchConvertQuality">质量 (1-100)</label>
                    <input type="range" id="batchConvertQuality" class="form-control" min="1" max="100" value="80">
                    <span id="batchConvertQualityValue">80</span>
                `;
                break;
        }
        
        optionsContainer.innerHTML = html;
        
        // 重新绑定滑块事件
        const qualitySlider = optionsContainer.querySelector('input[type="range"]');
        const qualityValue = optionsContainer.querySelector('span');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = qualitySlider.value;
            });
        }
    }
}

// 全局函数
let imageProcessor;

document.addEventListener('DOMContentLoaded', () => {
    imageProcessor = new ImageProcessor();
});

function compressImage() {
    if (!imageProcessor.currentFile) {
        imageProcessor.showError('请先选择图片');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageProcessor.currentFile);
    formData.append('quality', document.getElementById('compressQuality').value);
    formData.append('progressive', document.getElementById('progressive').checked);
    
    imageProcessor.makeRequest('compress', formData, '正在压缩图片...');
}

function resizeImage() {
    if (!imageProcessor.currentFile) {
        imageProcessor.showError('请先选择图片');
        return;
    }
    
    const width = document.getElementById('resizeWidth').value;
    const height = document.getElementById('resizeHeight').value;
    
    if (!width && !height) {
        imageProcessor.showError('请至少指定宽度或高度');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageProcessor.currentFile);
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);
    formData.append('fit', document.getElementById('resizeFit').value);
    
    imageProcessor.makeRequest('resize', formData, '正在调整图片尺寸...');
}

function convertFormat() {
    if (!imageProcessor.currentFile) {
        imageProcessor.showError('请先选择图片');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageProcessor.currentFile);
    formData.append('format', document.getElementById('convertFormat').value);
    formData.append('quality', document.getElementById('convertQuality').value);
    
    imageProcessor.makeRequest('convert', formData, '正在转换图片格式...');
}

function generateThumbnail() {
    if (!imageProcessor.currentFile) {
        imageProcessor.showError('请先选择图片');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageProcessor.currentFile);
    formData.append('width', document.getElementById('thumbWidth').value);
    formData.append('height', document.getElementById('thumbHeight').value);
    formData.append('fit', document.getElementById('thumbFit').value);
    
    imageProcessor.makeRequest('thumbnail', formData, '正在生成缩略图...');
}

function smartCompress() {
    if (!imageProcessor.currentFile) {
        imageProcessor.showError('请先选择图片');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageProcessor.currentFile);
    formData.append('targetSize', document.getElementById('targetSize').value);
    
    imageProcessor.makeRequest('smart-compress', formData, '正在智能压缩图片...');
}

async function batchProcess() {
    const batchFiles = document.getElementById('batchFiles').files;
    if (batchFiles.length === 0) {
        imageProcessor.showError('请选择要批量处理的图片');
        return;
    }
    
    const operation = document.getElementById('batchOperation').value;
    const formData = new FormData();
    
    // 添加所有文件
    for (let i = 0; i < batchFiles.length; i++) {
        formData.append('images', batchFiles[i]);
    }
    
    formData.append('operation', operation);
    
    // 根据操作类型添加参数
    switch (operation) {
        case 'compress':
            formData.append('quality', document.getElementById('batchQuality').value);
            break;
        case 'resize':
            const width = document.getElementById('batchWidth').value;
            const height = document.getElementById('batchHeight').value;
            if (width) formData.append('width', width);
            if (height) formData.append('height', height);
            break;
        case 'convert':
            formData.append('format', document.getElementById('batchFormat').value);
            formData.append('quality', document.getElementById('batchConvertQuality').value);
            break;
    }
    
    imageProcessor.makeRequest('batch', formData, `正在批量处理 ${batchFiles.length} 个文件...`);
}