# WriteEssay AI — Cloudflare Workers

AI 英语写作、评分、题库和管理后台。前端、API 和管理后台部署在**同一个 Cloudflare Worker**，继续使用已有 Supabase；云端不需要 Node 服务器、Docker 或 Redis。所有 AI 请求统一由后台路由到 Gemini 3.8 Flash，用户端不再选择供应商或旧模型。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FADKcodeXD%2FWriteEssay-AIPowerd)

> 按钮必须指向包含本次改动的 GitHub 仓库。若使用自己的 fork，请将上方 URL 替换成该 fork，推送修改后再点击。

- 用户页面：`/zh-CN/broswer`
- API：`/api/essay/getList` 等原接口路径
- 管理后台：`/admin/`
- 健康检查：`/healthz`

完整步骤见 [Cloudflare 部署说明](docs/CLOUDFLARE.md)。首次需要填写自己的 Supabase / Gemini 密钥和 AI 配置加密密钥；管理员登录 `/admin/` 后可更新 Gemini Base URL 和密钥。之后 push 默认分支自动测试、构建和部署，也可在 GitHub Actions 点击 Run workflow。

## 本地运行 Workers

```powershell
yarn install --frozen-lockfile --ignore-scripts
# 仅第一次执行；已有 .dev.vars 时不要覆盖。
Copy-Item .dev.vars.example .dev.vars
# 编辑 .dev.vars，填入 Supabase、Gemini 和 AI 配置加密密钥。
yarn build:cloudflare
yarn preview:cloudflare
```

打开 `http://localhost:8787/zh-CN/broswer`。`--ignore-scripts` 跳过与运行无关的 Supabase CLI 下载；构建依赖的 esbuild/SWC 平台包由锁文件安装。

## 保留的 Node 本地开发方式

将本地配置放在各 app 的 `.env.local`。NestJS 本地模式仍使用 Redis；Workers 模式不使用 Redis。

```powershell
yarn workspace @repo/entity-ts-definition build
yarn workspace english-learn-api start --watch
yarn workspace english-learn-web dev
```

`yarn build:apps` 构建原有各应用；`yarn build` / `yarn build:cloudflare` 生成 Cloudflare 产物。

## 验证

```powershell
yarn test:cloudflare
yarn build:cloudflare
yarn wrangler deploy --dry-run
```

CI 不使用生产密钥构建。仅部署阶段读取 GitHub Secrets。仓库历史中的凭据已从当前配置文件移除，本机原配置保留在被 Git 忽略的 `.env.local` 和 `.local-run/legacy-env/`；这些修改不会清除 Git 历史，已公开的凭据需要由其所有者撤销或轮换。
