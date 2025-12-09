// API 服务商预设
export const API_PROVIDERS = [
  { value: 'weapi', label: 'WeAPIs (推荐)', url: 'https://vg.v1api.cc/v1' },
  { value: 'deepseek', label: 'DeepSeek 官方', url: 'https://api.deepseek.com' },
  { value: 'siliconflow', label: '硅基流动', url: 'https://api.siliconflow.cn/v1/' },
  { value: 'openai', label: 'OpenAI 官方', url: 'https://api.openai.com/v1' },
  { value: 'custom', label: '自定义', url: '' },
] as const

// WeAPIs 专用模型列表
export const WEAPI_MODELS = [
  { value: 'deepseek-v3-0324', text: 'deepseek-v3-0324 (推荐)' },
  { value: 'gemini-2.5-pro', text: 'gemini-2.5-pro * (推荐，体验感更好)' },
  { value: 'gemini-3-pro', text: 'gemini-3-pro * (推荐)' },
  { value: 'gemini-2.0-flash-exp', text: 'gemini-2.0-flash-exp (推荐)' },
  { value: 'claude-sonnet-4-5-20250929', text: 'claude-sonnet-4-5-20250929 * (推荐)' },
  { value: 'gemini-2.5-pro-06-05', text: 'gemini-2.5-pro-06-05 *' },
  { value: 'gemini-2.5-pro-exp-03-25', text: 'gemini-2.5-pro-exp-03-25 *' },
  { value: 'gemini-2.5-pro-05-06', text: 'gemini-2.5-pro-05-06 *' },
  { value: 'gemini-2.5-flash', text: 'gemini-2.5-flash' },
  { value: 'claude-3-7-sonnet-20250219', text: 'claude-3-7-sonnet-20250219 *' },
  { value: 'claude-sonnet-4-20250514', text: 'claude-sonnet-4-20250514 *' },
  { value: 'doubao-pro-256k-241115', text: '豆包 doubao-pro-256k-241115' },
  { value: 'deepseek-ai/DeepSeek-V3', text: 'deepseek-ai/DeepSeek-V3' },
  { value: 'deepseek-ai/DeepSeek-R1', text: 'deepseek-ai/DeepSeek-R1' },
  { value: 'deepseek-r1-searching', text: 'deepseek-r1-searching (带联网功能)' },
  { value: 'claude-3-5-sonnet-20241022', text: 'claude-3-5-sonnet-20241022 *' },
  { value: 'claude-3-5-haiku-20241022', text: 'claude-3-5-haiku-20241022' },
  { value: 'gemini-2.0-flash-thinking-exp-1219', text: 'gemini-2.0-flash-thinking-exp-1219' },
  { value: 'gpt-3.5-turbo', text: 'gpt-3.5-turbo' },
  { value: 'o4-mini', text: 'o4-mini' },
  { value: 'gpt-4o', text: 'gpt-4o *' },
  { value: 'gpt-4.1', text: 'gpt-4.1 *' },
  { value: 'gpt-4o-mini', text: 'gpt-4o-mini' },
  { value: 'gpt-4.1-mini', text: 'gpt-4.1-mini' },
] as const

// DeepSeek 官方模型列表
export const DEEPSEEK_MODELS = [
  { value: 'deepseek-chat', text: 'DeepSeek Chat (V3)' },
  { value: 'deepseek-reasoner', text: 'DeepSeek Reasoner (R1)' },
] as const

// 硅基流动模型列表
export const SILICONFLOW_MODELS = [
  { value: 'deepseek-ai/DeepSeek-V3', text: 'DeepSeek V3 (免费额度)' },
  { value: 'deepseek-ai/DeepSeek-R1', text: 'DeepSeek R1 (免费额度)' },
  { value: 'Pro/deepseek-ai/DeepSeek-V3', text: 'DeepSeek V3 Pro (需充值)' },
  { value: 'Pro/deepseek-ai/DeepSeek-R1', text: 'DeepSeek R1 Pro (需充值)' },
  { value: 'Qwen/Qwen2.5-7B-Instruct', text: '通义千问 2.5-7B (免费)' },
] as const

// 根据 API URL 获取对应的模型列表（仅 WeAPIs 有预设模型，其他都让用户自己填写）
export function getModelsForProvider(apiUrl: string): { value: string; text: string }[] {
  if (!apiUrl) return []
  
  // 仅 WeAPIs 返回预设模型列表（支持多个域名）
  if (apiUrl.includes('v1api.cc') || apiUrl.includes('v1chat.cc') || apiUrl.includes('a3e.top') || apiUrl.includes('weapi') || apiUrl.includes('vg.v1chat.cc')) {
    return [...WEAPI_MODELS]
  }
  // 其他服务商都让用户自己填写模型名
  return []
}

// 检测 API URL 对应的服务商
export function detectProvider(apiUrl: string): string {
  if (!apiUrl) return 'custom'
  if (apiUrl.includes('v1api.cc') || apiUrl.includes('v1chat.cc') || apiUrl.includes('a3e.top')) return 'weapi'
  if (apiUrl.includes('api.deepseek.com')) return 'deepseek'
  if (apiUrl.includes('siliconflow.cn')) return 'siliconflow'
  if (apiUrl.includes('api.openai.com')) return 'openai'
  return 'custom'
}

// 模型选项列表 - 统一配置（兼容旧代码）
export const MODEL_OPTIONS = [
  { value: 'deepseek-v3-0324', text: 'deepseek-v3-0324 (推荐)' },
  { value: 'gemini-2.5-pro', text: 'gemini-2.5-pro * (推荐)' },
  { value: 'gemini-3-pro', text: 'gemini-3-pro * (推荐)' },
  { value: 'gemini-2.0-flash-exp', text: 'gemini-2.0-flash-exp (推荐)' },
  { value: 'claude-sonnet-4-5-20250929', text: 'claude-sonnet-4-5-20250929 * (推荐)' },
  { value: 'gemini-2.5-pro-06-05', text: 'gemini-2.5-pro-06-05 *' },
  { value: 'gemini-2.5-pro-exp-03-25', text: 'gemini-2.5-pro-exp-03-25 *' },
  { value: 'gemini-2.5-pro-05-06', text: 'gemini-2.5-pro-05-06 *' },
  { value: 'gemini-2.5-flash', text: 'gemini-2.5-flash' },
  { value: 'claude-3-7-sonnet-20250219', text: 'claude-3-7-sonnet-20250219 *' },
  { value: 'claude-sonnet-4-20250514', text: 'claude-sonnet-4-20250514 *' },
  { value: 'doubao-pro-256k-241115', text: '豆包 doubao-pro-256k-241115' },
  { value: 'deepseek-ai/DeepSeek-V3', text: 'deepseek-ai/DeepSeek-V3' },
  { value: 'deepseek-ai/DeepSeek-R1', text: 'deepseek-ai/DeepSeek-R1' },
  { value: 'deepseek-r1-searching', text: 'deepseek-r1-searching (联网)' },
  { value: 'claude-3-5-sonnet-20241022', text: 'claude-3-5-sonnet-20241022 *' },
  { value: 'claude-3-5-haiku-20241022', text: 'claude-3-5-haiku-20241022' },
  { value: 'gemini-2.0-flash-thinking-exp-1219', text: 'gemini-2.0-flash-thinking-exp' },
  { value: 'gpt-3.5-turbo', text: 'gpt-3.5-turbo' },
  { value: 'o4-mini', text: 'o4-mini' },
  { value: 'gpt-4o', text: 'gpt-4o *' },
  { value: 'gpt-4.1', text: 'gpt-4.1 *' },
  { value: 'gpt-4o-mini', text: 'gpt-4o-mini' },
  { value: 'gpt-4.1-mini', text: 'gpt-4.1-mini' },
] as const

// 默认模型
export const DEFAULT_MODEL = 'deepseek-v3-0324'

// 获取模型显示文本
export const getModelDisplayText = (model: string): string => {
  const found = MODEL_OPTIONS.find(m => m.value === model)
  return found ? found.text : model
}

// 检查是否为预设模型
export const isPresetModel = (model: string): boolean => {
  return MODEL_OPTIONS.some(m => m.value === model)
}
