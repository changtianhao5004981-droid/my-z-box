# Z-Box API 文档

> Base URL（本地）：`http://localhost:3000`  
> Base URL（线上）：`https://z-box-djuf.onrender.com`

所有 JSON 接口默认 `Content-Type: application/json`。静态页面由 Express 直接托管 `public/` 目录。

---

## 目录

1. [AI 流式对话](#1-ai-流式对话)
2. [随机短视频](#2-随机短视频)
3. [必应壁纸](#3-必应壁纸)
4. [国内新闻列表](#4-国内新闻列表)
5. [新闻详情](#5-新闻详情)
6. [资源关键词搜索](#6-资源关键词搜索)
7. [用户注册](#7-用户注册)
8. [用户登录](#8-用户登录)

---

## 1. AI 流式对话

通过 Server-Sent Events（SSE）与 OpenRouter 大模型进行流式对话。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/chat` |
| **Method** | `GET` |
| **Content-Type** | `text/event-stream` |

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `q` | string | 是 | `""` | 用户提问内容 |
| `model` | string | 否 | `deepseek/deepseek-r1` | OpenRouter 模型 ID |

### 支持的 model 值

| model | 说明 |
|-------|------|
| `openai/gpt-oss-20b` | OpenAI GPT-OSS-20B |
| `google/gemini-2.5-flash` | Gemini 2.5 Flash |
| `meta-llama/llama-3.3-70b-instruct` | Llama 3.3 70B |
| `deepseek/deepseek-r1` | DeepSeek R1 |
| `deepseek/deepseek-r1:0528` | DeepSeek R1 0528 |

### SSE 事件类型

| event | data 含义 |
|-------|-----------|
| `answer` | 模型回复正文（增量片段） |
| `reasoning` | 模型推理过程（DeepSeek R1 等） |
| `error` | 错误信息 |
| `done` | 流结束 |

### 请求示例

```http
GET /chat?q=你好，介绍一下Node.js&model=google/gemini-2.5-flash HTTP/1.1
Host: localhost:3000
Accept: text/event-stream
```

### 响应示例

```
event: answer
data: Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时...

event: reasoning
data: 用户询问 Node.js，我需要从定义、特点、用途等方面回答...

event: done
data:
```

### 前端调用示例

```javascript
const evtSource = new EventSource(
  `/chat?q=${encodeURIComponent("你好")}&model=${encodeURIComponent("google/gemini-2.5-flash")}`
);

evtSource.addEventListener("answer", (e) => {
  console.log("回复片段:", e.data);
});

evtSource.addEventListener("done", () => {
  evtSource.close();
});

evtSource.addEventListener("error", (e) => {
  console.error("错误:", e.data);
  evtSource.close();
});
```

### 错误说明

| 情况 | 行为 |
|------|------|
| OpenRouter Key 未配置或无效 | SSE `event: error` |
| 上游 HTTP 非 200 | SSE `event: error`，含状态码 |

---

## 2. 随机短视频

按分类获取随机短视频播放链接。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/video` |
| **Method** | `GET` |

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | 否 | `jk` | 视频分类 ID |

### 常用分类 id

`jk` · `YuMeng` · `NvDa` · `NvGao` · `ReWu` · `QingCun` · `HanFu` · `TianMei` 等（见 `others.html` 下拉选项）

### 成功响应 `200`

```json
{
  "status": "success",
  "link": "https://example.com/video.mp4"
}
```

### 失败响应 `500`

```json
{
  "error": "API returned unexpected format",
  "details": {}
}
```

### 请求示例

```bash
curl "http://localhost:3000/video?id=jk"
```

---

## 3. 必应壁纸

获取 Bing 每日壁纸 URL 及元信息。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/wallpaper` |
| **Method** | `GET` |

### Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `size` | string | 否 | `UHD` | 分辨率规格 |

### size 可选值

| 值 | 说明 |
|----|------|
| `UHD` | 超高清 |
| `1920x1080` | 电脑标准 |
| `720x1280` | 手机竖屏 |
| `1366x768` | 普通笔电 |

### 成功响应 `200`

```json
{
  "status": "success",
  "url": "https://www.bing.com/th?id=OHR.xxx_UHD.jpg",
  "title": "Bing Daily Wallpaper",
  "copyright": "© Photographer Name"
}
```

### 失败响应 `500`

```json
{
  "error": "Error fetching wallpaper"
}
```

### 请求示例

```bash
curl "http://localhost:3000/api/wallpaper?size=1920x1080"
```

---

## 4. 国内新闻列表

获取天行数据国内新闻，后端已清洗为统一格式。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/news` |
| **Method** | `GET` |

### 成功响应 `200`

```json
{
  "items": [
    {
      "id": "12345678",
      "title": "新闻标题",
      "summary": "新闻摘要",
      "url": "https://example.com/news/123",
      "date": "2026-07-19 10:00"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 新闻唯一 ID，用于详情接口 |
| `title` | string | 标题 |
| `summary` | string | 摘要，无描述时为「点击查看详情」 |
| `url` | string | 原文链接 |
| `date` | string | 发布时间（`ctime`） |

### 失败响应 `500`

```json
{
  "error": "Failed to fetch news",
  "details": "错误详情"
}
```

### 请求示例

```bash
curl "http://localhost:3000/api/news"
```

---

## 5. 新闻详情

根据新闻 ID 获取正文内容。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/newsDetail` |
| **Method** | `GET` |

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 新闻 ID（来自 `/api/news` 的 `items[].id`） |

### 成功响应 `200`

返回第三方 API 的 `result` 对象，结构示例：

```json
{
  "title": "新闻标题",
  "content": "<p>HTML 正文内容...</p>",
  "author": "来源名称",
  "date": "2026-07-19"
}
```

> 实际字段以天行数据接口返回为准。

### 失败响应

**400 — 缺少参数**

```json
{
  "error": "Missing news ID parameter"
}
```

**500 — 上游失败**

```json
{
  "error": "Failed to fetch news detail",
  "details": {}
}
```

### 请求示例

```bash
curl "http://localhost:3000/api/newsDetail?id=12345678"
```

---

## 6. 资源关键词搜索

按关键词搜索短剧 / 视频资源链接。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/shortvideo` |
| **Method** | `GET` |

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 搜索关键词 |

### 成功响应 `200`

返回视频资源数组（直接透传上游 `data` 字段）：

```json
[
  {
    "name": "资源标题",
    "description": "资源描述",
    "viewlink": "https://example.com/watch",
    "downloadlink": "https://example.com/download",
    "addtime": "2026-07-19",
    "duration": "01:23:45"
  }
]
```

> 字段名可能为 `title` / `url` 等别名，前端已做兼容。

### 失败响应

**400 — 缺少参数**

```json
{
  "error": "Missing \"text\" query parameter"
}
```

**500 — 上游失败**

```json
{
  "error": "Failed to fetch short videos",
  "details": "错误信息"
}
```

### 请求示例

```bash
curl "http://localhost:3000/api/shortvideo?text=爱情"
```

---

## 7. 用户注册

在 MongoDB 中创建新用户。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/register` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### Request Body

```json
{
  "username": "testuser",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名，唯一 |
| `password` | string | 是 | 密码（明文存储，生产环境建议加密） |

### 成功响应 `200`

```json
{
  "status": "success",
  "message": "注册成功！请前往登录"
}
```

### 失败响应 `200`

```json
{
  "status": "fail",
  "message": "该用户名已被注册"
}
```

其他 fail 情况：`用户名和密码不能为空` · `注册失败，服务器错误`

### 请求示例

```bash
curl -X POST "http://localhost:3000/api/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

---

## 8. 用户登录

验证用户名与密码。

### 基本信息

| 项目 | 值 |
|------|-----|
| **URL** | `/api/login` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### Request Body

```json
{
  "username": "testuser",
  "password": "123456"
}
```

### 成功响应 `200`

```json
{
  "status": "success",
  "message": "登录成功！",
  "username": "testuser"
}
```

### 失败响应 `200`

```json
{
  "status": "fail",
  "message": "用户名或密码错误"
}
```

### 请求示例

```bash
curl -X POST "http://localhost:3000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

---

## 通用错误码

| HTTP 状态码 | 含义 |
|-------------|------|
| `200` | 请求成功（注册 / 登录业务失败也返回 200，`status: fail`） |
| `400` | 客户端参数错误 |
| `500` | 服务端或第三方 API 异常 |

## Postman 导入建议

可将以下环境变量配置到 Postman：

| 变量 | 值 |
|------|-----|
| `base_url` | `http://localhost:3000` |
| `username` | 测试用户名 |
| `password` | 测试密码 |

常用测试顺序：

1. `POST {{base_url}}/api/register` — 注册
2. `POST {{base_url}}/api/login` — 登录
3. `GET {{base_url}}/api/news` — 获取新闻
4. `GET {{base_url}}/api/newsDetail?id=<id>` — 新闻详情
5. `GET {{base_url}}/chat?q=hello&model=google/gemini-2.5-flash` — AI 对话（需 SSE 客户端）
