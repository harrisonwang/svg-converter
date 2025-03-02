// 全局变量
let originalSvg = null;
let currentSvg = null;
let pngOutput = null;
let originalFileName = null;

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const svgPreview = document.getElementById('svgPreview');
const pngPreview = document.getElementById('pngPreview');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusMessage = document.getElementById('statusMessage');
const dpiInput = document.getElementById('dpiInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const embedFontCheckbox = document.getElementById('embedFontCheckbox');

// 显示状态消息
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// 修复 SVG 中的字体问题
function fixSvgFonts(svgContent) {
  if (!embedFontCheckbox.checked) {
    return svgContent;
  }

  // 创建临时 DOM 解析 SVG
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // 找到所有文本元素
  const textElements = svgDoc.querySelectorAll('text');
  
  // 设置文本元素的字体
  textElements.forEach(textElement => {
    try {
      textElement.setAttribute('font-family', 'Microsoft YaHei, SimSun, sans-serif');
      textElement.style.fontFamily = 'Microsoft YaHei, SimSun, sans-serif';
      
      // 检查元素是否有font-weight属性，如果有则保留
      const fontWeight = textElement.getAttribute('font-weight');
      if (!fontWeight) {
        // 只有当没有font-weight属性时才设置默认值
        // 注意：不再设置style.fontWeight，避免覆盖可能存在的CSS样式
      }
    } catch (e) {
      console.error('处理文本元素时出错:', e);
    }
  });
  
  // 添加字体定义 (如果SVG没有defs)
  if (!svgDoc.querySelector('defs')) {
    const defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const style = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.setAttribute('type', 'text/css');
    style.textContent = `
      @font-face {
        font-family: "Microsoft YaHei";
        src: local("Microsoft YaHei"), local("微软雅黑");
      }
      text {
        font-family: "Microsoft YaHei", SimSun, sans-serif;
      }
    `;
    defs.appendChild(style);
    
    // 将defs添加为SVG的第一个子元素
    const svgElement = svgDoc.querySelector('svg');
    if (svgElement && svgElement.firstChild) {
      svgElement.insertBefore(defs, svgElement.firstChild);
    } else if (svgElement) {
      svgElement.appendChild(defs);
    }
  }
  
  // 将修改后的 SVG 转回字符串
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgDoc);
}

// 处理 SVG 文件
async function handleSvgFile(file) {
  try {
    const reader = new FileReader();
    
    // 提取文件名（不包括扩展名）
    originalFileName = file.name.replace(/\.svg$/i, '');
    
    reader.onload = (event) => {
      originalSvg = event.target.result;
      currentSvg = fixSvgFonts(originalSvg);
      
      // 显示 SVG 预览
      svgPreview.innerHTML = currentSvg;
      const svgElement = svgPreview.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '300px';
      }
      
      // 清除旧的 PNG 预览
      pngPreview.innerHTML = '';
      pngOutput = null;
      downloadBtn.disabled = true;
      
      showStatus(`SVG 文件 "${file.name}" 已加载，点击"转换"按钮生成 ${getSelectedFormat().toUpperCase()}`);
    };
    
    reader.onerror = () => {
      showStatus('读取文件时发生错误', 'error');
    };
    
    reader.readAsText(file);
  } catch (error) {
    console.error('处理 SVG 文件时出错:', error);
    showStatus('处理 SVG 文件时出错', 'error');
  }
}

// 获取所选格式的函数，使用主标签
function getSelectedFormat() {
  const activeTab = document.querySelector('.main-tab.active');
  return activeTab ? activeTab.getAttribute('data-format') : 'png';
}

// 修改 convertSvgToPng 函数以支持 WebP
async function convertSvgToPng() {
  if (!currentSvg) {
    showStatus('请先上传 SVG 文件', 'error');
    return;
  }
  
  showStatus('正在转换...');
  
  try {
    const dpi = parseInt(dpiInput.value) || 300;
    const width = parseInt(widthInput.value) || 0;
    const height = parseInt(heightInput.value) || 0;
    const format = getSelectedFormat();
    
    // 创建 SVG Blob URL
    const svgBlob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // 创建图片元素加载 SVG
    const img = new Image();
    
    // 使用 Promise 等待图片加载
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('SVG 图片加载失败'));
      img.src = svgUrl;
    });
    
    // 获取原始 SVG 的尺寸
    const svgWidth = width || img.naturalWidth || 800;
    const svgHeight = height || img.naturalHeight || 600;
    
    // 根据 DPI 计算实际像素尺寸
    // 1 英寸 = 96 CSS 像素 (标准显示器)
    const scaleFactor = dpi / 96;
    const canvasWidth = Math.round(svgWidth * scaleFactor);
    const canvasHeight = Math.round(svgHeight * scaleFactor);
    
    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 获取绘图上下文
    const ctx = canvas.getContext('2d');
    
    // 设置白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 按比例缩放
    ctx.scale(scaleFactor, scaleFactor);
    
    // 在 Canvas 上绘制 SVG
    ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
    
    // 使用原始文件名创建输出文件名
    const filename = originalFileName ? 
                    `${originalFileName}.${format}` : 
                    `converted.${format}`;
    
    // 转换 Canvas 为指定格式的 Blob
    const outputBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, format === 'webp' ? 'image/webp' : 'image/png', format === 'webp' ? 0.9 : undefined);
    });
    
    // 创建输出的 URL
    const outputUrl = URL.createObjectURL(outputBlob);
    
    // 清理旧的预览
    pngPreview.innerHTML = '';
    
    // 显示新的预览
    const outputImg = document.createElement('img');
    outputImg.src = outputUrl;
    outputImg.className = 'preview-image';
    pngPreview.appendChild(outputImg);
    
    // 保存输出
    pngOutput = { blob: outputBlob, url: outputUrl, filename: filename };
    downloadBtn.disabled = false;
    
    // 释放不再需要的资源
    URL.revokeObjectURL(svgUrl);
    
    showStatus(`SVG 成功转换为 ${format.toUpperCase()}！`, 'success');
  } catch (error) {
    console.error('转换 SVG 时出错:', error);
    showStatus(`转换失败: ${error.message}`, 'error');
  }
}

// 修改downloadPng函数，使名称更通用
function downloadOutput() {
  if (!pngOutput) {
    showStatus('没有可下载的文件', 'error');
    return;
  }
  
  // 创建下载链接
  const a = document.createElement('a');
  a.href = pngOutput.url;
  a.download = pngOutput.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// 设置拖放处理
function setupDragAndDrop() {
  // 阻止默认拖放行为
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  // 突出显示拖放区域
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  // 处理拖放的文件
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function highlight() {
    uploadArea.classList.add('highlighted');
  }
  
  function unhighlight() {
    uploadArea.classList.remove('highlighted');
  }
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        handleSvgFile(file);
      } else {
        showStatus('请上传 SVG 文件', 'error');
      }
    }
  }
}

// 用于重新生成当前 SVG (如果参数改变)
function regenerateSvg() {
  if (originalSvg) {
    currentSvg = fixSvgFonts(originalSvg);
    svgPreview.innerHTML = currentSvg;
    const svgElement = svgPreview.querySelector('svg');
    if (svgElement) {
      svgElement.style.maxWidth = '100%';
      svgElement.style.maxHeight = '300px';
    }
  }
}

// 修改setupEventListeners函数
function setupEventListeners() {
  // 点击上传区域触发文件选择
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // 文件选择改变
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        handleSvgFile(file);
      } else {
        showStatus('请上传 SVG 文件', 'error');
      }
      // 重置 input，以便能够重新选择同一文件
      fileInput.value = '';
    }
  });
  
  // 转换按钮
  convertBtn.addEventListener('click', convertSvgToPng);
  
  // 主标签点击事件
  const mainTabs = document.querySelectorAll('.main-tab');
  const mainTitle = document.getElementById('mainTitle');
  const previewTitle = document.querySelector('.preview-container:last-child .preview-title');
  
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 移除所有活动状态
      mainTabs.forEach(t => t.classList.remove('active'));
      // 设置当前标签为活动状态
      tab.classList.add('active');
      
      // 获取格式
      const format = tab.getAttribute('data-format');
      
      // 更新标题
      mainTitle.textContent = `SVG 转 ${format.toUpperCase()} 工具`;
      
      // 更新预览标题
      if (previewTitle) {
        previewTitle.textContent = `${format.toUpperCase()} 预览`;
      }
      
      // 更新下载按钮文本
      if (downloadBtn) {
        downloadBtn.textContent = `下载 ${format.toUpperCase()}`;
      }
      
      // 如果已经有转换结果，清除它（因为格式改变了）
      if (pngOutput) {
        pngPreview.innerHTML = '';
        pngOutput = null;
        downloadBtn.disabled = true;
      }
    });
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  setupEventListeners();
  showStatus('准备就绪，请上传 SVG 文件');
  
  // 初始化下载按钮文本和标题
  const format = getSelectedFormat().toUpperCase();
  if (downloadBtn) {
    downloadBtn.textContent = `下载 ${format}`;
  }
  
  const mainTitle = document.getElementById('mainTitle');
  if (mainTitle) {
    mainTitle.textContent = `SVG 转 ${format} 工具`;
  }
  
  // 初始化预览标题
  const previewTitle = document.querySelector('.preview-container:last-child .preview-title');
  if (previewTitle) {
    previewTitle.textContent = `${format} 预览`;
  }
  
  // 更改下载按钮事件监听器
  if (downloadBtn) {
    // 添加事件监听器
    downloadBtn.addEventListener('click', downloadOutput);
  }
});