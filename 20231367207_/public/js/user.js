
$(document).ready(function() {
    // 编辑用户
    $('.edit-user').click(function() {
        const userId = $(this).data('id');
        // 这里应该通过AJAX获取用户信息并填充表单
        $.get('/api/user/' + userId, function(response) {
            if (response.code === 0) {
                const user = response.data;
                $('#editUserId').val(user._id);
                $('#editUsername').val(user.username);
                $('#editIsAdmin').prop('checked', user.isAdmin);
            }
        });
    });

    // 冻结用户
    $('.freeze-user').click(function() {
        const userId = $(this).data('id');
        $.post('/api/user/freeze/' + userId, function(response) {
            if (response.code === 0) {
                alert('用户已冻结');
                location.reload();
            } else {
                alert('操作失败：' + response.message);
            }
        });
    });

    // 解冻用户
    $('.unfreeze-user').click(function() {
        const userId = $(this).data('id');
        $.post('/api/user/unfreeze/' + userId, function(response) {
            if (response.code === 0) {
                alert('用户已解冻');
                location.reload();
            } else {
                alert('操作失败：' + response.message);
            }
        });
    });

    // 删除用户
    $('.delete-user').click(function() {
        const userId = $(this).data('id');
        $('#deleteUserId').val(userId);
    });

    // 确认删除用户
    $('#confirmDeleteBtn').click(function() {
        const userId = $('#deleteUserId').val();
        $.ajax({
            url: '/api/user/' + userId,
            type: 'DELETE',
            success: function(response) {
                if (response.code === 0) {
                    alert('用户已删除');
                    location.reload();
                } else {
                    alert('删除失败：' + response.message);
                }
            }
        });
    });

    // 添加用户
    $('#saveUserBtn').click(function() {
        const username = $('#username').val();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();
        const isAdmin = $('#isAdmin').is(':checked');

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        $.post('/api/user/register', {
            username: username,
            password: password,
            isAdmin: isAdmin
        }, function(response) {
            if (response.code === 0) {
                alert('用户添加成功');
                $('#addUserModal').modal('hide');
                location.reload();
            } else {
                alert('添加失败：' + response.message);
            }
        });
    });

    // 更新用户
    $('#updateUserBtn').click(function() {
        const userId = $('#editUserId').val();
        const username = $('#editUsername').val();
        const password = $('#editPassword').val();
        const isAdmin = $('#editIsAdmin').is(':checked');

        const data = {
            username: username,
            isAdmin: isAdmin
        };

        if (password) {
            data.password = password;
        }

        $.ajax({
            url: '/api/user/' + userId,
            type: 'PUT',
            data: data,
            success: function(response) {
                if (response.code === 0) {
                    alert('用户更新成功');
                    $('#editUserModal').modal('hide');
                    location.reload();
                } else {
                    alert('更新失败：' + response.message);
                }
            }
        });
    });
});
