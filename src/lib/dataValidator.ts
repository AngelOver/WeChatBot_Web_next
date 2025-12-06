/**
 * 数据验证服务
 * 用于验证 AppData 结构的完整性和正确性
 */

import type { AppData, ValidationResult, CoreMemoryV2 } from '@/types/appData'
import type { Persona, EmojiItem } from '@/types'

/**
 * 验证 AppData 结构
 */
export function validateAppData(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据必须是对象'] }
  }

  const obj = data as Record<string, unknown>

  // 验证必需的顶层字段
  if (typeof obj.version !== 'string') {
    errors.push('缺少或无效的 version 字段')
  }

  if (typeof obj.lastUpdated !== 'string') {
    errors.push('缺少或无效的 lastUpdated 字段')
  }

  if (!Array.isArray(obj.personas)) {
    errors.push('缺少或无效的 personas 字段')
  } else {
    // 验证每个 persona
    obj.personas.forEach((persona, index) => {
      const personaErrors = validatePersona(persona, index)
      errors.push(...personaErrors)
    })
  }

  if (obj.activePersonaId !== null && typeof obj.activePersonaId !== 'string') {
    errors.push('activePersonaId 必须是 string 或 null')
  }

  if (!obj.config || typeof obj.config !== 'object') {
    errors.push('缺少或无效的 config 字段')
  } else {
    const configErrors = validateConfig(obj.config as Record<string, unknown>)
    errors.push(...configErrors)
  }

  if (!obj.memories || typeof obj.memories !== 'object') {
    errors.push('缺少或无效的 memories 字段')
  } else {
    const memoriesErrors = validateMemories(obj.memories as Record<string, unknown>)
    errors.push(...memoriesErrors)
  }

  if (typeof obj.theme !== 'string') {
    errors.push('缺少或无效的 theme 字段')
  }

  if (!Array.isArray(obj.customEmojis)) {
    errors.push('缺少或无效的 customEmojis 字段')
  } else {
    obj.customEmojis.forEach((emoji, index) => {
      const emojiErrors = validateEmojiItem(emoji, index)
      errors.push(...emojiErrors)
    })
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 验证 Persona 结构
 */
function validatePersona(persona: unknown, index: number): string[] {
  const errors: string[] = []
  const prefix = `personas[${index}]`

  if (!persona || typeof persona !== 'object') {
    return [`${prefix}: 必须是对象`]
  }

  const obj = persona as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    errors.push(`${prefix}.id: 必须是非空字符串`)
  }

  if (typeof obj.name !== 'string') {
    errors.push(`${prefix}.name: 必须是字符串`)
  }

  if (typeof obj.content !== 'string') {
    errors.push(`${prefix}.content: 必须是字符串`)
  }

  if (!Array.isArray(obj.messages)) {
    errors.push(`${prefix}.messages: 必须是数组`)
  }

  return errors
}

/**
 * 验证配置结构
 */
function validateConfig(config: Record<string, unknown>): string[] {
  const errors: string[] = []
  const requiredKeys = ['api', 'gpt', 'user', 'autoMessage', 'quietTime', 'vision', 'onlineSearch', 'emoji']

  requiredKeys.forEach((key) => {
    if (!config[key] || typeof config[key] !== 'object') {
      errors.push(`config.${key}: 缺少或无效`)
    }
  })

  if (typeof config.phoneMode !== 'boolean' && config.phoneMode !== undefined) {
    errors.push('config.phoneMode: 必须是布尔值')
  }

  return errors
}

/**
 * 验证记忆结构
 */
function validateMemories(memories: Record<string, unknown>): string[] {
  const errors: string[] = []

  if (!Array.isArray(memories.core)) {
    errors.push('memories.core: 必须是数组')
  } else {
    memories.core.forEach((memory, index) => {
      const memoryErrors = validateCoreMemory(memory, index)
      errors.push(...memoryErrors)
    })
  }

  if (!memories.temp || typeof memories.temp !== 'object') {
    errors.push('memories.temp: 必须是对象')
  }

  return errors
}

/**
 * 验证核心记忆结构
 */
function validateCoreMemory(memory: unknown, index: number): string[] {
  const errors: string[] = []
  const prefix = `memories.core[${index}]`

  if (!memory || typeof memory !== 'object') {
    return [`${prefix}: 必须是对象`]
  }

  const obj = memory as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    errors.push(`${prefix}.id: 必须是非空字符串`)
  }

  if (typeof obj.personaId !== 'string' || obj.personaId.length === 0) {
    errors.push(`${prefix}.personaId: 必须是非空字符串`)
  }

  if (typeof obj.content !== 'string') {
    errors.push(`${prefix}.content: 必须是字符串`)
  }

  if (typeof obj.importance !== 'number' || obj.importance < 1 || obj.importance > 5) {
    errors.push(`${prefix}.importance: 必须是 1-5 的数字`)
  }

  return errors
}

/**
 * 验证表情项结构
 */
function validateEmojiItem(emoji: unknown, index: number): string[] {
  const errors: string[] = []
  const prefix = `customEmojis[${index}]`

  if (!emoji || typeof emoji !== 'object') {
    return [`${prefix}: 必须是对象`]
  }

  const obj = emoji as Record<string, unknown>

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    errors.push(`${prefix}.id: 必须是非空字符串`)
  }

  if (typeof obj.name !== 'string') {
    errors.push(`${prefix}.name: 必须是字符串`)
  }

  if (typeof obj.url !== 'string') {
    errors.push(`${prefix}.url: 必须是字符串`)
  }

  return errors
}

/**
 * 检查数据是否为有效的 AppData（简化版，只检查关键字段）
 */
export function isValidAppData(data: unknown): data is AppData {
  const result = validateAppData(data)
  return result.valid
}

/**
 * 尝试修复常见的数据问题
 */
export function sanitizeAppData(data: unknown): AppData | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const obj = data as Record<string, unknown>

  // 尝试修复缺失的字段
  const sanitized: Partial<AppData> = {
    version: typeof obj.version === 'string' ? obj.version : '1.0.0',
    lastUpdated: typeof obj.lastUpdated === 'string' ? obj.lastUpdated : new Date().toISOString(),
    personas: Array.isArray(obj.personas) ? obj.personas as Persona[] : [],
    activePersonaId: typeof obj.activePersonaId === 'string' ? obj.activePersonaId : null,
    theme: typeof obj.theme === 'string' ? obj.theme : 'wechat',
    customEmojis: Array.isArray(obj.customEmojis) ? obj.customEmojis as EmojiItem[] : [],
  }

  // 验证修复后的数据
  const result = validateAppData(sanitized)
  if (!result.valid) {
    return null
  }

  return sanitized as AppData
}
