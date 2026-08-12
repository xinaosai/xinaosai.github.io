// 腾讯云 SCF (云函数) - Web 函数版 AI Chat 代理 v2
// 零依赖：只用 Node.js 内置模块（http/https），不用全局 fetch（SCF 环境兼容性更好）
// 部署：云函数 SCF → 新建 → Web 函数 → Node.js 18.15 → zip 上传
// 密钥：函数配置 → 环境变量 → AGNES_API_KEY（不暴露给浏览器）

const http = require('http');
const https = require('https');

const SYSTEM_PROMPT = `你是信奥赛C++（CSP-J/S/NOIP）辅导教练，名叫"小虾"🦐。

【核心规则 - 必须遵守】
1. 只回答编程、算法、数据结构、数学竞赛相关问题
2. 如果用户问非编程问题（如闲聊、情感、娱乐等），回复："🦐 小虾只聊编程哦～你问的算法题、C++语法、数据结构我都能帮你！"
3. 用苏格拉底式提问引导学生独立思考，不直接给答案
4. 一次只问一个问题，等学生回答后再继续
5. 用生活化类比解释复杂概念（比如把栈比作一摞盘子）
6. 回答简洁，不要一次说太多
7. 当学生卡住时，给出提示而不是答案
8. 用C++代码示例时，写完整可运行的代码
9. 语气幽默风趣但不轻浮`;

// 上游：Agnes（OpenAI 兼容接口）
const UPSTREAM_HOST = 'apihub.agnes-ai.com';
const UPSTREAM_PATH = '/v1/chat/completions';
const UPSTREAM_MODEL = 'agnes-2.0-flash';

// 用 https 模块调用上游（兼容性最好的方式）
function callUpstream(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: UPSTREAM_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 1500
    });

    const req = https.request({
      hostname: UPSTREAM_HOST,
      path: UPSTREAM_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, body: { raw: data } });
        }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('Upstream timeout')); });
    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  // CORS：允许浏览器跨域调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 只接受 POST /api/chat
  const path = req.url.split('?')[0];
  if (req.method !== 'POST' || path !== '/api/chat') {
    sendJson(res, 405, { error: 'Use POST /api/chat' });
    return;
  }

  // 读取请求体
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const messages = parsed.messages;
      if (!messages || !Array.isArray(messages)) {
        sendJson(res, 400, { error: 'Missing messages array' });
        return;
      }

      const apiKey = process.env.AGNES_API_KEY;
      if (!apiKey) {
        sendJson(res, 500, { error: 'Server AGNES_API_KEY not configured' });
        return;
      }

      // 转发到上游 AI
      const upstream = await callUpstream(apiKey, messages);

      if (upstream.status !== 200 || upstream.body.error) {
        sendJson(res, 500, { error: (upstream.body.error && upstream.body.error.message) || ('Upstream HTTP ' + upstream.status) });
        return;
      }

      const reply = upstream.body.choices && upstream.body.choices[0]
        ? (upstream.body.choices[0].message && upstream.body.choices[0].message.content)
        : null;

      sendJson(res, 200, { reply: reply || '抱歉，我暂时无法回答。' });
    } catch (e) {
      sendJson(res, 500, { error: e.message });
    }
  });
});

// SCF Web 函数固定监听 9000 端口
server.listen(9000, '0.0.0.0', () => {
  console.log('SCF web function listening on 9000');
});
