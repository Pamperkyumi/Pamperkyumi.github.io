class BlogTranslator {
  constructor() {
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

  // 自动检测语言并翻译
  async translateArticle() {
    const articleElement = this.findArticleElement();
    if (!articleElement) {
      this.showMessage('未找到文章内容', 'error');
      return;
    }

    // 检测当前语言并确定目标语言
    const targetLang = this.detectLanguage(articleElement);
    
    // 保存原始内容
    const originalHTML = articleElement.innerHTML;
    
    // 先提取标记内容（在显示加载状态之前）
    const translationResult = this.extractMarkedContent(articleElement);
    
    if (!translationResult.contentToTranslate || translationResult.matchCount === 0) {
      this.showMessage('未找到可翻译的内容喵,也许此篇文章不需要翻译喵.', 'error');
      return; // 直接返回，不显示加载状态
    }

    // 显示加载状态
    this.showLoadingState(articleElement, targetLang);

    try {
      // 翻译内容
      const translatedContent = await this.translateText(translationResult.contentToTranslate, targetLang);
      
      if (translatedContent) {
        // 重新构建HTML，将翻译内容放回标记之间
        const newHTML = this.replaceMarkedContent(originalHTML, translatedContent, translationResult.markers);
        articleElement.innerHTML = newHTML;
        
        this.currentLang = targetLang;
        this.showMessage(`翻译完成! (${targetLang === 'en' ? '中→英' : '英→中'})`, 'success');
        
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
    } catch (error) {
      console.error('Translation error:', error);
      articleElement.innerHTML = originalHTML;
    }
  }

  // 检测文章语言
  detectLanguage(articleElement) {
    // 获取文章文本内容进行分析
    const text = articleElement.innerText || articleElement.textContent;
    
    // 简单的语言检测逻辑
    // 中文字符检测
    const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文字母检测
    const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
    
    // 如果中文字符数量明显多于英文字符，则认为是中文文章，翻译成英文
    if (chineseCharCount > englishCharCount * 2) {
      return 'en'; // 中文→英文
    } else {
      return 'zh'; // 英文→中文
    }
  }

  // 提取标记之间的内容 - 使用HTML注释标记
  extractMarkedContent(articleElement) {
    const html = articleElement.innerHTML;
    console.log('=== 原始 HTML 内容 ===');
    console.log(html);
    console.log('=== 原始 HTML 内容结束 ===');
    
    // 使用HTML注释作为标记
    const translationRegex = /<!--\s*TRANSLATE_START\s*-->([\s\S]*?)<!--\s*TRANSLATE_END\s*-->/gi;
    
    const markers = [];
    let contentToTranslate = '';
    let matchCount = 0;
    
    // 查找所有标记区域
    let match;
    while ((match = translationRegex.exec(html)) !== null) {
      matchCount++;
      console.log(`找到第 ${matchCount} 个匹配:`, {
        fullMatch: match[0],
        content: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      
      const fullMatch = match[0];
      const content = match[1];
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;
      
      markers.push({
        fullMatch,
        content,
        startIndex,
        endIndex
      });
      
      contentToTranslate += content + '\n\n';
    }
    
    console.log(`总共找到 ${matchCount} 个翻译标记区域`);
    console.log('要翻译的内容:', contentToTranslate);
    
    return {
      contentToTranslate: contentToTranslate.trim(),
      markers,
      matchCount
    };
  }

  // 将翻译后的内容替换回标记区域
  replaceMarkedContent(originalHtml, translatedContent, markers) {
    let result = originalHtml;
    let translatedParts = this.splitTranslatedContent(translatedContent, markers.length);
    
    // 从后往前替换，避免索引变化
    for (let i = markers.length - 1; i >= 0; i--) {
      const marker = markers[i];
      const translatedPart = translatedParts[i] || '';
      
      // 构建新的标记区域
      const newContent = `<!-- TRANSLATE_START -->${translatedPart}<!-- TRANSLATE_END -->`;
      
      // 替换原标记区域
      result = result.substring(0, marker.startIndex) + 
               newContent + 
               result.substring(marker.endIndex);
    }
    
    return result;
  }

  // 将翻译后的内容分割成与标记数量相同的部分
  splitTranslatedContent(translatedContent, partCount) {
    if (partCount <= 1) {
      return [translatedContent];
    }
    
    const paragraphs = translatedContent.split(/\n\s*\n/).filter(p => p.trim());
    const parts = [];
    const paragraphsPerPart = Math.ceil(paragraphs.length / partCount);
    
    for (let i = 0; i < partCount; i++) {
      const start = i * paragraphsPerPart;
      const end = Math.min(start + paragraphsPerPart, paragraphs.length);
      const partParagraphs = paragraphs.slice(start, end);
      parts.push(partParagraphs.join('\n\n'));
    }
    
    return parts;
  }

  // 恢复原文
  restoreOriginal() {
    const articleElement = this.findArticleElement();
    if (articleElement && articleElement.dataset.originalHtml) {
      articleElement.innerHTML = articleElement.dataset.originalHtml;
      this.currentLang = 'zh';
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
    const selectors = [
      'article',
      '.post-content',
      '.blog-content', 
      '.entry-content',
      '.markdown-body',
      '.content',
      'main',
      '.post-body',
      '.article-content',
      '.e-content'  // 添加你的博客特有的选择器
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    
    return document.body;
  }

  // 显示加载状态
  showLoadingState(element, targetLang) {
    const direction = targetLang === 'en' ? '中→英' : '英→中';
    element.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #666;">
        <div style="margin-bottom: 1rem;">🚀 AI 正在翻译中 (${direction})...</div>
        <div style="font-size: 0.9rem; opacity: 0.7;">请耐心等待，这可能需要一些时间</div>
      </div>
    `;
  }

  // 显示消息
  showMessage(message, type = 'info') {
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

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 3000);
  }
}

// 添加翻译和恢复按钮到页面
function addTranslateButton() {
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

  // 翻译按钮 - 简化为"翻译"二字
  const translateBtn = document.createElement('button');
  translateBtn.id = 'translate-btn';
  translateBtn.innerHTML = '翻译';
  
  translateBtn.style.cssText = `
    padding: 12px 18px;
    background: linear-gradient(135deg, #ff0000ff 0%, #ff6200ff 100%);
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

  // 恢复按钮 - 保持不变
  const restoreBtn = document.createElement('button');
  restoreBtn.id = 'restore-btn';
  restoreBtn.innerHTML = '恢复原文';
  restoreBtn.style.cssText = `
    padding: 10px 16px;
    background: linear-gradient(135deg,rgba(250, 96, 0, 1)f 0%, #ffcc00ff 100%);
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    display: none;
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

  // 点击事件 - 不再需要指定目标语言
  translateBtn.addEventListener('click', function() {
    translator.translateArticle();
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