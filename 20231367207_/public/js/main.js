/**
 * 后台管理系统的主要JavaScript功能
 */

// 当文档加载完成后执行
$(document).ready(function() {
    // 初始化用户管理页面功能
    initUserManagement();
});

/**
 * 初始化用户管理页面的功能
 */
function initUserManagement() {
    // 只在用户管理页面执行
    if (window.location.pathname.includes('/admin/users')) {
        // 重置密码功能
        initPasswordReset();
        
        // 冻结/解冻用户功能
        initUserFreeze();
    }
}

/**
 * 初始化密码重置功能
 */
function initPasswordReset() {
    // 点击重置密码按钮时，填充模态框数据
    $('.edit-user').on('click', function() {
        const userId = $(this).data('id');
        const username = $(this).closest('tr').find('td:nth-child(2)').text();
        
        $('#editUserId').val(userId);
        $('#editUsername').val(username);
        $('#newPassword').val('');
        $('#confirmPassword').val('');
    });
    
    // 点击保存按钮时，提交重置密码请求
    $('#savePasswordBtn').on('click', function() {
        const userId = $('#editUserId').val();
        const newPassword = $('#newPassword').val();
        const confirmPassword = $('#confirmPassword').val();
        
        // 验证密码
        if (!newPassword) {
            alert('请输入新密码');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        // 发送请求重置密码
        $.ajax({
            url: '/admin/user/reset-password',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ userId, newPassword }),
            success: function(data) {
                if (data.success) {
                    alert(data.message);
                    // 关闭模态框
                    $('#editUserModal').modal('hide');
                } else {
                    alert(data.message);
                }
            },
            error: function(error) {
                console.error('重置密码出错:', error);
                alert('重置密码失败，请重试');
            }
        });
    });
}

/**
 * 初始化用户冻结/解冻功能
 */
function initUserFreeze() {
    // 冻结/解冻用户按钮点击事件
    $('.freeze-user, .unfreeze-user').on('click', function() {
        const userId = $(this).data('id');
        const action = $(this).hasClass('freeze-user') ? '冻结' : '解冻';
        
        if (confirm(`确定要${action}此用户吗？`)) {
            // 发送请求切换用户状态
            $.ajax({
                url: '/admin/user/toggle-freeze',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId }),
                success: function(data) {
                    if (data.success) {
                        alert(data.message);
                        // 刷新页面以显示更新后的状态
                        location.reload();
                    } else {
                        alert(data.message);
                    }
                },
                error: function(error) {
                    console.error('操作失败:', error);
                    alert('操作失败，请重试');
                }
            });
        }
    });
}