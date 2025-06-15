const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

class EmailService {
    constructor() {
        // 创建邮件传输器
        this.transporter = nodemailer.createTransport(emailConfig.smtp);
        this.config = emailConfig;
    }

    // 发送邮件的通用方法
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: options.from || process.env.EMAIL_USER || 'your-email@gmail.com',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('邮件发送成功:', result.messageId);
            return {
                success: true,
                messageId: result.messageId,
                message: '邮件发送成功'
            };
        } catch (error) {
            console.error('邮件发送失败:', error);
            return {
                success: false,
                error: error.message,
                message: '邮件发送失败'
            };
        }
    }

    /**
     * 发送用户间邮件
     * @param {Object} fromUser - 发送者用户对象
     * @param {string} toEmail - 接收者邮箱
     * @param {string} subject - 邮件主题
     * @param {string} content - 邮件内容
     * @returns {Promise<Object>} 发送结果
     */
    async sendUserToUserEmail(fromUser, toEmail, subject, content) {
        try {
            const template = this.config.templates.userToUser;
            const sendTime = new Date().toLocaleString('zh-CN');
            
            // 替换模板变量
            const emailSubject = template.subject
                .replace('{{fromUsername}}', fromUser.username)
                .replace('{{subject}}', subject);
                
            const emailHtml = template.html
                .replace(/{{fromUsername}}/g, fromUser.username)
                .replace(/{{subject}}/g, subject)
                .replace(/{{sendTime}}/g, sendTime)
                .replace(/{{content}}/g, content);

            const mailOptions = {
                from: `"${this.config.from.name}" <${this.config.from.address}>`,
                to: toEmail,
                subject: emailSubject,
                html: emailHtml
            };

            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                message: '邮件发送成功'
            };
        } catch (error) {
            console.error('发送用户邮件失败:', error);
            return {
                success: false,
                message: error.message || '邮件发送失败'
            };
        }
    }

    /**
     * 发送系统通知邮件
     * @param {string} toEmail - 接收者邮箱
     * @param {string} subject - 通知主题
     * @param {string} content - 通知内容
     * @returns {Promise<Object>} 发送结果
     */
    async sendSystemNotification(toEmail, subject, content) {
        try {
            const template = this.config.templates.systemNotification;
            const sendTime = new Date().toLocaleString('zh-CN');
            
            // 替换模板变量
            const emailSubject = template.subject
                .replace('{{subject}}', subject);
                
            const emailHtml = template.html
                .replace(/{{subject}}/g, subject)
                .replace(/{{sendTime}}/g, sendTime)
                .replace(/{{content}}/g, content);

            const mailOptions = {
                from: `"${this.config.from.name}" <${this.config.from.address}>`,
                to: toEmail,
                subject: emailSubject,
                html: emailHtml
            };

            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                message: '系统通知发送成功'
            };
        } catch (error) {
            console.error('发送系统通知失败:', error);
            return {
                success: false,
                message: error.message || '系统通知发送失败'
            };
        }
    }

    // 验证邮件地址格式
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = new EmailService();