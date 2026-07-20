# Z-Box AI Prompt 开发日志

> 作者：张添豪（122512023065）  
> 工具：Cursor AI  
> 说明：记录开发过程中使用 AI 辅助编程的关键 Prompt，每条均标注对应功能与文件。

---

## Prompt #1 — 搭建 Express 后端基础框架

**对应功能 / 文件：** 项目初始化 · `server.js` · `package.json`

**我的 Prompt：**

```
帮我用 Node.js + Express 搭建一个全栈 Web 项目骨架：
1. 使用 ES Module（type: module）
2. 托管 public 目录下的静态文件
3. 支持 cors 和 JSON body 解析
4. 端口从环境变量 PORT 读取，默认 3000
5. 给出 package.json 的 scripts 和依赖
```

**AI 返回摘要：**

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

**结果：** 完成项目后端骨架，后续所有 API 在此基础上扩展。

---

## Prompt #2 — 适配短视频第三方 API 返回结构

**对应功能 / 文件：** 随机短视频 · `server.js` `/video` 路由 · `public/js/others.js`

**我的 Prompt：**

```
我的短视频接口 https://api.qzqi.com/api/v1/Randclip?id=jk&type=json
实际返回格式是：
{
  "code": 1,
  "data": { "link": "https://xxx.mp4" }
}
请帮我修改 /video 路由，把 link 提取出来，统一返回：
{ "status": "success", "link": "..." }
如果结构不对就返回 500 错误。
```

**AI 返回摘要：**

```javascript
app.get('/video', async (req, res) => {
  const categoryId = req.query.id || 'jk';
  const API_URL = `https://api.qzqi.com/api/v1/Randclip?id=${categoryId}&type=json`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.code === 1 && data.data && data.data.link) {
      res.json({ status: 'success', link: data.data.link });
    } else {
      res.status(500).json({ error: "API returned unexpected format", details: data });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching video" });
  }
});
```

**结果：** 解决了第三方 API 字段嵌套不一致的问题，前端 `loadVideo()` 可正常播放。

---

## Prompt #3 — 天行新闻接口数据清洗

**对应功能 / 文件：** 国内新闻列表 · `server.js` `/api/news` · `public/news.html`

**我的 Prompt：**

```
天行国内新闻接口返回的数据在 data.result.newslist 里，
字段有 id、title、description、url、ctime。
请帮我在 /api/news 路由里清洗数据，返回格式：
{
  "items": [
    { "id", "title", "summary", "url", "date" }
  ]
}
summary 没有 description 时用「点击查看详情」占位。
```

**AI 返回摘要：**

```javascript
const newsList = data?.result?.newslist || [];

const formattedItems = newsList.map((item) => ({
  id: item.id,
  title: item.title,
  summary: item.description || '点击查看详情',
  url: item.url,
  date: item.ctime
}));

res.json({ items: formattedItems });
```

**结果：** 新闻列表页能正确渲染标题、摘要和日期，并支持「加载更多」分页。

---

## Prompt #4 — AI 流式对话 SSE 代理

**对应功能 / 文件：** AI 对话 · `server.js` `/chat` 路由 · `public/js/aichat.js`

**我的 Prompt：**

```
帮我实现一个 /chat 接口，通过 OpenRouter 调用大模型，要求：
1. GET 请求，参数 q（问题）和 model（模型名）
2. 使用 SSE 流式返回，event 类型包括 answer、reasoning、done、error
3. 不同 model 对应不同的 OPENROUTER_API_KEY 环境变量
4. 前端用 EventSource 接收
请给出后端路由和前端监听示例。
```

**AI 返回摘要（后端核心逻辑）：**

```javascript
app.get("/chat", async (req, res) => {
  const q = req.query.q || "";
  const model = req.query.model || "deepseek/deepseek-r1";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const completion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    },
    body: JSON.stringify({
      model, messages: [{ role: "user", content: q }], stream: true
    })
  });

  // 解析 SSE chunk，推送 event: answer / reasoning / done
});
```

**前端核心逻辑：**

```javascript
const evtSource = new EventSource(`/chat?q=${encodeURIComponent(q)}&model=${encodeURIComponent(model)}`);

evtSource.addEventListener("answer", (e) => {
  fullText += e.data;
  aiContent.innerHTML = marked.parse(fullText.replace(/\\n/g, "\n"));
});

evtSource.addEventListener("done", () => evtSource.close());
```

**结果：** 实现多模型流式对话，支持 Markdown 渲染与 Cookie 聊天记录持久化。

---

## Prompt #5 — MongoDB 用户注册与登录

**对应功能 / 文件：** 用户系统 · `server.js` · `public/js/auth.js`

**我的 Prompt：**

```
用 mongoose 连接 MongoDB Atlas，环境变量 MONGODB_URI。
定义 User Schema：username（唯一）、password、createdAt。
实现两个接口：
POST /api/register — 检查重复用户名，成功返回 { status: "success" }
POST /api/login — 验证用户名密码，成功返回 username
前端需要一个可拖拽的右下角悬浮登录按钮和模态弹窗。
```

**AI 返回摘要（Schema + 注册接口）：**

```javascript
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.json({ status: 'fail', message: '该用户名已被注册' });
  }
  await new User({ username, password }).save();
  res.json({ status: 'success', message: '注册成功！请前往登录' });
});
```

**结果：** 全站右下角悬浮登录 / 注册组件，登录状态写入 `localStorage`。

---

## Prompt #6 — 必应壁纸接口适配

**对应功能 / 文件：** 每日壁纸 · `server.js` `/api/wallpaper` · `public/js/others.js`

**我的 Prompt：**

```
Bing 壁纸 API 返回的数据结构是 images 数组，第一项包含 url、title、copyright。
请写 /api/wallpaper 路由，支持 size 参数（默认 UHD），
返回 { status, url, title, copyright }。
前端加载时做图片预加载和淡入效果。
```

**AI 返回摘要：**

```javascript
if (data.images && data.images.length > 0) {
  const imgInfo = data.images[0];
  res.json({
    status: 'success',
    url: imgInfo.url,
    title: imgInfo.title || 'Bing Daily Wallpaper',
    copyright: imgInfo.copyright
  });
}
```

**结果：** others.html 壁纸模块支持多分辨率切换，页面加载时自动拉取默认壁纸。

---

## Prompt #7 — 网盘搜索分页与错误提示

**对应功能 / 文件：** 资源搜索 · `public/js/linksearch.js` · `server.js` `/api/shortvideo`

**我的 Prompt：**

```
linksearch 页面调用 /api/shortvideo?text=关键词 搜索资源。
请完善前端 JS：
1. 支持 Enter 键搜索
2. 结果分页，每页 10 条
3. 加载中、无结果、网络错误都有友好提示
4. 每条结果显示标题、描述、观看和下载链接
```

**AI 返回摘要（分页逻辑）：**

```javascript
const itemsPerPage = 10;

function renderPagination() {
  const totalPages = Math.ceil(searchData.length / itemsPerPage);
  // 上一页 / 页码 / 下一页按钮
}

function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}
```

**结果：** 搜索页具备完整交互：Loading 态、分页、Toast 提示。

---

## Prompt #8 — 生成考核文档（README / API / Prompt 日志）

**对应功能 / 文件：** 工程文档 · `README.md` · `docs/API.md` · `prompt_log.md`

**我的 Prompt：**

```
根据我的项目（Node.js + Express 全栈 Web 应用 Z-Box）和考核方案文档，
帮我生成：
1. README.md — 项目介绍、技术栈、安装运行指南、API 文档链接
2. prompt_log.md — AI Prompt 开发日志模板
3. API 文档 — 所有后端接口的请求/响应说明

考核要求：文档能让别人复现项目，Prompt 日志需标注对应功能与文件。
```

**AI 返回摘要：**

生成了三份文档：

- `README.md`：含线上 Demo、功能表、目录结构、环境变量、部署说明
- `docs/API.md`：8 个接口的完整 REST / SSE 文档
- `prompt_log.md`：本文档，记录 8 条关键 Prompt 及 AI 输出摘要

**结果：** 满足考核「AI 工具运用与文档（20%）」中的文档完备性要求。

---

## 使用说明

| 要求 | 本日志对应情况 |
|------|----------------|
| 每条 Prompt 附带 AI 原始输出 | 以代码块摘要形式记录（完整输出可在 Cursor 对话历史中截图补充） |
| 标注对应功能 / 文件 | 每条 Prompt 标题下方均已标注 |
| 便于代码审查对应 | Prompt 编号与 Git Commit 可一一关联 |
