# 基础阶段
FROM node:18-alpine AS base

# Builder 阶段 - 用于 turbo prune
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune english-learn-web --docker

# Installer 阶段 - 安装依赖和构建
FROM base AS installer
WORKDIR /app

# 复制 package.json 等文件
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/yarn.lock ./yarn.lock
COPY --from=pruner /app/out/full/ .

# 安装依赖
RUN yarn install --frozen-lockfile

# 先构建 entity-ts-definition
WORKDIR /app/packages/entity-ts-definition
RUN yarn build

# 再构建 eslint-config
WORKDIR /app/packages/eslint-config
RUN yarn build || true

# 最后构建 web
WORKDIR /app/apps/english-learn-web
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV SKIP_LINT=true
RUN yarn build

# Runner 阶段 - 生产环境运行
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=installer /app/apps/english-learn-web/public ./public
COPY --from=installer /app/apps/english-learn-web/.next ./.next
COPY --from=installer /app/apps/english-learn-web/node_modules ./node_modules
COPY --from=installer /app/apps/english-learn-web/package.json ./package.json
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages

USER nextjs

EXPOSE 3000

CMD ["yarn", "start"]
