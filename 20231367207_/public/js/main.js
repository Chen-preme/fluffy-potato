const userId = window.currentUserId || ''; // 当前登录用户ID，后端模板传过来

function loadComments() {
  $.get(`/api/comment/list/${articleId}`, function (res) {
    if (res.code === 0) {
      const list = res.comments;
      $('#messageCount').text(list.length);

      let html = '';
      list.forEach(c => {
        html += `
        <div class="messageBox" data-id="${c._id}">
          <p class="name clear">
            <span class="fl">${c.username}</span>
            <span class="fr">${formatTime(c.createTime)}</span>
          </p>
          <p class="content">${c.content}</p>
          ${c.userId === userId ? `
          <p class="textRight">
            <button class="editBtn">编辑</button>
            <button class="deleteBtn">删除</button>
          </p>` : ''}
        </div>`;
      });

      $('#commentList').html(html);
    }
  });
}

// 编辑按钮事件
$('#commentList').on('click', '.editBtn', function () {
  const $box = $(this).closest('.messageBox');
  const id = $box.data('id');
  const oldContent = $box.find('.content').text();

  const newContent = prompt('修改评论：', oldContent);
  if (newContent && newContent !== oldContent) {
    $.post(`/api/comment/update/${id}`, { content: newContent }, function (res) {
      if (res.code === 0) {
        loadComments();
      } else {
        alert(res.msg);
      }
    });
  }
});

// 删除按钮事件
$('#commentList').on('click', '.deleteBtn', function () {
  const id = $(this).closest('.messageBox').data('id');
  if (confirm('确认删除该评论？')) {
    $.post(`/api/comment/delete/${id}`, function (res) {
      if (res.code === 0) {
        loadComments();
      } else {
        alert(res.msg);
      }
    });
  }
});
