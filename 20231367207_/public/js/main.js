// 获取当前URL
 const currentUrl = window.location.pathname;
    
 // 获取所有导航链接
 const navLinks = document.querySelectorAll('.menu a');
 
 // 移除所有链接的focus类
 navLinks.forEach(link => {
     link.classList.remove('focus');
 });

// 收藏功能
$(document).ready(function() {
    // 检查文章收藏状态
    const articleId = document.getElementById('articleData')?.dataset.articleId;
    if (articleId && document.getElementById('favoriteBtn')) {
        checkFavoriteStatus(articleId);
    }
    
    // 收藏按钮点击事件
    $('#favoriteBtn').on('click', function() {
        const articleId = $(this).data('article-id');
        const isFavorited = $(this).hasClass('favorited');
        
        if (isFavorited) {
            removeFavorite(articleId);
        } else {
            addFavorite(articleId);
        }
    });
});

// 检查收藏状态
function checkFavoriteStatus(articleId) {
    fetch(`/api/favorite/check?articleId=${articleId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                updateFavoriteButton(data.data.isFavorited);
            }
        })
        .catch(error => {
            console.error('检查收藏状态失败:', error);
        });
}

// 添加收藏
function addFavorite(articleId) {
    const btn = $('#favoriteBtn');
    btn.prop('disabled', true);
    
    fetch('/api/favorite/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ articleId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 0) {
            updateFavoriteButton(true);
            showCommentStatus('收藏成功！', 'success');
        } else {
            showCommentStatus('收藏失败: ' + data.msg, 'error');
        }
    })
    .catch(error => {
        console.error('收藏失败:', error);
        showCommentStatus('网络错误，请稍后重试', 'error');
    })
    .finally(() => {
        btn.prop('disabled', false);
    });
}

// 取消收藏
function removeFavorite(articleId) {
    const btn = $('#favoriteBtn');
    btn.prop('disabled', true);
    
    fetch('/api/favorite/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ articleId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 0) {
            updateFavoriteButton(false);
            showCommentStatus('取消收藏成功！', 'success');
        } else {
            showCommentStatus('取消收藏失败: ' + data.msg, 'error');
        }
    })
    .catch(error => {
        console.error('取消收藏失败:', error);
        showCommentStatus('网络错误，请稍后重试', 'error');
    })
    .finally(() => {
        btn.prop('disabled', false);
    });
}

// 更新收藏按钮状态
function updateFavoriteButton(isFavorited) {
    const btn = $('#favoriteBtn');
    const icon = btn.find('i');
    const text = btn.find('.favorite-text');
    
    if (isFavorited) {
        btn.addClass('favorited')
           .css('background', '#dc3545');
        icon.removeClass('fa-heart-o').addClass('fa-heart');
        text.text('取消收藏');
    } else {
        btn.removeClass('favorited')
           .css('background', '#007bff');
        icon.removeClass('fa-heart').addClass('fa-heart-o');
        text.text('收藏');
    }
}
 
 // 根据当前URL设置对应链接的focus类
 if (currentUrl === '/') {
     const homeLink = document.querySelector('a[href="/"]');
     if (homeLink) {
         homeLink.classList.add('focus');
     }
 } else if (currentUrl.startsWith('/detail')) {
     const detailLink = document.querySelector('#detailLink');
     if (detailLink) {
         detailLink.classList.add('focus');
     }
 } else {
     // 对于分类页面
     const categoryLink = document.querySelector(`a[href="${currentUrl}"]`);
     if (categoryLink) {
         categoryLink.classList.add('focus');
     }
 }

// 全局变量，用于评论功能
let articleId;
let isLoggedIn;
let currentPage = 1;
const commentsPerPage = 10;
let totalComments = 0;
let totalPages = 0;
let socket;

// 评论缓存
const commentCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存过期时间

// 评论功能相关代码
// 当页面是文章详情页时执行
if (currentUrl.startsWith('/detail')) {
    document.addEventListener('DOMContentLoaded', function() {
        // 获取文章ID和用户登录状态
        articleId = document.getElementById('articleData')?.dataset.articleId;
        isLoggedIn = document.getElementById('userData')?.dataset.isLoggedIn === 'true';
        
        if (!articleId) return; // 如果没有文章ID，不执行后续代码
        
        // 初始化Socket.IO连接
        socket = io();
        
        // 加入文章房间
        socket.emit('join_article', articleId);
        
        // 加载评论
        loadComments(1);
        
        // 提交评论按钮点击事件
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            messageBtn.addEventListener('click', function() {
                submitComment();
            });
        }
        
        // 监听新评论事件
        socket.on('comment_added', function(data) {
            // 恢复提交按钮状态
            const submitBtn = document.getElementById('messageBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '提交';
            }
            
            // 清空评论框
            document.getElementById('messageContent').value = '';
            
            // 清除相关缓存
            clearCommentCache();
            
            // 显示成功消息
            showCommentStatus('评论发布成功！', 'success');
            
            // 更新评论计数
            totalComments = data.commentCount;
            updateCommentCount(totalComments);
            
            // 如果在第一页，直接添加新评论到顶部
            if (currentPage === 1) {
                prependComment(data.comment);
            } else {
                // 如果不在第一页，显示提示
                showNewCommentAlert();
            }
        });
        
        // 监听评论错误
        socket.on('comment_error', function(data) {
            // 恢复提交按钮状态
            const submitBtn = document.getElementById('messageBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '提交';
            }
            
            showCommentStatus('评论发送失败: ' + data.message, 'error');
        });
    });
}

// 清除评论缓存
function clearCommentCache() {
    if (articleId) {
        // 清除当前文章的所有页面缓存
        for (const key of commentCache.keys()) {
            if (key.startsWith(articleId + '_')) {
                commentCache.delete(key);
            }
        }
        console.log('已清除文章评论缓存');
    }
}

// 加载评论
function loadComments(page) {
    // 使用全局变量articleId
    if (!articleId) {
        articleId = document.getElementById('articleData')?.dataset.articleId;
        if (!articleId) return;
    }
    
    currentPage = page;
    
    // 检查缓存
    const cacheKey = `${articleId}_${page}`;
    const cachedData = commentCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
        console.log('使用缓存数据加载评论');
        const { comments, pagination } = cachedData.data;
        totalComments = pagination.total;
        totalPages = pagination.pages;
        updateCommentCount(totalComments);
        renderComments(comments);
        renderPagination(pagination);
        return;
    }
    
    // 显示加载状态
    const container = document.getElementById('commentContainer');
    if (container) {
        container.innerHTML = '<div class="messageBox"><p>正在加载评论...</p></div>';
    }
    
    fetch(`/api/comments?articleId=${articleId}&page=${page}&limit=${commentsPerPage}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                const { comments, pagination } = data.data;
                totalComments = pagination.total;
                totalPages = pagination.pages;
                
                // 缓存数据
                commentCache.set(cacheKey, {
                    data: data.data,
                    timestamp: Date.now()
                });
                
                // 更新评论计数
                updateCommentCount(totalComments);
                
                // 渲染评论
                renderComments(comments);
                
                // 渲染分页
                renderPagination(pagination);
                
                showCommentStatus('评论加载成功', 'success');
            } else {
                if (container) {
                    container.innerHTML = '<div class="messageBox"><p>加载评论失败: ' + (data.msg || '未知错误') + '</p></div>';
                }
                showCommentStatus('加载评论失败: ' + (data.msg || '未知错误'), 'error');
            }
        })
        .catch(error => {
            console.error('获取评论失败:', error);
            if (container) {
                container.innerHTML = `
                    <div class="messageBox">
                        <p>加载评论失败，请检查网络连接</p>
                        <button onclick="loadComments(${page})" style="margin-top: 10px; padding: 5px 15px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">重新加载</button>
                    </div>
                `;
            }
            showCommentStatus('评论加载失败，请检查网络连接', 'error');
        });
}

// 提交新评论
function submitComment() {
    console.log('submitComment函数被调用');
    
    // 使用全局变量articleId，如果不存在则重新获取
    if (!articleId) {
        articleId = document.getElementById('articleData')?.dataset.articleId;
    }
    console.log('文章ID:', articleId);
    
    // 检查用户是否已登录
    const userDataElement = document.getElementById('userData');
    console.log('用户数据元素:', userDataElement);
    
    if (!userDataElement) {
        console.log('未找到用户数据元素，用户未登录');
        showCommentStatus('请先登录后再评论', 'error');
        return;
    }
    
    const userId = userDataElement.dataset.userId;
    const username = userDataElement.dataset.username;
    console.log('用户ID:', userId, '用户名:', username);
    
    if (!articleId || !userId || !username) {
        console.log('缺少必要信息 - 文章ID:', articleId, '用户ID:', userId, '用户名:', username);
        showCommentStatus('请先登录后再评论', 'error');
        return;
    }
    
    const content = document.getElementById('messageContent').value.trim();
    console.log('评论内容:', content);
    
    if (!content) {
        showCommentStatus('评论内容不能为空', 'error');
        return;
    }
    
    if (content.length > 500) {
        showCommentStatus('评论内容不能超过500字', 'error');
        return;
    }
    
    // 禁用提交按钮，防止重复提交
    const submitBtn = document.getElementById('messageBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    console.log('按钮状态已更新为提交中');
    
    // 使用全局socket变量，如果不存在则创建新的连接
    if (!socket) {
        console.log('创建新的socket连接');
        socket = io();
    }
    
    const commentData = {
        articleId: articleId,
        userId: userId,
        username: username,
        content: content
    };
    console.log('发送评论数据:', commentData);
    
    socket.emit('new_comment', commentData);
    
    // 设置超时处理
    setTimeout(() => {
        if (submitBtn.disabled) {
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
            showCommentStatus('提交超时，请重试', 'error');
            console.log('提交超时');
        }
    }, 10000); // 10秒超时
}

// 渲染评论列表
function renderComments(comments) {
    const container = document.getElementById('commentContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (comments.length === 0) {
        container.innerHTML = '<div class="messageBox"><p>还没有留言</p></div>';
        return;
    }
    
    comments.forEach(comment => {
        const commentHtml = createCommentHtml(comment);
        container.innerHTML += commentHtml;
    });
}

// 在评论列表顶部添加新评论
function prependComment(comment) {
    const container = document.getElementById('commentContainer');
    if (!container) return;
    
    const noCommentsMessage = document.getElementById('noCommentsMessage');
    
    // 如果有"还没有留言"的消息，先移除它
    if (noCommentsMessage) {
        noCommentsMessage.remove();
    }
    
    const commentHtml = createCommentHtml(comment);
    container.insertAdjacentHTML('afterbegin', commentHtml);
}

// 创建评论HTML
function createCommentHtml(comment) {
    const date = new Date(comment.createTime);
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    
    return `
        <div class="messageBox">
            <p class="name clear">
                <span class="fl">${comment.username}</span>
                <span class="fr">${formattedDate}</span>
            </p>
            <p>${comment.content}</p>
        </div>
    `;
}

// 渲染分页
function renderPagination(pagination) {
    const pager = document.getElementById('commentPager');
    if (!pager) return;
    
    const ul = pager.querySelector('ul');
    ul.innerHTML = '';
    
    // 如果只有一页，不显示分页
    if (pagination.pages <= 1) {
        pager.style.display = 'none';
        return;
    }
    
    pager.style.display = 'block';
    
    // 上一页
    const prevLi = document.createElement('li');
    prevLi.className = 'previous';
    prevLi.innerHTML = `<a href="javascript:void(0)" ${pagination.page > 1 ? `onclick="loadComments(${pagination.page - 1})"` : 'class="disabled"'}>上一页</a>`;
    ul.appendChild(prevLi);
    
    // 页码
    let startPage = Math.max(1, pagination.page - 2);
    let endPage = Math.min(pagination.pages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.innerHTML = `<a href="javascript:void(0)" onclick="loadComments(${i})" ${i === pagination.page ? 'class="active"' : ''}>${i}</a>`;
        ul.appendChild(pageLi);
    }
    
    // 下一页
    const nextLi = document.createElement('li');
    nextLi.className = 'next';
    nextLi.innerHTML = `<a href="javascript:void(0)" ${pagination.page < pagination.pages ? `onclick="loadComments(${pagination.page + 1})"` : 'class="disabled"'}>下一页</a>`;
    ul.appendChild(nextLi);
}

// 更新评论计数
function updateCommentCount(count) {
    const commentCount = document.getElementById('commentCount');
    const messageCount = document.getElementById('messageCount');
    const totalComments = document.getElementById('totalComments');
    
    if (commentCount) commentCount.textContent = count;
    if (messageCount) messageCount.textContent = count;
    if (totalComments) totalComments.textContent = count;
}

// 显示评论状态消息
function showCommentStatus(message, type) {
    const statusDiv = document.getElementById('commentStatus');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // 根据类型设置样式
    if (type === 'success') {
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
        statusDiv.style.borderColor = '#c3e6cb';
    } else if (type === 'error') {
        statusDiv.style.backgroundColor = '#f8d7da';
        statusDiv.style.color = '#721c24';
        statusDiv.style.borderColor = '#f5c6cb';
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

// 显示新评论提醒
function showNewCommentAlert() {
    const container = document.getElementById('commentContainer');
    if (!container) return;
    
    const alert = document.createElement('div');
    alert.className = 'alert alert-info';
    alert.style.padding = '10px';
    alert.style.marginBottom = '10px';
    alert.style.backgroundColor = '#d9edf7';
    alert.style.borderColor = '#bce8f1';
    alert.style.color = '#31708f';
    alert.style.borderRadius = '4px';
    alert.style.textAlign = 'center';
    alert.innerHTML = '有新评论发布，<a href="javascript:void(0)" onclick="loadComments(1)">点击查看</a>';
    
    container.insertAdjacentElement('beforebegin', alert);
    
    // 5秒后自动移除提醒
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// 显示登录模态框
function showLoginModal() {
    // 检查是否已存在模态框
    let modal = document.getElementById('loginModal');
    
    // 如果不存在，创建一个新的模态框
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.width = '300px';
        
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.float = 'right';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '20px';
        closeButton.onclick = function() {
            modal.style.display = 'none';
        };
        
        const title = document.createElement('h3');
        title.textContent = '登录';
        title.style.marginBottom = '20px';
        
        const form = document.createElement('form');
        form.action = '/api/user/login';
        form.method = 'post';
        
        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = '用户名：';
        usernameLabel.style.display = 'block';
        usernameLabel.style.marginBottom = '5px';
        
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.name = 'username';
        usernameInput.required = true;
        usernameInput.style.width = '100%';
        usernameInput.style.padding = '5px';
        usernameInput.style.marginBottom = '15px';
        
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = '密码：';
        passwordLabel.style.display = 'block';
        passwordLabel.style.marginBottom = '5px';
        
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.name = 'password';
        passwordInput.required = true;
        passwordInput.style.width = '100%';
        passwordInput.style.padding = '5px';
        passwordInput.style.marginBottom = '15px';
        
        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = '登录';
        submitButton.style.backgroundColor = '#337ab7';
        submitButton.style.color = '#fff';
        submitButton.style.border = 'none';
        submitButton.style.padding = '8px 15px';
        submitButton.style.borderRadius = '3px';
        submitButton.style.cursor = 'pointer';
        
        const registerLink = document.createElement('a');
        registerLink.href = '/register';
        registerLink.textContent = '没有账号？点击注册';
        registerLink.style.display = 'block';
        registerLink.style.marginTop = '15px';
        registerLink.style.textAlign = 'center';
        
        form.appendChild(usernameLabel);
        form.appendChild(usernameInput);
        form.appendChild(passwordLabel);
        form.appendChild(passwordInput);
        form.appendChild(submitButton);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(form);
        modalContent.appendChild(registerLink);
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // 添加表单提交事件处理
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formData = {
                username: usernameInput.value,
                password: passwordInput.value
            };
            
            fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.code === 0) {
                    // 登录成功，刷新页面
                    window.location.reload();
                } else {
                    // 登录失败，显示错误信息
                    alert(data.msg || data.message || '登录失败');
                }
            })
            .catch(error => {
                console.error('登录请求失败:', error);
                alert('登录请求失败，请稍后再试');
            });
        });
    }
    
    // 显示模态框
    modal.style.display = 'flex';
}