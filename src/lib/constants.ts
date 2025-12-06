// 模型选项列表 - 统一配置
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
