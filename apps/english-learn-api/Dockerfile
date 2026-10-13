# 基础阶段
FROM node:18-alpine AS base

# Builder 阶段 - 用于 turbo prune
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune english-learn-api --docker

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

# 然后构建 API
WORKDIR /app/apps/english-learn-api
RUN yarn build

# Runner 阶段 - 生产环境运行
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 复制构建产物和依赖
COPY --from=installer /app/apps/english-learn-api/dist ./dist
COPY --from=installer /app/apps/english-learn-api/package.json ./
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages

# 切换到非 root 用户
USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]
