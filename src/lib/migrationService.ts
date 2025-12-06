/**
 * 版本迁移服务
 * 用于将旧版本数据结构迁移到新版本
 */

import type { 
  AppData, 
  MigrationFn, 
  MigrationEntry,
  LegacyPersonaData,
  LegacyChatData,
  LegacyConfigData,
  LegacyMemoryData,
  LegacyThemeData,
  LegacyEmojiData,
  CoreMemoryV2,
  TempMemoryV2,
} from '@/types/appData'
import { CURRENT_VERSION, LEGACY_STORAGE_KEYS } from '@/types/appData'
import { DEFAULT_APP_DATA, defaultConfig } from './defaults'
import type { Persona, Message } from '@/types'

// ============ 迁移注册表 ============

const migrations: Record<string, MigrationEntry> = {
  '1.0.0': { toVersion: '2.0.0', fn: migrateV1ToV2 },
}

// ============ 版本比较 ============

/**
 * 比较版本号
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA < numB) return -1
    if (numA > numB) return 1
  }
  return 0
}

/**
 * 检查版本是否需要迁移
 */
export function needsMigration(version: string): boolean {
  return compareVersions(version, CURRENT_VERSION) < 0
}

// ============ 迁移执行 ============

/**
 * 执行数据迁移
 * @param data 原始数据
 * @param targetVersion 目标版本（默认为当前版本）
 * @returns 迁移后的数据
 */
export function migrate(data: unknown, targetVersion: string = CURRENT_VERSION): AppData {
  if (!data || typeof data !== 'object') {
    console.warn('[Migration] 无效数据，返回默认值')
    return { ...DEFAULT_APP_DATA, lastUpdated: new Date().toISOString() }
  }

  const obj = data as Record<string, unknown>
  let currentVersion = typeof obj.version === 'string' ? obj.version : '1.0.0'
  let currentData: object = data as object

  // 如果没有版本号，尝试从旧格式迁移
  if (!obj.version) {
    console.log('[Migration] 检测到无版本数据，尝试从旧格式迁移')
    return migrateFromLegacyFormat()
  }

  // 逐步迁移到目标版本
  while (compareVersions(currentVersion, targetVersion) < 0) {
    const migration = migrations[currentVersion]
    if (!migration) {
      console.warn(`[Migration] 未找到版本 ${currentVersion} 的迁移函数`)
      break
    }

    console.log(`[Migration] 从 ${currentVersion} 迁移到 ${migration.toVersion}`)
    try {
      currentData = migration.fn(currentData)
      currentVersion = migration.toVersion
    } catch (error) {
      console.error(`[Migration] 迁移失败:`, error)
      // 迁移失败时保留原数据
      return currentData as AppData
    }
  }

  return currentData as AppData
}

/**
 * 获取迁移路径
 */
export function getMigrationPath(fromVersion: string, toVersion: string): string[] {
  const path: string[] = [fromVersion]
  let current = fromVersion

  while (compareVersions(current, toVersion) < 0) {
    const migration = migrations[current]
    if (!migration) break
    path.push(migration.toVersion)
    current = migration.toVersion
  }

  return path
}

// ============ V1 到 V2 迁移 ============

/**
 * 从 v1.0.0 迁移到 v2.0.0
 * - 合并 chatStore 数据到 personaStore
 * - 转换 chatId (number) 为 personaId (string)
 * - 处理孤立记忆
 */
function migrateV1ToV2(data: object): AppData {
  const obj = data as Record<string, unknown>
  
  // 如果已经是 v2 格式，直接返回
  if (obj.version === '2.0.0') {
    return obj as unknown as AppData
  }

  const result: AppData = {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    personas: [],
    activePersonaId: null,
    config: defaultConfig,
    memories: { core: [], temp: {} },
    theme: 'wechat',
    customEmojis: [],
  }

  // 迁移人设数据
  if (Array.isArray(obj.personas)) {
    result.personas = obj.personas as Persona[]
  }

  if (typeof obj.activePersonaId === 'string') {
    result.activePersonaId = obj.activePersonaId
  }

  // 迁移配置
  if (obj.config && typeof obj.config === 'object') {
    result.config = { ...defaultConfig, ...(obj.config as object) } as typeof result.config
  }

  // 迁移记忆（转换 chatId 为 personaId）
  if (obj.memories && typeof obj.memories === 'object') {
    const memories = obj.memories as Record<string, unknown>
    
    if (Array.isArray(memories.core)) {
      result.memories.core = memories.core.map((mem: Record<string, unknown>) => ({
        id: String(mem.id || ''),
        personaId: String(mem.personaId || mem.chatId || ''),
        content: String(mem.content || ''),
        importance: Number(mem.importance) || 3,
        createdAt: String(mem.createdAt || new Date().toISOString()),
        category: (mem.category as CoreMemoryV2['category']) || 'other',
      }))
    }

    if (memories.temp && typeof memories.temp === 'object') {
      const tempObj = memories.temp as Record<string, unknown>
      Object.entries(tempObj).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          const temp = value as Record<string, unknown>
          result.memories.temp[key] = {
            personaId: String(temp.personaId || temp.chatId || key),
            logs: Array.isArray(temp.logs) ? temp.logs : [],
            lastUpdated: String(temp.lastUpdated || new Date().toISOString()),
          }
        }
      })
    }
  }

  // 迁移主题
  if (typeof obj.theme === 'string') {
    result.theme = obj.theme
  }

  // 迁移自定义表情
  if (Array.isArray(obj.customEmojis)) {
    result.customEmojis = obj.customEmojis
  }

  return result
}

// ============ 从旧格式迁移 ============

/**
 * 从旧的分散 localStorage 格式迁移
 */
export function migrateFromLegacyFormat(): AppData {
  console.log('[Migration] 开始从旧格式迁移')
  
  const result: AppData = {
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
    personas: [],
    activePersonaId: null,
    config: { ...defaultConfig },
    memories: { core: [], temp: {} },
    theme: 'wechat',
    customEmojis: [],
  }

  try {
    // 读取旧的 personaStore
    const personaData = readLegacyStorage<LegacyPersonaData>('wechatbot-persona-storage')
    if (personaData) {
      result.personas = personaData.personas || []
      result.activePersonaId = personaData.activePersonaId || null
    }

    // 读取旧的 configStore
    const configData = readLegacyStorage<LegacyConfigData>('wechatbot-config-storage')
    if (configData) {
      result.config = {
        api: configData.apiConfig || defaultConfig.api,
        gpt: configData.gptConfig || defaultConfig.gpt,
        user: configData.userInfo || defaultConfig.user,
        autoMessage: configData.autoMessageConfig || defaultConfig.autoMessage,
        quietTime: configData.quietTimeConfig || defaultConfig.quietTime,
        vision: configData.visionConfig || defaultConfig.vision,
        onlineSearch: configData.onlineSearchConfig || defaultConfig.onlineSearch,
        emoji: configData.emojiConfig || defaultConfig.emoji,
        phoneMode: configData.phoneMode || false,
      }
    }

    // 读取旧的 memoryStore 并转换 ID 类型
    const memoryData = readLegacyStorage<LegacyMemoryData>('wechatbot-memory-storage')
    if (memoryData) {
      // 转换核心记忆的 chatId 为 personaId
      if (Array.isArray(memoryData.coreMemories)) {
        result.memories.core = memoryData.coreMemories.map((mem) => {
          // 尝试找到对应的 persona
          const matchingPersona = result.personas.find((p, index) => {
            // 旧版本可能用数字索引或其他方式关联
            return String(mem.chatId) === p.id || index === mem.chatId
          })
          
          return {
            id: mem.id,
            personaId: matchingPersona?.id || result.personas[0]?.id || 'unknown',
            content: mem.content,
            importance: mem.importance,
            createdAt: mem.createdAt,
            category: (mem.category as CoreMemoryV2['category']) || 'other',
          }
        })
      }

      // 转换临时记忆
      if (memoryData.tempMemories) {
        Object.entries(memoryData.tempMemories).forEach(([key, value]) => {
          const matchingPersona = result.personas.find((p, index) => {
            return String(value.chatId) === p.id || index === value.chatId
          })
          const personaId = matchingPersona?.id || result.personas[0]?.id || 'unknown'
          
          result.memories.temp[personaId] = {
            personaId,
            logs: value.logs,
            lastUpdated: value.lastUpdated,
          }
        })
      }
    }

    // 读取旧的 themeStore
    const themeData = readLegacyStorage<LegacyThemeData>('wechatbot-theme-storage')
    if (themeData) {
      result.theme = themeData.currentTheme || 'wechat'
    }

    // 读取旧的 emojiStore
    const emojiData = readLegacyStorage<LegacyEmojiData>('wechatbot-emoji-storage')
    if (emojiData) {
      result.customEmojis = emojiData.emojis || []
    }

    // 读取旧的 chatStore（如果存在，合并消息到对应人设）
    const chatData = readLegacyStorage<LegacyChatData>('wechatbot-chat-storage')
    if (chatData && Array.isArray(chatData.history)) {
      chatData.history.forEach((chat) => {
        if (chat.personaId) {
          const persona = result.personas.find(p => p.id === chat.personaId)
          if (persona && Array.isArray(chat.messages)) {
            // 合并消息（避免重复）
            const existingIds = new Set(persona.messages.map(m => m.id))
            const newMessages = (chat.messages as Message[]).filter(m => !existingIds.has(m.id))
            persona.messages = [...persona.messages, ...newMessages]
          }
        }
      })
    }

    console.log('[Migration] 旧格式迁移完成')
  } catch (error) {
    console.error('[Migration] 旧格式迁移失败:', error)
  }

  return result
}

/**
 * 读取旧的 localStorage 数据
 */
function readLegacyStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    
    const parsed = JSON.parse(raw)
    // Zustand persist 格式: { state: {...}, version: 0 }
    return parsed.state || parsed
  } catch {
    return null
  }
}

/**
 * 清理旧的 localStorage 键
 */
export function cleanupLegacyStorage(): void {
  if (typeof window === 'undefined') return
  
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
      console.log(`[Migration] 已删除旧存储键: ${key}`)
    } catch (error) {
      console.warn(`[Migration] 删除 ${key} 失败:`, error)
    }
  })
}

/**
 * 检查是否存在旧格式数据
 */
export function hasLegacyData(): boolean {
  if (typeof window === 'undefined') return false
  
  return LEGACY_STORAGE_KEYS.some((key) => {
    try {
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  })
}
