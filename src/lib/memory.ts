import { sendChatMessage } from './api'
import type { TempMemoryLog, CoreMemory } from '@/types'

interface OrganizeMemoryParams {
  messages: Array<{ role: string; content: string; dateTime?: string }>
  roleName: string
  apiKey: string
  apiBaseUrl: string
  model: string
}

interface OrganizeMemoryResult {
  summary: string
  importance: number
  category: CoreMemory['category']
}

/**
 * 记忆整理 - 调用 AI 总结对话内容并评估重要度
 * Args: messages-对话消息, roleName-角色名, apiKey/apiBaseUrl/model-API配置
 * Returns: { summary, importance, category }
 */
export async function organizeMemory(params: OrganizeMemoryParams): Promise<OrganizeMemoryResult> {
  const { messages, roleName, apiKey, apiBaseUrl, model } = params

  if (messages.length === 0) {
    return { summary: '', importance: 3, category: 'other' }
  }

  // 构建对话文本
  const dialogueText = messages
    .map((m) => `[${m.role === 'user' ? '用户' : 'AI'}] ${m.content}`)
    .join('\n')

  // 使用与原版相同的提示词格式，并添加重要度和分类评估
  const summaryPrompt = `请以${roleName}的视角分析以下对话，完成以下任务：

对话内容：
${dialogueText}

请按以下JSON格式回复（不要添加任何其他内容）：
{
  "summary": "用一段话总结对话中的重要信息",
  "importance": 1-5的重要度评分（5最重要，1最不重要），
  "category": "user_info/event/preference/other"（用户信息/事件/偏好/其他）
}`

  const response = await sendChatMessage({
    messages: [{ role: 'user', content: summaryPrompt }],
    model,
    maxTokens: 500,
    temperature: 0.7,
    apiKey,
    apiBaseUrl,
  })

  // 解析 JSON 响应
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: parsed.summary || '',
        importance: Math.min(5, Math.max(1, parseInt(parsed.importance) || 3)),
        category: ['user_info', 'event', 'preference', 'other'].includes(parsed.category) 
          ? parsed.category 
          : 'other',
      }
    }
  } catch {
    // JSON 解析失败，回退到纯文本
  }

  // 回退：提取纯文本摘要
  const summary = response.content
    .replace(/\*{0,2}(重要度|摘要)\*{0,2}[\s:]*\d*[\.]?\d*[\s\\]*/g, '')
    .replace(/## 记忆片段.*/g, '')
    .replace(/[{}"]/g, '')
    .trim()

  return { summary, importance: 3, category: 'other' }
}

/**
 * 简单记忆整理（仅返回摘要字符串，兼容旧接口）
 */
export async function organizeMemorySimple(params: OrganizeMemoryParams): Promise<string> {
  const result = await organizeMemory(params)
  return result.summary
}

/**
 * 从临时记忆日志生成核心记忆
 */
export async function generateCoreMemoryFromLogs(
  logs: TempMemoryLog[],
  params: { roleName: string; apiKey: string; apiBaseUrl: string; model: string }
): Promise<OrganizeMemoryResult> {
  const messages = logs.map((log) => ({
    role: log.role === 'user' ? 'user' : 'assistant',
    content: log.content,
    dateTime: log.timestamp,
  }))
  return organizeMemory({ ...params, messages })
}

/**
 * 生成拍一拍回应
 * Args: roleName-角色名, apiKey/apiBaseUrl/model-API配置
 * Returns: string-AI的拍一拍回应
 */
export async function generateTickleResponse(params: {
  roleName: string
  personaContent: string
  apiKey: string
  apiBaseUrl: string
  model: string
}): Promise<string> {
  const { roleName, personaContent, apiKey, apiBaseUrl, model } = params

  const reactions = [
    '疑惑反问', '撒娇', '假装生气', '害羞', '开心',
    '调皮回拍', '装傻', '惊讶', '傲娇', '关心对方'
  ]
  const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]

  const prompt = `用户拍了拍你！用${randomReaction}的语气回应，直接说话，不要加引号。1-2句话，可加emoji。`

  // 使用人设提示词作为 system prompt
  const systemPrompt = personaContent 
    ? `${personaContent}\n\n[当前场景：用户拍了拍你，请保持角色性格回应]`
    : `你是${roleName}，保持角色性格，自然活泼地回应`

  const response = await sendChatMessage({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    model,
    maxTokens: 100,
    temperature: 1.0,
    apiKey,
    apiBaseUrl,
  })

  return response.content.trim()
}

/**
 * 检查是否需要自动记忆整理
 * Args: messageCount-当前消息数, threshold-触发阈值(默认20)
 * Returns: boolean-是否需要整理
 */
export function shouldAutoOrganize(messageCount: number, threshold = 20): boolean {
  return messageCount > 0 && messageCount % threshold === 0
}
