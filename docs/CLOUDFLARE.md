# Cloudflare 单 Worker 部署

## 架构

同一个 Worker 提供 Next.js 前端、Hono API、管理后台静态文件，并消费 Cloudflare Queues。API 复用原 NestJS 的业务服务和评分提示词，但不启动 Nest HTTP 服务、不连接 Redis、不运行 BullMQ 常驻进程。

| 能力 | 云端实现 |
| --- | --- |
| 前端 SSR | Next.js 14.2.35 + OpenNext 1.14.0 |
| API | Hono，路径 `/api/*` |
| 登录、题库、评分记录、配额 | 已有 Supabase |
| 公共标签缓存 | Workers KV，60 秒 |
| 用户身份、配额读取 | Supabase 每次校验，请求内缓存，不使用 KV 存储权限 |
| 文章标签、短标题生成 | Queues，失败重试 3 次后进入死信队列 |
| AI 使用记录、评分结果 | 在请求结束前等待写入 Supabase，避免队列重复消费导致重复扣费 |
| AI 配置 | `/admin/` 首页可更新 Gemini Base URL 和密钥；密钥使用 Worker Secret 加密后存入 KV，只显示末四位 |
| 管理后台 | `/admin/`，与 API 同源 |

需要启用 Workers、KV、Queues。此项目按 Workers Paid 配置了 CPU 上限；它不使用 Containers。Workers Paid 的额度/费用与 Supabase、AI 供应商分别计算。参考 [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)。

## 方式一：Deploy to Cloudflare 按钮

1. 将这次修改推送到你控制的 GitHub 仓库。README 按钮中的仓库 URL 必须指向这个版本，不能仍指向未修改的上游仓库。
2. 点击 README 的 **Deploy to Cloudflare**，选择 Cloudflare 账号、GitHub 仓库和应用名称。
3. 根目录选择仓库根目录，**不要选择 `apps/english-learn-web` 子目录**，因为构建需要共享包和 API 源码。
4. 检查构建设置：Node.js 22，安装命令 `yarn install --frozen-lockfile --ignore-scripts`，构建命令 `yarn build`，部署命令 `yarn deploy`。非生产分支不要设置自动部署生产 Worker 的命令。
5. 根据 `.dev.vars.example` 提示填写运行时 Secrets。若界面未提示，首次部署后到 Worker → Settings → Variables and Secrets 添加，再重新部署。

`yarn deploy` 幂等创建主队列和死信队列，随后 Wrangler 部署 Worker 并自动创建/复用 KV。队列创建遇到权限或网络错误会停止部署，不会被当作“已存在”。在同一账号部署多个副本时，修改 `wrangler.jsonc` 中 Worker 名和两个队列名，避免共享消费者。

自动资源创建需要部署 Token 对 Workers Scripts、Workers KV Storage、Queues 有编辑权限。使用 Workers Builds 自动生成的 Token 时也要确认有这些权限。首次授权、密钥填写和 Supabase 回调地址配置完成后，后续部署不需要重复操作。

官方参考：[Deploy 按钮](https://developers.cloudflare.com/workers/platform/deploy-buttons/)、[OpenNext 自定义 Worker](https://opennext.js.org/cloudflare/howtos/custom-worker)。

## 方式二：GitHub Actions CI/CD

工作流：`.github/workflows/cloudflare.yml`。

- PR：锁定依赖安装 → API 回归测试 → 完整生产构建 → Wrangler dry-run。不会读取生产 Secrets、不会部署。
- push 到 `main` / `master`：执行同样检查，仅仓库默认分支进入部署任务。
- 手动部署：Actions → **Cloudflare CI/CD** → **Run workflow**，选择默认分支。
- 部署后先写入运行时 Secrets，再验证 Worker、中文页面、Supabase 文章列表。任何一步失败，工作流失败。
- 部署串行执行，避免两个发布互相覆盖；没有自动回滚数据库或队列。

在 GitHub 的 `production` Environment 或仓库 Settings → Secrets and variables → Actions 中设置：

| Secret | 内容 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 目标账号的 Workers Scripts、Workers KV Storage、Queues 编辑权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `SUPABASE_URL` | 现有 Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | 浏览器可用的 anon/public key，**不能填 service-role key** |
| `SUPABASE_KEY` | 后端 service-role key，只进入 Worker Secrets |
| `GEMINI_API_KEY` | Gemini API Key，所有 AI 功能统一使用 `gemini-3.8-flash` |
| `AI_SETTINGS_ENCRYPTION_KEY` | 用于加密管理后台保存的 AI 密钥，建议使用随机生成的长字符串 |

设置 Actions **Variable**：`DEPLOY_URL=https://writeessay.<你的子域>.workers.dev`，或你绑定的自定义域名。它只用于部署后的验证，不会被写入前端包。

可选 Secret：`TEXT_GEARS_SECRET`。旧的 GPT、Gemini 1.x、Gemini 2.x、Claude、DeepSeek、Grok 模型已从运行时适配器和用户模型选择中移除；历史记录只保留原始字符串，不再作为可选模型调用。

如已选用 Workers Builds 自动部署，建议只保留一个生产部署来源，避免它与 GitHub Actions 同时发布。GitHub 工作流的 `deploy` job 可禁用，保留 PR/构建检查。

## 已有 Supabase 配置

这次迁移不创建、不覆盖 Supabase 数据，不需要为了 Cloudflare 新建数据库。原有表、函数和 Storage Bucket 继续使用，包括 `article`、`tag`、`users`、`ratelog`、`modeloutputrecord`、`questions`、`question_relate`，以及原有配额和统计 RPC。

Auth → URL Configuration：

- Site URL 设置为最终部署域名。
- Redirect URLs 添加 `https://<部署域名>/en/auth/callback`、`/zh-CN/auth/callback`、`/ja/auth/callback`。
- 需要 Google/GitHub 登录时，继续使用 Supabase 中配置的对应 OAuth Provider。

管理 API 的写入操作要求已认证用户的 **`app_metadata.role` 为 `admin`**。请通过 Supabase 服务端管理接口或仪表板设置；不要用用户可以自行修改的 `user_metadata` 授权。管理后台直接访问 Supabase 的表和 Storage，仍由你现有的 RLS/Storage Policies 控制。

## 本地预览和部署

```powershell
yarn install --frozen-lockfile --ignore-scripts
# 仅首次复制，已有文件请直接编辑。
Copy-Item .dev.vars.example .dev.vars
yarn test:cloudflare
yarn build:cloudflare
yarn preview:cloudflare
```

本地地址 `http://localhost:8787/zh-CN/broswer`，管理端 `/admin/`。KV、Queues 是本地模拟；Supabase 仍连接 `.dev.vars` 中指定的远程数据库。不要在预览中执行不希望写入数据库的管理操作。

手动云端部署：先 `yarn wrangler login`，再 `yarn deploy:cloudflare`。首次还需按 `.dev.vars.example` 中的六个名字逐项执行 `yarn wrangler secret put <名字>` 输入真实值。`.dev.vars` **不会**自动上传。

管理后台的 AI 配置保存到 Workers KV，并使用 `AI_SETTINGS_ENCRYPTION_KEY` 做 AES-GCM 加密。管理员可配置模型 ID、Base URL 和密钥，默认模型为 `gemini-3.8-flash`；前台不提供模型选项，也不提交模型参数。生产环境必须配置该 Secret；如果只配置 `GEMINI_API_KEY`，Worker 会正常调用 Gemini，但管理后台不会允许保存新的密钥。

构建不会使用本机 `.env*`：构建脚本暂时排除这些文件，正常完成或失败时恢复它们，并检查生成包是否含本地已知私密凭据。构建期间请勿同时运行 Next 开发服务器、Wrangler 预览或修改 `.env*`。如果强行终止整个进程树导致无法执行恢复逻辑，可以从本机 `.local-run/legacy-env/` 恢复旧配置，或重新填写 `.env.local`；云端构建不依赖这些文件。

## 运行和排查

- `/healthz` 返回 `{ "status": "ok", "runtime": "cloudflare-workers" }` 说明 Worker 正常启动；Supabase 是否可用需通过文章列表接口验证。
- 本地和云端都用 `/api/essay/getList`，POST `{"page":1,"pageSize":1}`；前端不再请求 localhost 后端。
- 查看日志：`yarn wrangler tail`。缺少 AI 供应商配置、模型退役、数据库 RPC 不匹配等错误，需要按具体供应商/数据库处理。
- 队列失败会重试，最终进入 `writeessay-enrichment-dlq`。在 Cloudflare Queues 仪表板查看并处理。重复投递时，已生成的标题/标签会跳过；并发重试仍可能产生额外的系统 AI 请求。
- AI 评分、翻译、润色、续写和队列增强采用管理员配置的模型，默认 `gemini-3.8-flash`。客户端传入的旧模型名会被忽略，配额统一使用 standard RPC；配额扣减仍使用已有 RPC，本次迁移没有把原业务的多次写入改造成数据库事务，也没有重做高并发额度预占。

当前请求链使用轻量的原生 Gemini 结构化输出适配器和显式边界的请求循环，不再把多个供应商适配器打进 Worker。需要长连接、多轮工具调用或人工审批时，再拆出 Cloudflare Agents SDK 的 Durable Object Agent；短时评分请求继续留在 Worker，避免为每次请求创建有状态 Agent。
- 本地已验证构建和 Workers 运行时。只有配置账号后实际运行远程工作流，才能确认账号权限、资源额度、自定义域名和 OAuth 完整流程。

## 回滚

在 GitHub 回退到上一份已验证的提交，再运行工作流，会同时发布对应的前端和 API。也可使用 Cloudflare 的版本回滚；回滚代码不会回滚 Supabase 数据或撤销已经执行的队列任务。Secret 更新独立于构建产物，回滚时也要确认配置匹配。
