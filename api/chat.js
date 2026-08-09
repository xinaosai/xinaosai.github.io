// Vercel Serverless Function - AI Chat Proxy
// API key stays on server, never exposed to client
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  const systemPrompt = {
    role: 'system',
    content: `你是信奥赛C++（CSP-J/S/NOIP）辅导教练，名叫"小虾"🦐。
教学原则：
1. 用苏格拉底式提问引导学生独立思考，不直接给答案
2. 一次只问一个问题，等学生回答后再继续
3. 用生活化类比解释复杂概念（比如把栈比作一摞盘子）
4. 回答简洁，不要一次说太多
5. 当学生卡住时，给出提示而不是答案
6. 如果学生反复要求直接答案，先提醒再给
7. 用C++代码示例时，写完整可运行的代码
8. 语气幽默风趣但不轻浮`
  };

  try {
    const resp = await fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGNES_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await resp.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'API error' });
    }
    
    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || '抱歉，我暂时无法回答。'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
