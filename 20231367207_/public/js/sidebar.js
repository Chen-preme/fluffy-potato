$(function(){
    const $loginBox = $('#loginBox');
    const $registerBox = $('#registerBox');
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
            type: 'post',
            url: '/api/user/register',
            contentType: 'application/json',
            data: JSON.stringify({
                username,
                password,
                repassword
            }),
            dataType: 'json',
            success: (result) => {
                console.log(result);
            }
        });
    });
});