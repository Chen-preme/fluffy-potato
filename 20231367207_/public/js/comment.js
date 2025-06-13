$(function() {
    // 删除评论 - 点击删除按钮时设置评论ID
    $('.delete-comment').click(function() {
        const commentId = $(this).data('id');
        $('#deleteCommentId').val(commentId);
    });

    // 确认删除评论
    $('#confirmDeleteComment').click(function() {
        const commentId = $('#deleteCommentId').val();
        
        // 发送AJAX请求
        $.ajax({
            url: '/admin/comment/delete',
            type: 'POST',
            data: { id: commentId },
            success: function(res) {
                if (res.code === 0) {
                    // 删除成功
                    $('#deleteCommentModal').modal('hide');
                    alert('评论删除成功！');
                    window.location.reload();
                } else {
                    // 删除失败
                    alert('评论删除失败：' + res.message);
                }
            },
            error: function(err) {
                alert('请求失败，请稍后重试！');
                console.error(err);
            }
        });
    });
});