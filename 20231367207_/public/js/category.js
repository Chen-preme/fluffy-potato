$(document).ready(function() {
    // 添加分类
    $('#saveCategory').on('click', function() {
        const categoryName = $('#categoryName').val().trim();
        const categoryDescription = $('#categoryDescription').val().trim();
        
        // 验证分类名称
        if (!categoryName) {
            $('#categoryName').addClass('is-invalid');
            return;
        }
        
        // 发送添加分类请求
        $.ajax({
            url: '/admin/category/add',
            type: 'POST',
            data: {
                name: categoryName,
                description: categoryDescription
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#addCategoryModal').modal('hide');
                    // 重新加载页面显示新分类
                    window.location.reload();
                } else {
                    alert('添加分类失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '添加分类失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 编辑分类 - 打开模态框时填充数据
    $('.edit-category').on('click', function() {
        const categoryId = $(this).data('id');
        const categoryName = $(this).data('name');
        const categoryDescription = $(this).data('description');
        
        $('#editCategoryId').val(categoryId);
        $('#editCategoryName').val(categoryName);
        $('#editCategoryDescription').val(categoryDescription);
    });
    
    // 更新分类
    $('#updateCategory').on('click', function() {
        const categoryId = $('#editCategoryId').val();
        const categoryName = $('#editCategoryName').val().trim();
        const categoryDescription = $('#editCategoryDescription').val().trim();
        
        // 验证分类名称
        if (!categoryName) {
            $('#editCategoryName').addClass('is-invalid');
            return;
        }
        
        // 发送更新分类请求
        $.ajax({
            url: '/admin/category/update',
            type: 'POST',
            data: {
                id: categoryId,
                name: categoryName,
                description: categoryDescription
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#editCategoryModal').modal('hide');
                    // 重新加载页面显示更新后的分类
                    window.location.reload();
                } else {
                    alert('更新分类失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '更新分类失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 删除分类 - 打开模态框时填充数据
    $('.delete-category').on('click', function() {
        const categoryId = $(this).data('id');
        const categoryName = $(this).data('name');
        
        $('#deleteCategoryId').val(categoryId);
        $('#deleteCategoryName').text(categoryName);
    });
    
    // 确认删除分类
    $('#confirmDeleteCategory').on('click', function() {
        const categoryId = $('#deleteCategoryId').val();
        
        // 发送删除分类请求
        $.ajax({
            url: '/admin/category/delete',
            type: 'POST',
            data: {
                id: categoryId
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#deleteCategoryModal').modal('hide');
                    // 重新加载页面
                    window.location.reload();
                } else {
                    alert('删除分类失败: ' + response.message);
                }
            },
            error: function(xhr) {
                let errorMessage = '删除分类失败';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                }
                alert(errorMessage);
            }
        });
    });
    
    // 分类上移
    $('.move-up').on('click', function() {
        const categoryId = $(this).data('id');
        changeOrder(categoryId, 'up');
    });
    
    // 分类下移
    $('.move-down').on('click', function() {
        const categoryId = $(this).data('id');
        changeOrder(categoryId, 'down');
    });
    
    // 改变分类排序
    function changeOrder(categoryId, direction) {
        $.ajax({
            url: '/admin/category/change-order',
            type: 'POST',
            data: {
                id: categoryId,
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
    $('#categoryName').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    $('#editCategoryName').on('input', function() {
        $(this).removeClass('is-invalid');
    });
    
    // 模态框关闭时重置表单
    $('#addCategoryModal').on('hidden.bs.modal', function() {
        $('#categoryName').val('').removeClass('is-invalid');
        $('#categoryDescription').val('');
    });
    
    $('#editCategoryModal').on('hidden.bs.modal', function() {
        $('#editCategoryName').removeClass('is-invalid');
    });
});