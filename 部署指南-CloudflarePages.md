# 🚀 Cloudflare Pages 部署指南（免实名 · 免费 · 国内直连）

> 为什么换：原方案 Vercel 的 `*.vercel.app` 域名在国内被 DNS 污染（实测解析到 Facebook/Twitter 的 IP），不开 VPN 根本连不上。
> 新方案：Cloudflare Pages —— 邮箱注册即可，**不需要身份证/实名认证**，免费版每天 10 万次请求，`pages.dev` 域名国内实测可直连（3 秒内）。

---

## 一、准备工作（5 分钟）

1. 注册 Cloudflare 账号：https://dash.cloudflare.com/signup
   - 只需要邮箱 + 密码，无需手机号实名（用你自己邮箱就行）
2. 准备你的 GitHub 仓库（已有：`xinaosai/xinaosai.github.io`）
3. 准备 Agnes API Key（你已经有 `AGNES_API_KEY`，就是现在 Vercel 环境变量里那个）

---

## 二、把代码推到 GitHub

本次已新增/修改的文件：

| 文件 | 作用 |
|------|------|
| `functions/api/chat.js` | ✅ 新增 — AI 代理函数（Cloudflare Pages Functions 版，逻辑与原 Vercel 版一致） |
| `ai-tutor.html` | ✅ 修改 — AI 接口地址改为同源相对路径 `/api/chat` |

在项目目录执行：

```bash
git add -A
git commit -m "迁移 AI 代理到 Cloudflare Pages"
git push
```

---

## 三、部署到 Cloudflare Pages（10 分钟）

1. 打开 https://dash.cloudflare.com → 左侧选 **Workers 和 Pages** → **创建** → **Pages** → **连接到 Git**
2. 授权 GitHub，选择仓库 `xinaosai/xinaosai.github.io`
3. 构建设置：
   - **框架预设**：None（纯静态站）
   - **构建命令**：留空
   - **输出目录**：留空（站点文件在根目录）
4. 点击 **保存并部署**，等 1-2 分钟

部署完成后你会得到一个地址：`https://你的项目名.pages.dev`

---

## 四、配置 AI 密钥（关键！）

1. 在 Pages 项目页面 → **设置** → **环境变量** → **生产环境**
2. 添加变量：名称 `AGNES_API_KEY`，值 = 你的 Agnes API Key（和原来 Vercel 里的一样）
3. 保存后 → **部署** 标签页 → 对最新部署点 **⋮** → **重试部署**（让变量生效）

> ⚠️ 没配这个变量的话，AI 会报 "Server AGNES_API_KEY not configured"

---

## 五、验证

浏览器打开 `https://你的项目名.pages.dev/ai-tutor.html`

- 页面能打开 ✅
- 登录后问 AI 一道题，能正常回复 ✅（走的是 `/api/chat`，同源，无跨域问题）

---

## 六、（可选）绑定自己的域名

以后如果你有域名（比如爸爸/妈妈帮忙注册一个，或你自己用零花钱买），可以：
1. Pages 项目 → **自定义域** → 添加域名
2. 按提示把域名 DNS 托管到 Cloudflare（或加 CNAME）
3. 国内访问更快更稳，且 `pages.dev` 万一被墙也有退路

---

## 七、常见问题

- **AI 报错 500 / API error**：检查 `AGNES_API_KEY` 是否配好、是否重试部署
- **想换上游模型**（比如换 DeepSeek/智谱）：改 `functions/api/chat.js` 顶部的 `UPSTREAM_URL` 和 `UPSTREAM_MODEL`，重推代码即可
- **旧 Vercel 版本**：不用删，先留着当备份；确认 Pages 版稳定后再清理

---

## 📌 记忆点

- 部署平台：Cloudflare Pages（免实名、免费、国内直连）
- 代理函数：`functions/api/chat.js`（原 `api/chat.js` 是 Vercel 版，保留作备份）
- 前端调用：`ai-tutor.html` 里 `CHAT_API_URL = '/api/chat'`（同源相对路径）
- 环境变量：`AGNES_API_KEY`
- 部署时间：2026-08-12 由小虾 🦐 协助准备
