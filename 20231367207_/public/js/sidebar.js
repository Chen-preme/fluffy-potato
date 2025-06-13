$(function(){
  const $loginBox = $('#loginBox');
  const $registerBox = $('#registerBox');
  const $userInfo = $('#userInfo');
  const $changePasswordBox = $('#changePasswordBox');

     //刷新状态维持
    //  $.get('/api/user/info', function (res) {
    //   if (res.code === 0) {
    //     // 已登录
    //     $('#loginBox').hide();
    //     $('#userInfo').show();
    //     $('#userName').text(res.user.username);
    //   } else {
    //     // 未登录
    //     $('#loginBox').show();
    //     $('#userInfo').hide();
    //   }
    // });
    
  // 刷新时验证是否登录
// $.get('/api/user/info', function (res) {
//   if (res.code === 0) {
//     $('#userInfo').show();
//     $('#loginBox').hide();
//     $('#userName').text(res.user.username);
//   } else {
//     $('#userInfo').hide();
//     $('#loginBox').show();
//   }
// });

  //切换到注册
  $loginBox.find('a').on('click', ()=>{
      $registerBox.show();
      $loginBox.hide();
  });

  $registerBox.find('a').on('click', ()=>{
      $loginBox.show();
      $registerBox.hide();
  });

  $registerBox.find('button').on('click',()=>{
      const username = $('#reg_username').val();
      const password = $('#reg_password').val();
      const repassword = $('#reg_repassword').val();
      console.log('注册表单数据:', { username, password, repassword }); // 调试用

      $.ajax({
          type: 'POST',
          url: '/api/user/register',
          contentType: 'application/json',
          data: JSON.stringify({ username, password, repassword }),
          dataType: 'json',
          success: (res) => {
            console.log(' 注册响应:', res);
            alert(res.msg);
          },
          error: (xhr) => {
            console.error(' AJAX 失败:', xhr.status, xhr.responseText);
          }
        });
      });

  //登录
  $loginBox.find('button').on('click', () => {
      $.ajax({
        type: 'POST',
        url: '/api/user/login',
        contentType: 'application/json', // 告诉服务器发的是 JSON
        data: JSON.stringify({            //  必须手动转换成 JSON 字符串
          username: $('#username').val(),
          password: $('#password').val()
        }),
        dataType: 'json',
        success: (result) => {
          $loginBox.find('.colWarning').html(result.msg); // result.message → result.msg
    
          if (result.code === 0) {
            
            setTimeout(() => {
              window.location.reload();
              // $loginBox.hide();
              // $userInfo.show(); 
            }, 1000); // 
          }
        }
      })
    });
    
 // 退出按钮绑定
 $('#logoutBtn').on('click', function () {
  $.get('/api/user/logout', function (res) {
    if (res.code === 0) {
      alert(res.msg); // 可选提示：已退出
      location.reload(); // 刷新页面，重新进入未登录状态
    }
  });
});

// 修改密码链接点击事件
$('#changePasswordLink').on('click', function() {
  // 清空表单和消息
  $('#oldPassword').val('');
  $('#newPassword').val('');
  $('#confirmPassword').val('');
  $('#changePasswordMsg').html('');
  
  // 显示修改密码框
  $changePasswordBox.show();
});

// 修改密码按钮点击事件
$('#changePasswordBtn').on('click', function() {
  const oldPassword = $('#oldPassword').val();
  const newPassword = $('#newPassword').val();
  const confirmPassword = $('#confirmPassword').val();
  
  // 简单的前端验证
  if (!oldPassword || !newPassword || !confirmPassword) {
    $('#changePasswordMsg').html('所有密码字段都不能为空');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    $('#changePasswordMsg').html('新密码与确认密码不一致');
    return;
  }
  
  // 发送修改密码请求
  $.ajax({
    type: 'POST',
    url: '/api/user/change-password',
    contentType: 'application/json',
    data: JSON.stringify({
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    }),
    dataType: 'json',
    success: function(res) {
      $('#changePasswordMsg').html(res.msg);
      
      if (res.code === 0) {
        // 密码修改成功，3秒后隐藏修改密码框
        setTimeout(function() {
          $changePasswordBox.hide();
        }, 3000);
      }
    },
    error: function(xhr) {
      $('#changePasswordMsg').html('请求失败，请稍后再试');
      console.error('修改密码请求失败:', xhr.status, xhr.responseText);
    }
  });
});



});