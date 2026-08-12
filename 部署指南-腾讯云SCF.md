# 🚀 腾讯云 SCF 部署指南（云函数 · 国内直连 · 免费额度）

> 为什么换：Vercel 的 `*.vercel.app` 域名在国内被 DNS 污染（实测解析到 Facebook/Twitter IP），不开 VPN 连不上。
> 新方案：腾讯云 SCF 云函数 —— **国内直连、免备案、有免费额度**（每月 40万次调用 + 40万GBs，个人站完全够用）。
> 上游继续用你现有的 Agnes API key，**不用新注册任何 AI 服务**。

---

## 一、准备

1. 腾讯云账号（你已有 ✅）
2. 你的 Agnes API Key（`AGNES_API_KEY`，就是原来 Vercel 环境变量里那个）
3. 本项目的 `scf/index.js`（已写好，零依赖，直接粘贴）

---

## 二、创建云函数（10 分钟）

1. 打开腾讯云控制台 → 搜索 **云函数 SCF** → https://console.cloud.tencent.com/scf
2. 点 **函数服务** → **新建**
3. 配置：
   - **创建方式**：从头开始（空白函数）
   - **函数名称**：`xinaosai-ai-chat`（随意）
   - **地域**：选离你近的（广州/上海均可）
   - **运行环境**：**Node.js 18.15**
   - **函数类型**：**Web 函数**（关键！可以直接被 HTTP 访问）
   - **创建方式**：在线编辑
4. 把 `scf/index.js` 的内容**全部粘贴**进 `index.js` 编辑器
5. 点 **完成**（先别急着测，还要配 key）

---

## 三、配置密钥（关键！）

1. 函数详情页 → **函数配置** → 右上角 **编辑**
2. 找到 **环境变量** → 添加：
   - 键：`AGNES_API_KEY`
   - 值：你的 Agnes API Key
3. 保存

> ⚠️ 不配这个变量，AI 会报 "Server AGNES_API_KEY not configured"

---

## 四、开启公网访问（拿 URL）

1. 函数详情页 → **触发管理** → **创建触发器**
2. 配置：
   - **触发方式**：API 网关触发
   - **API 服务**：新建 API 服务
   - **路径**：`/api/chat`
   - **请求方法**：POST
   - **发布环境**：发布
3. 创建后，你会得到一个访问地址，形如：
   `https://service-xxxx-xxxx.gz.apigw.tencentcs.com/release/api/chat`
4. **把这个地址发给我**（或自己记下来），我帮你把前端 `ai-tutor.html` 里的 `CHAT_API_URL` 改成它

---

## 五、验证

把完整地址复制到浏览器地址栏不行（要 POST），可以用这个方式测试：

在电脑上打开浏览器开发者工具（F12）→ Console 粘贴：

```js
fetch('https://你的完整地址/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }] })
}).then(r => r.json()).then(d => console.log(d))
```

返回 `{reply: "🦐 小虾只聊编程哦～..."}` 就说明通了 ✅

---

## 六、改前端（告诉我地址，我来改，或你自己改）

`ai-tutor.html` 顶部：

```js
var CHAT_API_URL = 'https://你的完整地址/api/chat';
```

改完 `git push`，GitHub Pages / Vercel 都会自动更新（前端文件随便放哪都行，只要 AI 接口走腾讯云）。

---

## 📌 记忆点

- 部署平台：腾讯云 SCF 云函数（Web 函数 + API 网关触发器）
- 函数代码：`scf/index.js`（零依赖，Node.js 18.15）
- 环境变量：`AGNES_API_KEY`
- 访问路径：`POST /api/chat`
- 前端修改：`ai-tutor.html` 的 `CHAT_API_URL`
- 部署时间：2026-08-12 由小虾 🦐 协助准备

---

## 备选方案（如果腾讯云实名卡住）

之前准备的 Cloudflare Pages 方案仍然有效（邮箱注册、免实名）：
- `functions/api/chat.js`（Pages Functions 版代理）
- `部署指南-CloudflarePages.md`
