$(function(){
  const $loginBox = $('#loginBox');
  const $registerBox = $('#registerBox');
  const $userInfo = $('#userInfo');

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
      const username = $('#username').val();
      const password = $('#password').val();
      const repassword = $('#repassword').val();
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



});