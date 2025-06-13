$(document).ready(function() {
    // 添加友情链接
    $('#saveFriendlink').on('click', function() {
        const friendlinkName = $('#friendlinkName').val().trim();
        const friendlinkUrl = $('#friendlinkUrl').val().trim();
        const friendlinkDescription = $('#friendlinkDescription').val().trim();
        
        // 验证友情链接名称
        if (!friendlinkName) {
            $('#friendlinkName').addClass('is-invalid');
            return;
        }
        
        // 验证URL
        if (!friendlinkUrl) {
            $('#friendlinkUrl').addClass('is-invalid');
            return;
        }
        
        // 发送添加友情链接请求
        $.ajax({
            url: '/admin/friendlink/add',
            type: 'POST',
            data: {
                name: friendlinkName,
                url: friendlinkUrl,
                description: friendlinkDescription
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#addFriendlinkModal').modal('hide');
                    // 重新加载页面显示新友情链接
                    window.location.reload();
                } else {
                    alert('添加友情链接失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '添加友情链接失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 编辑友情链接 - 打开模态框时填充数据
    $('.edit-friendlink').on('click', function() {
        const friendlinkId = $(this).data('id');
        const friendlinkName = $(this).data('name');
        const friendlinkUrl = $(this).data('url');
        const friendlinkDescription = $(this).data('description');
        
        $('#editFriendlinkId').val(friendlinkId);
        $('#editFriendlinkName').val(friendlinkName);
        $('#editFriendlinkUrl').val(friendlinkUrl);
        $('#editFriendlinkDescription').val(friendlinkDescription);
    });
    
    // 更新友情链接
    $('#updateFriendlink').on('click', function() {
        const friendlinkId = $('#editFriendlinkId').val();
        const friendlinkName = $('#editFriendlinkName').val().trim();
        const friendlinkUrl = $('#editFriendlinkUrl').val().trim();
        const friendlinkDescription = $('#editFriendlinkDescription').val().trim();
        
        // 验证友情链接名称
        if (!friendlinkName) {
            $('#editFriendlinkName').addClass('is-invalid');
            return;
        }
        
        // 验证URL
        if (!friendlinkUrl) {
            $('#editFriendlinkUrl').addClass('is-invalid');
            return;
        }
        
        // 发送更新友情链接请求
        $.ajax({
            url: '/admin/friendlink/update',
            type: 'POST',
            data: {
                id: friendlinkId,
                name: friendlinkName,
                url: friendlinkUrl,
                description: friendlinkDescription
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#editFriendlinkModal').modal('hide');
                    // 重新加载页面显示更新后的友情链接
                    window.location.reload();
                } else {
                    alert('更新友情链接失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '更新友情链接失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 删除友情链接 - 打开模态框时填充数据
    $('.delete-friendlink').on('click', function() {
        const friendlinkId = $(this).data('id');
        const friendlinkName = $(this).data('name');
        
        $('#deleteFriendlinkId').val(friendlinkId);
        $('#deleteFriendlinkName').text(friendlinkName);
    });
    
    // 确认删除友情链接
    $('#confirmDeleteFriendlink').on('click', function() {
        const friendlinkId = $('#deleteFriendlinkId').val();
        
        // 发送删除友情链接请求
        $.ajax({
            url: '/admin/friendlink/delete',
            type: 'POST',
            data: {
                id: friendlinkId
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#deleteFriendlinkModal').modal('hide');
                    // 重新加载页面
                    window.location.reload();
                } else {
                    alert('删除友情链接失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '删除友情链接失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 友情链接上移
    $('.move-up').on('click', function() {
        const friendlinkId = $(this).data('id');
        changeOrder(friendlinkId, 'up');
    });
    
    // 友情链接下移
    $('.move-down').on('click', function() {
        const friendlinkId = $(this).data('id');
        changeOrder(friendlinkId, 'down');
    });
    
    // 改变友情链接排序
    function changeOrder(friendlinkId, direction) {
        $.ajax({
            url: '/admin/friendlink/change-order',
            type: 'POST',
            data: {
                id: friendlinkId,
                direction: direction
            },
            success: function(response) {
                if (response.success) {
                    // 重新加载页面显示新的排序
                    window.location.reload();
                } else {
                    alert('更改排序失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '更改排序失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    }
    
    // 表单验证 - 输入时移除错误提示
    $('#friendlinkName').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    $('#friendlinkUrl').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    $('#editFriendlinkName').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    $('#editFriendlinkUrl').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    // 模态框关闭时重置表单
    $('#addFriendlinkModal').on('hidden.bs.modal', function() {
        $('#friendlinkName').val('').removeClass('is-invalid');
        $('#friendlinkUrl').val('').removeClass('is-invalid');
        $('#friendlinkDescription').val('');
    });
    
    $('#editFriendlinkModal').on('hidden.bs.modal', function() {
        $('#editFriendlinkName').removeClass('is-invalid');
        $('#editFriendlinkUrl').removeClass('is-invalid');
    });
});