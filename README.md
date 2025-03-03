# 图像格式转换工具

一个纯浏览器端的图像格式转换工具，支持以下转换功能：

- SVG 转 PNG
- SVG 转 WebP
- PNG 转 WebP
- JPG 转 WebP

特点是支持中文字体嵌入，解决了 SVG 中文显示问题。全部处理在客户端完成，不需要上传文件到服务器。

## 功能特点

- **本地处理**：所有转换都在浏览器中完成，保护隐私
- **中文字体支持**：自动修复 SVG 中的中文字体显示问题
- **多格式支持**：支持多种常见图像格式之间的转换
- **自定义 DPI**：SVG 转换时可自定义 DPI 和输出尺寸
- **拖放上传**：支持拖放文件上传，便于使用

## 使用方法

1. 选择需要的转换类型（SVG 转 PNG、SVG 转 WebP、PNG 转 WebP 或 JPG 转 WebP）
2. 上传对应格式的源文件（点击上传区域或拖放文件）
3. 根据需要调整转换参数（SVG 转换时可设置 DPI 等）
4. 点击"转换"按钮开始处理
5. 转换完成后，可预览结果并下载

## 本地开发

如果要在本地运行此项目：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包项目
npm run build
```

## 原理说明

本工具使用 HTML5 的 Canvas API 进行图像处理和格式转换。对于 SVG 文件，先通过 DOM 解析器解析 SVG 内容，修复中文字体问题，然后在 Canvas 上渲染并导出为目标格式。对于 PNG/JPG 文件，直接在 Canvas 上绘制后转换为 WebP 格式。

## 技术栈

- JavaScript (ES6+)
- HTML5 Canvas API
- FileReader API
- Webpack

## 兼容性

支持所有现代浏览器（Chrome、Firefox、Safari、Edge 等），需要浏览器支持 WebP 格式和 Canvas API。
