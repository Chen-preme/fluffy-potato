$(function() {
    // 添加文章
    $('#saveArticle').click(function() {
        // 获取表单数据
        const title = $('#articleTitle').val().trim();
        const categoryId = $('#articleCategory').val();
        const content = $('#articleContent').val().trim();
        const isTop = $('#articleIsTop').prop('checked');
        const isPublic = $('#articleIsPublic').prop('checked');

        // 表单验证
        let isValid = true;
        if (!title) {
            $('#articleTitle').addClass('is-invalid');
            isValid = false;
        }
        if (!categoryId) {
            $('#articleCategory').addClass('is-invalid');
            isValid = false;
        }
        if (!content) {
            $('#articleContent').addClass('is-invalid');
            isValid = false;
        }

        if (!isValid) return;

        // 发送AJAX请求
        $.ajax({
            url: '/admin/article/add',
            type: 'POST',
            data: {
                title,
                categoryId,
                content,
                isTop,
                isPublic
            },
            success: function(res) {
                if (res.code === 0) {
                    // 添加成功
                    $('#addArticleModal').modal('hide');
                    alert('文章添加成功！');
                    window.location.reload();
                } else {
                    // 添加失败
                    alert('文章添加失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 编辑文章 - 点击编辑按钮时获取文章信息
    $('.edit-article').click(function() {
        const articleId = $(this).data('id');
        
        // 发送AJAX请求获取文章详情
        $.ajax({
            url: '/admin/article/info',
            type: 'GET',
            data: { id: articleId },
            success: function(res) {
                if (res.code === 0) {
                    // 填充表单
                    const article = res.data;
                    $('#editArticleId').val(article._id);
                    $('#editArticleTitle').val(article.title);
                    $('#editArticleCategory').val(article.category ? article.category._id : '');
                    $('#editArticleContent').val(article.content);
                    $('#editArticleIsTop').prop('checked', article.isTop);
                    $('#editArticleIsPublic').prop('checked', article.isPublic);
                } else {
                    alert('获取文章信息失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 更新文章
    $('#updateArticle').click(function() {
        // 获取表单数据
        const id = $('#editArticleId').val();
        const title = $('#editArticleTitle').val().trim();
        const categoryId = $('#editArticleCategory').val();
        const content = $('#editArticleContent').val().trim();
        const isTop = $('#editArticleIsTop').prop('checked');
        const isPublic = $('#editArticleIsPublic').prop('checked');

        // 表单验证
        let isValid = true;
        if (!title) {
            $('#editArticleTitle').addClass('is-invalid');
            isValid = false;
        }
        if (!categoryId) {
            $('#editArticleCategory').addClass('is-invalid');
            isValid = false;
        }
        if (!content) {
            $('#editArticleContent').addClass('is-invalid');
            isValid = false;
        }

        if (!isValid) return;

        // 发送AJAX请求
        $.ajax({
            url: '/admin/article/update',
            type: 'POST',
            data: {
                id,
                title,
                categoryId,
                content,
                isTop,
                isPublic
            },
            success: function(res) {
                if (res.code === 0) {
                    // 更新成功
                    $('#editArticleModal').modal('hide');
                    alert('文章更新成功！');
                    window.location.reload();
                } else {
                    // 更新失败
                    alert('文章更新失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 删除文章 - 点击删除按钮时设置文章ID和标题
    $('.delete-article').click(function() {
        const articleId = $(this).data('id');
        const articleTitle = $(this).data('title');
        
        $('#deleteArticleId').val(articleId);
        $('#deleteArticleTitle').text(articleTitle);
    });

    // 确认删除文章
    $('#confirmDeleteArticle').click(function() {
        const articleId = $('#deleteArticleId').val();
        
        // 发送AJAX请求
        $.ajax({
            url: '/admin/article/delete',
            type: 'POST',
            data: { id: articleId },
            success: function(res) {
                if (res.code === 0) {
                    // 删除成功
                    $('#deleteArticleModal').modal('hide');
                    alert('文章删除成功！');
                    window.location.reload();
                } else {
                    // 删除失败
                    alert('文章删除失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 切换文章置顶状态
    $('.toggle-top').click(function() {
        const articleId = $(this).data('id');
        const isTop = $(this).data('is-top');
        
        // 发送AJAX请求
        $.ajax({
            url: '/admin/article/toggle-top',
            type: 'POST',
            data: { 
                id: articleId,
                isTop: !isTop // 切换状态
            },
            success: function(res) {
                if (res.code === 0) {
                    // 切换成功
                    alert(isTop ? '取消置顶成功！' : '置顶成功！');
                    window.location.reload();
                } else {
                    // 切换失败
                    alert('操作失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 切换文章公开状态
    $('.toggle-public').click(function() {
        const articleId = $(this).data('id');
        const isPublic = $(this).data('is-public');
        
        // 发送AJAX请求
        $.ajax({
            url: '/admin/article/toggle-public',
            type: 'POST',
            data: { 
                id: articleId,
                isPublic: !isPublic // 切换状态
            },
            success: function(res) {
                if (res.code === 0) {
                    // 切换成功
                    alert(isPublic ? '设为私密成功！' : '设为公开成功！');
                    window.location.reload();
                } else {
                    // 切换失败
                    alert('操作失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });

    // 输入时移除错误提示
    $('#articleTitle, #articleCategory, #articleContent, #editArticleTitle, #editArticleCategory, #editArticleContent').on('input', function() {
        $(this).removeClass('is-invalid');
    });

    // 模态框关闭时重置表单
    $('#addArticleModal').on('hidden.bs.modal', function() {
        $('#addArticleForm')[0].reset();
        $('#articleTitle, #articleCategory, #articleContent').removeClass('is-invalid');
    });

    $('#editArticleModal').on('hidden.bs.modal', function() {
        $('#editArticleForm')[0].reset();
        $('#editArticleTitle, #editArticleCategory, #editArticleContent').removeClass('is-invalid');
    });
});