# ResumAI | 大模型简历优化与岗位推荐系统

基于先进大语言模型（LLM）的智能简历优化与岗位匹配工具。系统采用了现代化的 Bento Grid 极简UI设计，帮助用户不仅获得更为专业、极具量化指标的简历表述，还能直接得到高度匹配的职业发展方向与岗位推荐。

## ✨ 核心特性

- **🤖 多模型切换**: 默认支持使用强大的 **Gemini 3.1 Pro** 模型。同时也支持通过前端页面填写 API Key 来调用国内的 **智谱 GLM-4**，方便在不需要魔法的环境下顺畅使用。
- **🌍 多语言支持**: 支持将您的优化结果指定为**中文**或**英文**，满足不同外企、跨境平台和国内企业的个性化求职需要。
- **🎨 Bento Grid 设计语言**: 使用最新版 Tailwind CSS v4 及 Framer Motion 实现的高颜值、现代化的玻璃拟态、网格化UI，提供极致流畅的交互体验。
- **💼 智能岗位匹配引擎**: 不仅仅帮您重写简历，更能根据您提炼出来的经历背景深度推理，自动推荐 3-5 个最适合你的职业发展角色，并给出契合度分数（Match Score）及深度匹配理由。

---

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript + Vite 6
- **样式处理**: Tailwind CSS v4 + `clsx` + `tailwind-merge`
- **动画实现**: Framer Motion
- **Markdown渲染**: `react-markdown` + `remark-gfm` + `@tailwindcss/typography`
- **AI 对接**: `@google/genai` (For Gemini) / 标准 `fetch` POST (For Zhipu GLM)

---

## 🚀 本地部署指南

### 1. 环境准备
确保您的计算机上已安装 **Node.js** (推荐v18及以上版本).

### 2. 下载并安装依赖
在终端/命令行工具中进入项目根目录，由于系统使用 npm 进行包管理，请执行以下命令来安装相关的依赖：

```sh
npm install
```

### 3. 配置环境变量
如果您希望体验系统内置且默认的 **Gemini** 极强推理能力，则需要提前配置 Gemini API Key：
1. 在项目根目录，您会看到一个名为 `.env.example` 的示例文件。复制它并重命名为 `.env`。
2. 打开新建的 `.env` 文件，输入您从 Google AI Studio 获取的 API 密钥：
```env
GEMINI_API_KEY="你的_GEMINI_API_KEY"
```

*(备注：如果您网络不便或仅计划使用智谱 GLM-4，您可以跳过配置 `.env` 的步骤，直接在随后的应用 UI 面板选项中输入 GLM 的 API Key 即可使用)*

### 4. 启动本地开发服务
在终端运行以下命令开启开发环境：
```sh
npm run dev
```
启动成功后，浏览器访问 `http://localhost:3000` (或控制台输出的对应本地端口)，即可开始体验。

### 5. 编译打包 (生产环境部署)
如果您需要将该开源项目发布到 Vercel、Netlify、阿里云OSS 或是使用自建 Nginx 等静态托管平台，请先执行打包命令：
```sh
npm run build
```
构建完成后的最终纯前端静态文件将被放在根目录下的 `dist` 文件夹内，将这个文件夹内的内容部署即可。
