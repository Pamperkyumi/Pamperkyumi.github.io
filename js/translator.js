class BlogTranslator {
  constructor() {
    // 确保使用正确的函数 URL
    this.functionUrl = 'https://gqfserpkchbobfigunzc.supabase.co/functions/v1/blog-translator';
    this.isTranslating = false;
    this.currentLang = 'zh';
  }

  async translateText(text, targetLang = 'en') {
    if (this.isTranslating) {
      console.log('Translation in progress, please wait...');
      return null;
    }

    this.isTranslating = true;
    
    try {
      console.log('Sending translation request...');
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
      this.showMessage('翻译失败: ' + error.message, 'error');
      return null;
    } finally {
      this.isTranslating = false;
    }
  }

  // 主要的翻译方法 - 保持简单可靠
  async translateArticle(targetLang = 'en') {
    const articleElement = this.findArticleElement();
    if (!articleElement) {
      this.showMessage('未找到文章内容', 'error');
      return;
    }

    // 保存原始内容
    const originalHTML = articleElement.innerHTML;
    const originalText = articleElement.textContent;
    
    // 显示加载状态
    this.showLoadingState(articleElement);

    const translatedText = await this.translateText(originalText, targetLang);
    
    if (translatedText) {
      // 简单替换，保持基本的段落结构
      articleElement.innerHTML = this.formatTranslatedText(translatedText);
      this.currentLang = targetLang;
      this.updateButtonText(targetLang);
      this.showMessage('翻译完成!', 'success');
      
      // 保存原始HTML以便恢复
      articleElement.dataset.originalHtml = originalHTML;
      
      // 显示恢复按钮
      const restoreBtn = document.getElementById('restore-btn');
      if (restoreBtn) {
        restoreBtn.style.display = 'block';
      }
    } else {
      // 恢复原文
      articleElement.innerHTML = originalHTML;
    }
  }

  // 恢复原文
  restoreOriginal() {
    const articleElement = this.findArticleElement();
    if (articleElement && articleElement.dataset.originalHtml) {
      articleElement.innerHTML = articleElement.dataset.originalHtml;
      this.currentLang = 'zh';
      this.updateButtonText('zh');
      this.showMessage('已恢复原文', 'info');
      
      // 隐藏恢复按钮
      const restoreBtn = document.getElementById('restore-btn');
      if (restoreBtn) {
        restoreBtn.style.display = 'none';
      }
    }
  }

  // 查找文章内容元素
  findArticleElement() {
    // 尝试常见的选择器
    const selectors = [
      'article',
      '.post-content',
      '.blog-content', 
      '.entry-content',
      '.markdown-body',
      '.content',
      'main',
      '.post-body',
      '.article-content'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    // 如果都没找到，返回第一个包含大量文本的元素
    return document.body;
  }

  // 显示加载状态
  showLoadingState(element) {
    element.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">🚀 AI 正在翻译中...</div>
        <div style="font-size: 0.9rem; opacity: 0.7;">请耐心等待，这可能需要一些时间</div>
      </div>
    `;
  }

  // 格式化翻译后的文本
  formatTranslatedText(text) {
    // 基本的段落格式化
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length > 1) {
      return paragraphs.map(p => `<p>${p}</p>`).join('');
    } else {
      return `<p>${text}</p>`;
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    // 移除现有的消息
    const existingMessage = document.getElementById('translation-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.id = 'translation-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
      color: white;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-width: 300px;
      text-align: center;
    `;

    document.body.appendChild(messageEl);

    // 3秒后自动消失
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 3000);
  }

  // 更新按钮文本
  updateButtonText(targetLang) {
    const button = document.getElementById('translate-btn');
    if (button) {
      if (targetLang === 'en') {
        button.innerHTML = '🔤 翻译成中文';
        button.setAttribute('data-target-lang', 'zh');
      } else {
        button.innerHTML = '🌐 翻译成英文';
        button.setAttribute('data-target-lang', 'en');
      }
    }
  }
}

// 添加翻译和恢复按钮到页面
function addTranslateButton() {
  // 如果按钮已存在，则不再添加
  if (document.getElementById('translate-btn')) {
    return;
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // 翻译按钮
  const translateBtn = document.createElement('button');
  translateBtn.id = 'translate-btn';
  translateBtn.innerHTML = '🌐 翻译成英文';
  translateBtn.setAttribute('data-target-lang', 'en');
  
  translateBtn.style.cssText = `
    padding: 12px 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  `;

  // 恢复按钮
  const restoreBtn = document.createElement('button');
  restoreBtn.id = 'restore-btn';
  restoreBtn.innerHTML = '↩️ 恢复原文';
  restoreBtn.style.cssText = `
    padding: 10px 16px;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    display: none; // 默认隐藏
  `;

  // 悬停效果
  [translateBtn, restoreBtn].forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });

    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = btn === translateBtn 
        ? '0 4px 15px rgba(0,0,0,0.2)' 
        : '0 2px 10px rgba(0,0,0,0.1)';
    });
  });

  // 点击事件
  translateBtn.addEventListener('click', function() {
    const targetLang = this.getAttribute('data-target-lang');
    translator.translateArticle(targetLang);
  });

  restoreBtn.addEventListener('click', function() {
    translator.restoreOriginal();
  });

  buttonContainer.appendChild(translateBtn);
  buttonContainer.appendChild(restoreBtn);
  document.body.appendChild(buttonContainer);
}

// 创建翻译器实例
const translator = new BlogTranslator();

// 页面加载完成后添加按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTranslateButton);
} else {
  addTranslateButton();
}