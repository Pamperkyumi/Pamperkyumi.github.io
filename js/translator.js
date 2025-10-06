// 翻译功能实现
class BlogTranslator {
  constructor() {
    this.functionUrl = 'https://supabase.com/dashboard/project/gqfserpkchbobfigunzc/functions';
    this.isTranslating = false;
  }

  async translateText(text, targetLang = 'en') {
    if (this.isTranslating) {
      console.log('Translation in progress, please wait...');
      return null;
    }

    this.isTranslating = true;
    
    try {
      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_lang: targetLang
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.translation;
    } catch (error) {
      console.error('Translation failed:', error);
      // 在这里可以显示错误信息给用户
      return null;
    } finally {
      this.isTranslating = false;
    }
  }

  // 翻译整个文章内容
  async translateArticle(targetLang = 'en') {
    const articleElement = document.querySelector('article, .post-content, .blog-content');
    if (!articleElement) {
      console.error('No article content found');
      return;
    }

    // 显示加载状态
    const originalText = articleElement.textContent;
    articleElement.innerHTML = '<p style="text-align: center; color: #666;">翻译中...</p>';

    const translatedText = await this.translateText(originalText, targetLang);
    
    if (translatedText) {
      articleElement.textContent = translatedText;
    } else {
      // 恢复原文
      articleElement.textContent = originalText;
      alert('翻译失败，请稍后重试');
    }
  }
}

// 使用示例
const translator = new BlogTranslator();

// 添加翻译按钮到页面
function addTranslateButton() {
  const translateBtn = document.createElement('button');
  translateBtn.textContent = '🌐 翻译成英文';
  translateBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
  `;
  
  translateBtn.addEventListener('click', () => {
    translator.translateArticle('en');
  });
  
  document.body.appendChild(translateBtn);
}

// 页面加载完成后添加按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTranslateButton);
} else {
  addTranslateButton();
}