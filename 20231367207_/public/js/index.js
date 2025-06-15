// 首页文章评论计数处理
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有文章ID
    const articleElements = document.querySelectorAll('.listBox');
    const articleIds = [];
    
    articleElements.forEach(element => {
        // 从评论计数元素的ID中提取文章ID
        const commentElement = element.querySelector('[id^="comment-"]');
        if (commentElement) {
            const articleId = commentElement.id.replace('comment-', '');
            articleIds.push(articleId);
        }
    });
    
    if (articleIds.length === 0) return;
    
    // 批量获取文章评论数
    fetch(`/api/comments/count?articleIds=${articleIds.join(',')}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                const counts = data.data;
                
                // 更新每篇文章的评论数
                for (const articleId in counts) {
                    const commentElement = document.getElementById(`comment-${articleId}`);
                    if (commentElement) {
                        commentElement.textContent = counts[articleId];
                    }
                }
            }
        })
        .catch(error => {
            console.error('获取评论计数失败:', error);
        });
});