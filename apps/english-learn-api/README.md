# 英语学习API

## AI 模型

运行时统一使用 Google 的 `gemini-3.8-flash`。模型名称不会从客户端配置中选择，旧模型只在历史数据中保留。

## 设置环境变量

要使用 Gemini，需要设置以下环境变量:

```
# Gemini API 密钥
GEMINI_API_KEY=your_gemini_api_key
```

## 使用 Gemini 模型

示例代码:

```typescript
// model 字段仅保留向后兼容，服务端会忽略它
const chatResult = await aiProxyService.continueWriting({
  title: 'The impact of artificial intelligence on society',
  context: 'Artificial intelligence has become increasingly integrated into our daily lives...',
  model: 'gemini-3.8-flash',
}, userInfo);

// 模型参数仅为历史兼容字段，服务端会统一路由到 Gemini 3.8 Flash
const codeResult = await aiProxyService.continueWriting({
  title: 'Write a function to calculate the Fibonacci sequence',
  context: 'I need a JavaScript function to calculate the Fibonacci sequence efficiently.',
  model: 'gemini-3.8-flash',
}, userInfo);
```

## 运行示例

AI 请求使用 Gemini Developer API 的 `generateContent` 接口：

```
GEMINI_API_KEY=your-key yarn workspace english-learn-api start
```

## 代码架构

我们使用适配器模式来支持不同的AI模型。主要组件包括:

- `ModelAdapter`: 所有模型适配器的接口
- `ModelAdapterFactory`: 负责创建和管理模型适配器的工厂
- 具体适配器实现: `GeminiAdapter`

这种架构使得添加新的模型变得简单，只需:
1. 创建一个新的适配器类实现`ModelAdapter`接口
2. 在`AiProxyService`中注册适配器

## 模型策略

运行时只暴露 `gemini-3.8-flash`。旧模型名称仅为兼容历史数据库记录保留，不会被适配器调用。

## 本地开发

项目根目录统一使用 Yarn 1.22.22 和 Node.js 22：

```bash
yarn install --frozen-lockfile --ignore-scripts
yarn workspace @repo/entity-ts-definition build
yarn workspace english-learn-api start
```

生产环境推荐使用根目录的 Cloudflare Worker 构建：`yarn build:cloudflare`。
