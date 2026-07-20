# Z-Box

> 个人多功能 Web 应用 — AI 辅助编程与工程化实训项目  
> 作者：张添豪（122512023065）

Z-Box 是一个基于 **Node.js + Express** 的全栈 Web 项目，整合了 AI 对话、国内新闻、资源搜索、必应壁纸、短视频、用户登录注册等功能。前端采用原生 HTML / CSS / JavaScript，后端通过 Express 代理第三方 API，并使用 MongoDB Atlas 存储用户数据。

## 线上 Demo

| 项目 | 地址 |
|------|------|
| 线上访问 | https://z-box-djuf.onrender.com |

## 功能概览

| 页面 | 路径 | 说明 |
|------|------|------|
| AI 对话 | `/index.html` | 多模型流式对话（SSE），支持 Markdown 渲染与聊天记录持久化 |
| 新闻 | `/news.html` | 国内新闻列表，支持分页加载 |
| 新闻详情 | `/newsDetail.html` | 按 ID 查看新闻正文 |
| 网盘搜索 | `/linksearch.html` | 关键词搜索短剧 / 视频资源链接 |
| 其它工具 | `/others.html` | 英文词典、必应每日壁纸、随机短视频 |
| 关于 | `/donation.html` | 项目说明与联系方式 |

### 后端能力

- 8 个 REST / SSE 接口（详见 [API 文档](./API.md)）
- MongoDB 用户注册与登录
- OpenRouter 多模型 AI 流式代理
- 第三方 API 数据清洗与统一响应格式

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js（ES Module） |
| 后端框架 | Express 5 |
| 数据库 | MongoDB Atlas + Mongoose |
| 前端 | 原生 HTML / CSS / JavaScript |
| AI 服务 | OpenRouter API（DeepSeek R1、Gemini、Llama 等） |
| 部署 | Render |
| 工程化 | dotenv 环境变量、cors 跨域、Git 版本管理 |

## 项目结构

```
z-box/
├── server.js              # Express 后端入口，所有 API 路由
├── package.json
├── .env                   # 环境变量（不提交到 Git）
├── public/                # 静态前端资源
│   ├── index.html         # AI 对话页
│   ├── news.html          # 新闻列表
│   ├── newsDetail.html    # 新闻详情
│   ├── linksearch.html    # 资源搜索
│   ├── others.html        # 词典 / 壁纸 / 短视频
│   ├── donation.html      # 关于页
│   ├── css/               # 各页面样式
│   └── js/
│       ├── aichat.js      # AI 对话逻辑（SSE + Cookie 历史）
│       ├── auth.js        # 登录 / 注册悬浮组件
│       ├── linksearch.js  # 搜索与分页
│       ├── others.js      # 壁纸 / 词典 / 视频
│       └── script.js      # 通用脚本
├── docs/
│   └── API.md             # 接口文档
├── README.md
└── prompt_log.md          # AI Prompt 开发日志
```

## 环境要求

- Node.js >= 18
- npm >= 9
- MongoDB Atlas 账号（或本地 MongoDB）
- OpenRouter API Key（AI 对话功能）

## 快速开始

### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd z-box
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 服务端口（可选，默认 3000）
PORT=3000

# MongoDB Atlas 连接串
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>

# OpenRouter API Keys（按使用的模型配置）
OPENROUTER_API_KEY_R1=sk-or-v1-...
OPENROUTER_API_KEY_R1_0528=sk-or-v1-...
OPENROUTER_API_KEY_GEMINI=sk-or-v1-...
OPENROUTER_API_KEY_LLAMA=sk-or-v1-...
OPENROUTER_API_KEY_GPT_OSS_20B=sk-or-v1-...
```

### 4. 启动服务

```bash
npm start
```

浏览器访问 http://localhost:3000 即可使用。

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PORT` | 否 | 服务监听端口，默认 `3000` |
| `MONGODB_URI` | 是* | MongoDB 连接字符串，注册 / 登录功能依赖 |
| `OPENROUTER_API_KEY_R1` | 是* | DeepSeek R1 模型 Key |
| `OPENROUTER_API_KEY_R1_0528` | 否 | DeepSeek R1 0528 模型 Key |
| `OPENROUTER_API_KEY_GEMINI` | 否 | Gemini 2.5 Flash 模型 Key |
| `OPENROUTER_API_KEY_LLAMA` | 否 | Llama 3.3 70B 模型 Key |
| `OPENROUTER_API_KEY_GPT_OSS_20B` | 否 | GPT-OSS-20B 模型 Key |

> \* 未配置 MongoDB 时注册 / 登录接口不可用；未配置 OpenRouter Key 时 AI 对话接口返回错误。

## API 文档

完整接口说明见 **[docs/API.md](./docs/API.md)**，包含：

- 请求方法与路径
- Query / Body 参数
- 响应格式与示例
- 错误码说明

### 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/chat` | AI 流式对话（SSE） |
| `GET` | `/video` | 随机短视频 |
| `GET` | `/api/wallpaper` | 必应每日壁纸 |
| `GET` | `/api/news` | 国内新闻列表 |
| `GET` | `/api/newsDetail` | 新闻详情 |
| `GET` | `/api/shortvideo` | 关键词搜索资源 |
| `POST` | `/api/register` | 用户注册 |
| `POST` | `/api/login` | 用户登录 |

## 异常与健壮性

| 场景 | 处理方式 |
|------|----------|
| 第三方 API 返回异常结构 | 后端记录日志，返回 500 及 `error` 字段 |
| 缺少必填参数 | 返回 400 及明确错误信息 |
| AI 上游连接失败 | SSE 推送 `event: error` 事件 |
| 视频链接失效 | 前端 HEAD 预检，提示用户重试 |
| 搜索无结果 | 前端友好提示，不抛未捕获异常 |
| MongoDB 连接失败 | 控制台报错，注册 / 登录返回 fail |
