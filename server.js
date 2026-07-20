import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // 👈 确保加上这句！用来解析前端发来的登录注册数据
// 🔹 Video route (already exists)
// 🔹 完美适配新接口的短视频路由
// 🔹 完美适配新接口的短视频路由（已更新最新 API 地址 Randclip）
// 🔹 完美适配新接口的短视频路由（根据实际返回的 code: 1 和 data.link 结构）
// 🔹 完美适配新接口的短视频路由（根据实际返回的 code: 1 和 data.link 结构）


app.get('/video', async (req, res) => {
  // 获取前端传过来的分类 id，如果没有传，默认给 'jk'
  const categoryId = req.query.id || 'jk';
  
  const API_URL = `https://api.qzqi.com/api/v1/Randclip?id=${categoryId}&type=json`;

  try {
    console.log(`--- 开始请求最新短视频接口，分类: ${categoryId} ---`);
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("最新视频API实际返回数据:", data);

    // 💡 核心修正：根据实际数据，成功时 code 为 1，且 link 藏在 data.data 里面
    if (data.code === 1 && data.data && data.data.link) {
      // 完美组装成你前端需要的统一格式返回
      res.json({
        status: 'success',
        link: data.data.link
      });
    } else {
      console.error('新接口结构不匹配或返回错误:', data);
      res.status(500).json({ error: "API returned unexpected format", details: data });
    }

  } catch (error) {
    console.error("请求最新视频接口发生严重错误:", error);
    res.status(500).json({
      error: "Error fetching video"
    });
  }
});
// 🔹 完美适配 Bing 壁纸接口数据结构（解析 images[0].url）
app.get('/api/wallpaper', async (req, res) => {
  const size = req.query.size || 'UHD';
  const API_URL = `https://api.qzqi.com/api/v1/BingWallpaper?size=${size}&type=json`;

  try {
    console.log(`--- 开始请求Bing壁纸接口，分辨率: ${size} ---`);
    const response = await fetch(API_URL);
    const data = await response.json();

    // 💡 核心修正：从 images 数组的第一项中提取 url、title 和 copyright
    if (data.images && data.images.length > 0) {
      const imgInfo = data.images[0];
      
      res.json({
        status: 'success',
        url: imgInfo.url, // 已经是完整的 https 链接
        title: imgInfo.title || 'Bing Daily Wallpaper',
        copyright: imgInfo.copyright // 顺便把版权/图片故事信息传给前端（可选）
      });
    } else {
      console.error('壁纸接口返回的 images 数组为空或结构不匹配:', data);
      res.status(500).json({ error: "API returned unexpected format", details: data });
    }

  } catch (error) {
    console.error("请求Bing壁纸接口发生严重错误:", error);
    res.status(500).json({ error: "Error fetching wallpaper" });
  }
});
// 🔹 News route (新增)
// 🔹 News route (精准适配天行数据国内新闻接口)
app.get('/api/news', async (req, res) => {
  const API_KEY = '7e379d7f3330'; // 你的 APPKEY
  const API_URL = `https://whyta.cn/api/tx/guonei?key=${API_KEY}&num=20`; 

  try {
    console.log('--- 开始请求天行国内新闻接口 ---');
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.code !== 200) {
      console.error('接口内部返回失败:', data);
      return res.status(500).json({ error: 'Failed to fetch news', details: data.msg });
    }

    // 💡 破案：天行这个接口的数组藏在 data.result.newslist 里面
    const newsList = data?.result?.newslist || [];

    // 开始清洗数据，完美对接你前端 news.html 需要的属性
    const formattedItems = newsList.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.description || '点击查看详情', // 如果没有描述，用这个占位
      url: item.url,
      date: item.ctime // 对应前端的 item.date
    }));

    console.log(`[成功] 已成功抓取并清洗 ${formattedItems.length} 条国内新闻！`);
    
    // 保持你前端需要的 { items: [...] } 结构返回
    res.json({ items: formattedItems });

  } catch (e) {
    console.error('[失败] 后端请求新闻发生严重错误:', e.message);
    res.status(500).json({ error: 'Error fetching news', details: e.message });
  }
});

app.get('/api/newsDetail', async (req, res) => {
  const id = req.query.id;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing news ID parameter' });
  }
  
  const API_KEY = '7e379d7f3330';
  const API_URL = `https://whyta.cn/api/toutiao/detail?key=${API_KEY}&id=${id}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    // The API returns status: 'cache' when successful, not 'success'
    if (data.status !== 'cache' && data.status !== 'success') {
      console.error('API Error:', data);
      return res.status(500).json({ error: 'Failed to fetch news detail', details: data });
    }

    res.json(data.result);
  } catch (e) {
    console.error('Error fetching news detail:', e);
    res.status(500).json({ error: 'Error fetching news detail', details: e.message });
  }
});


app.get('/api/shortvideo', async (req, res) => {
  const keyword = req.query.text;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing "text" query parameter' });
  }

  const API_URL = `https://api.kuleu.com/api/action?text=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.code !== 200) {
      return res.status(500).json({ error: 'Failed to fetch short videos', details: data.msg });
    }

    res.json(data.data); // 只返回视频数组
  } catch (error) {
    console.error('Error fetching short videos:', error);
    res.status(500).json({ error: 'Error fetching short videos', details: error.message });
  }
});




//ai chat
function escapeSSE(str) {
  return String(str).replace(/\r?\n/g, "\\n");
}
app.get("/chat", async (req, res) => {
  const q = req.query.q || "";
  const model = req.query.model || "deepseek/deepseek-r1";
  const apiKeys = {
      "openai/gpt-oss-20b": process.env.OPENROUTER_API_KEY_GPT_OSS_20B,

  "deepseek/deepseek-r1": process.env.OPENROUTER_API_KEY_R1,

  "deepseek/deepseek-r1:0528": process.env.OPENROUTER_API_KEY_R1_0528,



  "google/gemini-2.5-flash": process.env.OPENROUTER_API_KEY_GEMINI,

  "meta-llama/llama-3.3-70b-instruct": process.env.OPENROUTER_API_KEY_LLAMA
};
    // Pick correct API key for model (fallback to R1's key)
    const apiKey = apiKeys[model] || process.env.OPENROUTER_API_KEY_GPT_OSS_20B;

  // ...

const bodyPayload = {
  model: model,
  messages: [{ role: "user", content: q }],
  stream: true,
  include_reasoning: true
};

// Only set max_tokens for DeepSeek models to limit token usage
bodyPayload.max_tokens = 1500;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const keepAlive = setInterval(() => {
    res.write(":\n\n");
  }, 15000);

  try {
    const completion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Authorization": `Bearer ${apiKey}`, 
        "HTTP-Referer": "https://z-box-djuf.onrender.com",
        "X-Title": "WSP ChatBot"
      },
      body: JSON.stringify(bodyPayload)
      
    });

    if (!completion.ok || !completion.body) {
      const text = typeof completion.text === "function" ? await completion.text().catch(() => "") : "";
      throw new Error(`Upstream error (${completion.status}): ${text}`);
    }

    let buffer = "";

    for await (const chunk of completion.body) {
      buffer += chunk.toString("utf8");

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const rawLine = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        const line = rawLine.trim();
        if (!line) continue;

        const dataPrefix = "data:";
        if (!line.startsWith(dataPrefix)) continue;

        const dataLine = line.slice(dataPrefix.length).trim();
        if (dataLine === "[DONE]") {
          res.write("event: done\ndata: \n\n");
          clearInterval(keepAlive);
          res.end();
          return;
        }

        try {
          const payload = JSON.parse(dataLine);
          const delta = payload.choices?.[0]?.delta || {};
          const content = delta.content;

          if (Array.isArray(content)) {
            for (const item of content) {
              if (item?.type === "reasoning" && item?.text) {
                res.write(`event: reasoning\ndata: ${escapeSSE(item.text)}\n\n`);
              } else if (item?.type === "output_text" && item?.text) {
                res.write(`event: answer\ndata: ${escapeSSE(item.text)}\n\n`);
              }
            }
          } else if (typeof content === "string" && content) {
            res.write(`event: answer\ndata: ${escapeSSE(content)}\n\n`);
          }

          const maybeReasoning = delta.reasoning_content || delta.reasoning;
          if (maybeReasoning) {
            const text = typeof maybeReasoning === "string" ? maybeReasoning : maybeReasoning.text || maybeReasoning.content;
            if (text) {
              res.write(`event: reasoning\ndata: ${escapeSSE(text)}\n\n`);
            }
          }
        } catch {
          // ignore partial JSON; it will be completed in subsequent chunks
        }
      }
    }

    clearInterval(keepAlive);
    res.write("event: done\ndata: \n\n");
    res.end();
  } catch (error) {
    clearInterval(keepAlive);
    res.write(`event: error\ndata: ${String(error.message || error)}\n\n`);
    res.end();
  }
});

import mongoose from 'mongoose';

// 1. 连接你刚才配置好的 Cloud Mongo 数据库
// 确保你在 .env 里写了 MONGODB_URI=mongodb+srv://Mikey:你的密码@...
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🚀 Cloud MongoDB 连接成功！'))
  .catch(err => console.error('❌ MongoDB 连接失败:', err));

// 2. 严格按照你的要求定义用户 Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true }, // 用户名唯一
  password: { type: String, required: true },             // 密码
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// 3. 【注册接口】
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ status: 'fail', message: '用户名和密码不能为空' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ status: 'fail', message: '该用户名已被注册' });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ status: 'success', message: '注册成功！请前往登录' });
  } catch (error) {
    res.json({ status: 'fail', message: '注册失败，服务器错误' });
  }
});

// 4. 【登录接口】
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.json({ status: 'fail', message: '用户名或密码错误' });
    }
    res.json({ status: 'success', message: '登录成功！', username: user.username });
  } catch (error) {
    res.json({ status: 'fail', message: '登录失败，服务器错误' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


