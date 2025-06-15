// 邮件服务配置
// 请根据您的邮件服务提供商配置以下信息

module.exports = {
    // SMTP服务器配置
    smtp: {
        host: 'smtp.gmail.com', // SMTP服务器地址，例如：smtp.gmail.com, smtp.qq.com, smtp.163.com
        port: 587, // SMTP端口，通常为587（TLS）或465（SSL）
        secure: false, // 如果端口为465，设置为true；如果端口为587，设置为false
        auth: {
            user: 'your-email@gmail.com', // 您的邮箱地址
            pass: 'your-app-password' // 您的邮箱密码或应用专用密码
        }
    },
    
    // 发件人信息
    from: {
        name: '博客系统', // 发件人名称
        address: 'your-email@gmail.com' // 发件人邮箱地址（通常与auth.user相同）
    },
    
    // 邮件模板配置
    templates: {
        // 用户间邮件模板
        userToUser: {
            subject: '[博客系统] 来自 {{fromUsername}} 的消息：{{subject}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">您收到一封新邮件</h2>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>发件人：</strong> {{fromUsername}}</p>
                        <p><strong>主题：</strong> {{subject}}</p>
                        <p><strong>发送时间：</strong> {{sendTime}}</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">邮件内容：</h3>
                        <div style="white-space: pre-wrap; line-height: 1.6;">{{content}}</div>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
                        <p>此邮件由博客系统自动发送，请勿直接回复此邮件。</p>
                        <p>如需回复，请登录博客系统使用邮件功能。</p>
                    </div>
                </div>
            `
        },
        
        // 系统通知邮件模板
        systemNotification: {
            subject: '[博客系统] 系统通知：{{subject}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">系统通知</h2>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>通知时间：</strong> {{sendTime}}</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <div style="white-space: pre-wrap; line-height: 1.6;">{{content}}</div>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
                        <p>此邮件由博客系统自动发送，请勿回复。</p>
                    </div>
                </div>
            `
        }
    }
};

/*
配置说明：

1. Gmail配置示例：
   host: 'smtp.gmail.com'
   port: 587
   secure: false
   user: 'your-email@gmail.com'
   pass: '您的应用专用密码' (需要在Gmail中生成)

2. QQ邮箱配置示例：
   host: 'smtp.qq.com'
   port: 587
   secure: false
   user: 'your-email@qq.com'
   pass: '您的授权码' (需要在QQ邮箱中生成)

3. 163邮箱配置示例：
   host: 'smtp.163.com'
   port: 587
   secure: false
   user: 'your-email@163.com'
   pass: '您的授权码' (需要在163邮箱中生成)

4. 企业邮箱配置：
   请联系您的邮箱服务提供商获取SMTP配置信息

注意事项：
- 大多数邮箱服务商需要开启SMTP服务并生成应用专用密码
- 请确保防火墙允许SMTP端口的出站连接
- 建议使用环境变量存储敏感信息，避免将密码直接写在代码中
*/