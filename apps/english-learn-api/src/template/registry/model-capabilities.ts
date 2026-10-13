/**
 * 定义AI模型的能力枚举
 */
export enum ModelCapability {
  TEXT = 'text', // 基本文本理解和生成能力
  IMAGE = 'image', // 图像理解能力
  FUNCTION_CALLING = 'function_calling', // 函数调用能力
  STRUCTURED_OUTPUT = 'structured_output', // 结构化输出能力
  CODE = 'code', // 代码生成和理解能力
  AUDIO = 'audio', // 音频处理能力
  MULTILINGUAL = 'multilingual', // 多语言能力
}

/**
 * 表示AI模型需要的能力集合
 */
export type ModelCapabilities = ModelCapability[]

/**
 * 检查给定的能力集合是否包含指定的能力要求
 * @param available 可用能力集合
 * @param required 所需能力集合
 * @returns 是否满足要求
 */
export function hasRequiredCapabilities(
  available: ModelCapabilities,
  required: ModelCapabilities
): boolean {
  return required.every((capability) => available.includes(capability))
}
