// 邮件发送页面JavaScript

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadUserList();
    loadCurrentUserEmail();
    initEventListeners();
});

// 初始化事件监听器
function initEventListeners() {
    // 邮件发送表单提交
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }

    // 邮箱设置表单提交
    const emailSettingsForm = document.getElementById('emailSettingsForm');
    if (emailSettingsForm) {
        emailSettingsForm.addEventListener('submit', handleEmailSettingsSubmit);
    }

    // 清空表单按钮
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearEmailForm);
    }

    // 收件人选择变化
    const toUsername = document.getElementById('toUsername');
    if (toUsername) {
        toUsername.addEventListener('change', handleRecipientChange);
    }
}

// 加载用户列表
async function loadUserList() {
    try {
        const response = await fetch('/api/users/list');
        const data = await response.json();
        
        if (data.code === 0) {
            const select = document.getElementById('toUsername');
            if (select) {
                // 清空现有选项（保留默认选项）
                select.innerHTML = '<option value="">请选择收件人</option>';
                
                // 添加用户选项
                data.data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.username;
                    option.textContent = user.username + (user.hasEmail ? ' ✓' : ' ✗');
                    option.dataset.hasEmail = user.hasEmail;
                    select.appendChild(option);
                });
            }
        } else {
            showStatus('获取用户列表失败: ' + data.msg, 'error');
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
        showStatus('加载用户列表失败', 'error');
    }
}

// 加载当前用户邮箱
async function loadCurrentUserEmail() {
    // 这里可以添加获取当前用户邮箱的逻辑
    // 暂时留空，因为需要后端提供相应接口
}

// 处理收件人选择变化
function handleRecipientChange(event) {
    const selectedOption = event.target.selectedOptions[0];
    const statusDiv = document.getElementById('userEmailStatus');
    
    if (selectedOption && selectedOption.value) {
        const hasEmail = selectedOption.dataset.hasEmail === 'true';
        
        if (hasEmail) {
            statusDiv.innerHTML = '<span class="text-success"><i class="fa fa-check"></i> 该用户已设置邮箱</span>';
        } else {
            statusDiv.innerHTML = '<span class="text-warning"><i class="fa fa-exclamation-triangle"></i> 该用户未设置邮箱，无法接收邮件</span>';
        }
    } else {
        statusDiv.innerHTML = '';
    }
}

// 处理邮件发送表单提交
async function handleEmailSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const emailData = {
        toUsername: formData.get('toUsername'),
        subject: formData.get('subject'),
        content: formData.get('content')
    };
    
    // 验证表单数据
    if (!emailData.toUsername || !emailData.subject || !emailData.content) {
        showStatus('请填写完整的邮件信息', 'error');
        return;
    }
    
    // 检查收件人是否有邮箱
    const selectedOption = document.getElementById('toUsername').selectedOptions[0];
    if (selectedOption && selectedOption.dataset.hasEmail === 'false') {
        showStatus('该用户未设置邮箱，无法发送邮件', 'error');
        return;
    }
    
    const sendBtn = document.getElementById('sendEmailBtn');
    const originalText = sendBtn.innerHTML;
    
    try {
        // 显示发送中状态
        sendBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 发送中...';
        sendBtn.disabled = true;
        
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });
        
        const data = await response.json();
        
        if (data.code === 0) {
            showStatus('邮件发送成功！', 'success');
            clearEmailForm();
        } else {
            showStatus('邮件发送失败: ' + data.msg, 'error');
        }
    } catch (error) {
        console.error('发送邮件失败:', error);
        showStatus('发送邮件失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// 处理邮箱设置表单提交
async function handleEmailSettingsSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('userEmail');
    
    const updateBtn = document.getElementById('updateEmailBtn');
    const originalText = updateBtn.innerHTML;
    
    try {
        // 显示保存中状态
        updateBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 保存中...';
        updateBtn.disabled = true;
        
        const response = await fetch('/api/user/update-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        
        if (data.code === 0) {
            showStatus('邮箱设置成功！', 'success');
            // 重新加载用户列表以更新邮箱状态
            loadUserList();
        } else {
            showStatus('邮箱设置失败: ' + data.msg, 'error');
        }
    } catch (error) {
        console.error('设置邮箱失败:', error);
        showStatus('设置邮箱失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
    }
}

// 清空邮件表单
function clearEmailForm() {
    const form = document.getElementById('emailForm');
    if (form) {
        form.reset();
        document.getElementById('userEmailStatus').innerHTML = '';
    }
}

// 显示状态信息
function showStatus(message, type) {
    const statusDiv = document.getElementById('emailStatus');
    if (statusDiv) {
        statusDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
        statusDiv.innerHTML = `<i class="fa fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i> ${message}`;
        statusDiv.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

// 显示登录模态框（如果存在）
function showLoginModal() {
    if (typeof window.showLoginModal === 'function') {
        window.showLoginModal();
    } else {
        // 如果没有登录模态框，跳转到登录页面
        window.location.href = '/login';
    }
}