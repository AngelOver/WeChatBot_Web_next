/**
 * 统一数据层类型定义
 * 用于整合所有 Store 数据到单一 localStorage 键
 */

import type {
  Persona,
  ApiConfig,
  GptConfig,
  UserInfo,
  AutoMessageConfig,
  QuietTimeConfig,
  VisionConfig,
  OnlineSearchConfig,
  EmojiConfig,
  EmojiItem,
  TempMemoryLog,
} from './index'

// ============ 常量 ============

/** 当前数据版本 */
export const CURRENT_VERSION = '2.0.0'

/** localStorage 存储键 */
export const STORAGE_KEY = 'wechatbot-data'

/** 旧版 localStorage 键（用于迁移后清理） */
export const LEGACY_STORAGE_KEYS = [
  'wechatbot-chat-storage',
  'wechatbot-config-storage',
  'wechatbot-persona-storage',
  'wechatbot-memory-storage',
  'wechatbot-theme-storage',
  'wechatbot-emoji-storage',
] as const

// ============ 修改后的记忆类型（使用 personaId: string） ============

/** 核心记忆条目（修改：chatId -> personaId） */
export interface CoreMemoryV2 {
  id: string
  personaId: string       // 改为 string，关联 Persona.id
  content: string         // 记忆内容/摘要
  importance: number      // 1-5 重要度
  createdAt: string
  category: 'user_info' | 'event' | 'preference' | 'other'
}

/** 临时记忆存储（修改：chatId -> personaId） */
export interface TempMemoryV2 {
  personaId: string       // 改为 string
  logs: TempMemoryLog[]
  lastUpdated: string
}

// ============ 配置聚合类型 ============

/** 所有配置的聚合 */
export interface AppConfig {
  api: ApiConfig
  gpt: GptConfig
  user: UserInfo
  autoMessage: AutoMessageConfig
  quietTime: QuietTimeConfig
  vision: VisionConfig
  onlineSearch: OnlineSearchConfig
  emoji: EmojiConfig
  phoneMode: boolean
}

/** 记忆数据聚合 */
export interface AppMemories {
  core: CoreMemoryV2[]
  temp: Record<string, TempMemoryV2>  // personaId -> TempMemory
}

// ============ 统一数据结构 ============

/** 应用程序完整数据结构 */
export interface AppData {
  /** 数据版本号 */
  version: string
  
  /** 最后更新时间 (ISO 字符串) */
  lastUpdated: string
  
  /** 人设列表（包含聊天记录） */
  personas: Persona[]
  
  /** 当前激活的人设 ID */
  activePersonaId: string | null
  
  /** 所有配置 */
  config: AppConfig
  
  /** 记忆数据 */
  memories: AppMemories
  
  /** 当前主题名称 */
  theme: string
  
  /** 自定义表情列表 */
  customEmojis: EmojiItem[]
}

// ============ 导入导出相关类型 ============

/** 导入结果 */
export interface ImportResult {
  success: boolean
  message: string
  stats?: {
    personaCount: number
    messageCount: number
    memoryCount: number
    emojiCount: number
  }
  error?: string
}

/** 存储统计 */
export interface StorageStats {
  /** 总存储大小 (bytes) */
  totalSize: number
  /** 人设数量 */
  personaCount: number
  /** 消息总数 */
  messageCount: number
  /** 核心记忆数量 */
  memoryCount: number
  /** 自定义表情数量 */
  emojiCount: number
  /** 数据版本 */
  version: string
}

/** 数据验证结果 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ============ 迁移相关类型 ============

/** 迁移函数类型 */
export type MigrationFn = (data: object) => object

/** 迁移注册项 */
export interface MigrationEntry {
  toVersion: string
  fn: MigrationFn
}

/** 旧版数据结构（用于迁移） */
export interface LegacyPersonaData {
  personas: Persona[]
  activePersonaId: string | null
}

export interface LegacyChatData {
  history: Array<{
    uuid: number
    title: string
    messages: unknown[]
    personaId?: string
  }>
  active: number | null
}

export interface LegacyConfigData {
  gptConfig: GptConfig
  apiConfig: ApiConfig
  userInfo: UserInfo
  autoMessageConfig: AutoMessageConfig
  quietTimeConfig: QuietTimeConfig
  visionConfig: VisionConfig
  onlineSearchConfig: OnlineSearchConfig
  emojiConfig: EmojiConfig
  phoneMode: boolean
}

export interface LegacyMemoryData {
  coreMemories: Array<{
    id: string
    chatId: number
    content: string
    importance: number
    createdAt: string
    category: string
  }>
  tempMemories: Record<number, {
    chatId: number
    logs: TempMemoryLog[]
    lastUpdated: string
  }>
}

export interface LegacyThemeData {
  currentTheme: string
}

export interface LegacyEmojiData {
  emojis: EmojiItem[]
}
