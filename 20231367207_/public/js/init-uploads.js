// 初始化上传功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化评论图片上传
    if (typeof CommentImageUploader !== 'undefined') {
        window.commentImageUploader = new CommentImageUploader();
        console.log('评论图片上传功能已初始化');
    }
    
    // 初始化邮件附件上传
    if (typeof EmailAttachmentUploader !== 'undefined') {
        window.emailAttachmentUploader = new EmailAttachmentUploader();
        console.log('邮件附件上传功能已初始化');
    }
});