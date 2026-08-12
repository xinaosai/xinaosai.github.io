// Cloudflare Pages Functions - AI Chat Proxy
// 部署到 Cloudflare Pages 后，访问路径为 /api/chat
// API key 存在服务器端环境变量 AGNES_API_KEY，不会暴露给浏览器
// 注册：Cloudflare 邮箱注册即可，无需实名认证，免费版每天 10 万次请求

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

// 上游可切换：默认 Agnes；如需换其他 OpenAI 兼容 API，改这里 + 环境变量即可
const UPSTREAM_URL = 'https://apihub.agnes-ai.com/v1/chat/completions';
const UPSTREAM_MODEL = 'agnes-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Use POST' }, 405);
  }

  let messages;
  try {
    ({ messages } = await request.json());
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!messages || !Array.isArray(messages)) {
    return json({ error: 'Missing messages array' }, 400);
  }

  const apiKey = env.AGNES_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server AGNES_API_KEY not configured' }, 500);
  }

  try {
    const resp = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: UPSTREAM_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await resp.json();

    if (data.error) {
      return json({ error: data.error.message || 'API error' }, 500);
    }

    return json({
      reply: data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答。'
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
