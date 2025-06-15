$(document).ready(function() {
    let currentPage = 1;
    const limit = 10;
    
    // 页面加载时获取收藏列表
    loadFavorites(1);
    
    // 加载收藏列表
    function loadFavorites(page) {
        currentPage = page;
        
        fetch(`/api/favorites?page=${page}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                if (data.code === 0) {
                    renderFavorites(data.data.favorites);
                    renderPagination(data.data.pagination);
                } else if (data.code === 1) {
                    // 未登录
                    showLoginRequired();
                } else {
                    showError('加载收藏列表失败: ' + data.msg);
                }
            })
            .catch(error => {
                console.error('加载收藏列表失败:', error);
                showError('网络错误，请稍后重试');
            });
    }
    
    // 渲染收藏列表
    function renderFavorites(favorites) {
        const container = $('#favoriteContainer');
        
        if (!favorites || favorites.length === 0) {
            container.html(`
                <div class="empty-favorites">
                    <i class="fa fa-heart-o"></i>
                    <h3>暂无收藏</h3>
                    <p>您还没有收藏任何文章，快去<a href="/">首页</a>看看吧！</p>
                </div>
            `);
            return;
        }
        
        let html = '';
        favorites.forEach(favorite => {
            const article = favorite.articleId;
            if (!article) return; // 跳过已删除的文章
            
            const createTime = new Date(favorite.createTime).toLocaleString('zh-CN');
            const articleCreateTime = new Date(article.createTime).toLocaleString('zh-CN');
            const content = article.content.length > 200 ? 
                article.content.substring(0, 200) + '...' : article.content;
            
            html += `
                <div class="favorite-item" data-article-id="${article._id}">
                    <div class="favorite-title">
                        <a href="/detail?id=${article._id}" target="_blank">${article.title}</a>
                    </div>
                    <div class="favorite-meta">
                        <span><i class="fa fa-user"></i> ${article.author ? article.author.username : '未知作者'}</span>
                        <span class="ms-3"><i class="fa fa-folder"></i> ${article.category ? article.category.name : '未分类'}</span>
                        <span class="ms-3"><i class="fa fa-clock-o"></i> 发布于 ${articleCreateTime}</span>
                        <span class="ms-3"><i class="fa fa-heart"></i> 收藏于 ${createTime}</span>
                    </div>
                    <div class="favorite-content">
                        ${content.replace(/<[^>]*>/g, '')}
                    </div>
                    <div class="favorite-actions">
                        <div>
                            <span class="text-muted">阅读: ${article.views || 0}</span>
                        </div>
                        <button class="btn-unfavorite" onclick="removeFavorite('${article._id}')">
                            <i class="fa fa-heart-o"></i> 取消收藏
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.html(html);
    }
    
    // 渲染分页
    function renderPagination(pagination) {
        const pager = $('#favoritePager');
        
        if (pagination.pages <= 1) {
            pager.html('');
            return;
        }
        
        let html = '<nav><ul class="pagination justify-content-center">';
        
        // 上一页
        if (pagination.hasPrev) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="loadFavorites(${pagination.page - 1})">上一页</a></li>`;
        }
        
        // 页码
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="loadFavorites(1)">1</a></li>`;
            if (startPage > 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            html += `<li class="page-item ${activeClass}"><a class="page-link" href="#" onclick="loadFavorites(${i})">${i}</a></li>`;
        }
        
        if (endPage < pagination.pages) {
            if (endPage < pagination.pages - 1) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="loadFavorites(${pagination.pages})">${pagination.pages}</a></li>`;
        }
        
        // 下一页
        if (pagination.hasNext) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="loadFavorites(${pagination.page + 1})">下一页</a></li>`;
        }
        
        html += '</ul></nav>';
        pager.html(html);
    }
    
    // 显示未登录提示
    function showLoginRequired() {
        $('#favoriteContainer').html(`
            <div class="empty-favorites">
                <i class="fa fa-user-o"></i>
                <h3>请先登录</h3>
                <p>您需要登录后才能查看收藏列表</p>
                <button class="btn btn-primary" onclick="showLoginModal()">立即登录</button>
            </div>
        `);
    }
    
    // 显示错误信息
    function showError(message) {
        $('#favoriteContainer').html(`
            <div class="empty-favorites">
                <i class="fa fa-exclamation-triangle"></i>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadFavorites(${currentPage})">重新加载</button>
            </div>
        `);
    }
    
    // 显示状态消息
    function showStatus(message, type = 'success') {
        const statusDiv = $('#favoriteStatus');
        statusDiv.removeClass('alert-success alert-danger alert-warning')
                 .addClass(`alert-${type}`)
                 .text(message)
                 .show();
        
        setTimeout(() => {
            statusDiv.fadeOut();
        }, 3000);
    }
    
    // 取消收藏函数（全局函数）
    window.removeFavorite = function(articleId) {
        if (!confirm('确定要取消收藏这篇文章吗？')) {
            return;
        }
        
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
                showStatus('取消收藏成功', 'success');
                // 从页面中移除该项
                $(`.favorite-item[data-article-id="${articleId}"]`).fadeOut(300, function() {
                    $(this).remove();
                    // 如果当前页没有内容了，重新加载
                    if ($('.favorite-item').length === 0) {
                        loadFavorites(Math.max(1, currentPage - 1));
                    }
                });
            } else {
                showStatus('取消收藏失败: ' + data.msg, 'danger');
            }
        })
        .catch(error => {
            console.error('取消收藏失败:', error);
            showStatus('网络错误，请稍后重试', 'danger');
        });
    };
    
    // 全局加载收藏列表函数
    window.loadFavorites = loadFavorites;
});