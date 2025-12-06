/**
 * 导入服务
 * 支持 JSON 和 ZIP（旧版备份）格式导入
 */

import JSZip from 'jszip'
import type { AppData, ImportResult, AppConfig } from '@/types/appData'
import type { Persona, Message } from '@/types'
import { CURRENT_VERSION } from '@/types/appData'
import { 
  defaultConfig, 
  defaultMemories, 
  defaultPersonas 
} from './defaults'
import { dataService } from './dataService'

// ============ 类型定义 ============

/** 旧版 config.py 解析结果 */
interface LegacyConfig {
  // API 配置
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  // GPT 配置
  MODEL?: string
  MAX_TOKEN?: number
  TEMPERATURE?: number
  MAX_GROUPS?: number
  // 主动消息
  ENABLE_AUTO_MESSAGE?: boolean
  MIN_COUNTDOWN_HOURS?: number
  MAX_COUNTDOWN_HOURS?: number
  AUTO_MESSAGE?: string
  // 安静时间
  QUIET_TIME_START?: string
  QUIET_TIME_END?: string
  // 视觉模型 (Moonshot)
  MOONSHOT_API_KEY?: string
  MOONSHOT_BASE_URL?: string
  MOONSHOT_MODEL?: string
  ENABLE_IMAGE_RECOGNITION?: boolean
  // 联网搜索
  ONLINE_BASE_URL?: string
  ONLINE_MODEL?: string
  ONLINE_API_KEY?: string
  ENABLE_ONLINE_API?: boolean
  SEARCH_DETECTION_PROMPT?: string
  // 表情
  ENABLE_EMOJI_SENDING?: boolean
  EMOJI_SENDING_PROBABILITY?: number
}

/** 导入选项 */
export interface ImportOptions {
  /** 是否合并（true=合并，false=覆盖） */
  merge?: boolean
  /** 是否导入配置 */
  importConfig?: boolean
  /** 是否导入人设 */
  importPersonas?: boolean
  /** 是否导入记忆 */
  importMemories?: boolean
}

// ============ 文件类型检测 ============

/**
 * 检测文件类型
 */
export function detectFileType(file: File): 'json' | 'zip' | 'unknown' {
  const name = file.name.toLowerCase()
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.zip')) return 'zip'
  
  // 通过 MIME 类型检测
  if (file.type === 'application/json') return 'json'
  if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') return 'zip'
  
  return 'unknown'
}

// ============ JSON 导入 ============

/**
 * 从 JSON 文件导入
 */
export async function importFromJsonFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
  try {
    const text = await file.text()
    
    // 如果是合并模式，需要特殊处理
    if (options.merge) {
      return importJsonMerge(text, options)
    }
    
    // 覆盖模式，使用 dataService
    return dataService.importFromJson(text)
  } catch (error) {
    console.error('[ImportService] JSON导入失败:', error)
    return {
      success: false,
      message: '读取文件失败',
      error: String(error),
    }
  }
}

/**
 * JSON 合并导入
 */
function importJsonMerge(json: string, options: ImportOptions): ImportResult {
  try {
    const imported = JSON.parse(json) as Partial<AppData>
    const current = dataService.load()
    
    let personaCount = 0
    let messageCount = 0
    
    // 合并人设
    if (options.importPersonas !== false && imported.personas) {
      const existingIds = new Set(current.personas.map(p => p.id))
      
      for (const persona of imported.personas) {
        if (existingIds.has(persona.id)) {
          // 已存在，跳过或更新消息
          const existing = current.personas.find(p => p.id === persona.id)
          if (existing && persona.messages) {
            const existingMsgIds = new Set(existing.messages?.map(m => m.id) || [])
            const newMsgs = persona.messages.filter(m => !existingMsgIds.has(m.id))
            existing.messages = [...(existing.messages || []), ...newMsgs]
            messageCount += newMsgs.length
          }
        } else {
          // 新人设
          current.personas.push(persona)
          personaCount++
          messageCount += persona.messages?.length || 0
        }
      }
    }
    
    // 合并配置（可选）
    if (options.importConfig && imported.config) {
      current.config = { ...current.config, ...imported.config }
    }
    
    // 保存
    dataService.save(current)
    
    return {
      success: true,
      message: `合并完成：新增 ${personaCount} 个人设，${messageCount} 条消息`,
      stats: {
        personaCount,
        messageCount,
        memoryCount: 0,
        emojiCount: 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: '合并导入失败',
      error: String(error),
    }
  }
}

// ============ ZIP 导入（旧版备份） ============

/**
 * 从 ZIP 文件导入（旧版 WeChatBot 备份）
 */
export async function importFromZipFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
  try {
    const zip = await JSZip.loadAsync(file)
    
    // 解析各个部分
    const config = await parseConfigPy(zip)
    const personas = await parsePrompts(zip)
    const memories = await parseCoreMemory(zip)
    
    // 构建 AppData
    const appData = buildAppDataFromLegacy(config, personas, memories, options)
    
    // 保存
    if (options.merge) {
      return mergeLegacyData(appData, options)
    } else {
      dataService.save(appData)
    }
    
    const messageCount = appData.personas.reduce((sum, p) => sum + (p.messages?.length || 0), 0)
    
    return {
      success: true,
      message: `导入成功：${appData.personas.length} 个人设，${memories.length} 条核心记忆`,
      stats: {
        personaCount: appData.personas.length,
        messageCount,
        memoryCount: memories.length,
        emojiCount: 0,
      },
    }
  } catch (error) {
    console.error('[ImportService] ZIP导入失败:', error)
    return {
      success: false,
      message: 'ZIP 文件解析失败',
      error: String(error),
    }
  }
}

// ============ 目录导入（旧版备份文件夹） ============

/**
 * 从目录导入（直接选择旧版 WeChatBot 备份文件夹）
 */
export async function importFromDirectory(files: FileList | File[], options: ImportOptions = {}): Promise<ImportResult> {
  try {
    console.log('[ImportService] 文件数量:', files.length)
    
    // 将 FileList 转换为 Map 便于查找
    const fileMap = new Map<string, File>()
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // webkitRelativePath 包含相对路径，如 "备份目录/config.py"
      // 统一使用正斜杠，兼容 Windows
      const rawPath = file.webkitRelativePath || file.name
      console.log('[ImportService] 原始路径:', rawPath)
      const path = rawPath.toLowerCase().replace(/\\/g, '/')
      fileMap.set(path, file)
    }
    
    console.log('[ImportService] 目录文件列表:', Array.from(fileMap.keys()))
    
    // 查找 config.py
    let configContent: string | null = null
    for (const [path, file] of Array.from(fileMap.entries())) {
      if (path.endsWith('config.py') && !path.includes('__pycache__')) {
        configContent = await file.text()
        break
      }
    }
    
    // 解析 config.py
    const config = configContent ? parseConfigPyContent(configContent) : {}
    
    // 解析 prompts 目录
    const personas: Persona[] = []
    for (const [path, file] of Array.from(fileMap.entries())) {
      // 匹配 prompts 目录下的 .md 文件（兼容各种路径格式）
      const isPromptFile = (path.includes('/prompts/') || path.includes('prompts/')) && path.endsWith('.md')
      if (isPromptFile) {
        const content = await file.text()
        const fileName = path.split('/').pop() || ''
        const name = fileName.replace('.md', '')
        
        if (name && content) {
          console.log('[ImportService] 找到人设:', name, '文件时间:', new Date(file.lastModified).toLocaleDateString())
          personas.push({
            id: `persona_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            content,
            messages: [],
            isDefault: false,
            createdAt: new Date(file.lastModified).toISOString(),
          })
        }
      }
    }
    console.log('[ImportService] 解析到人设数量:', personas.length)
    
    // 解析 CoreMemory 目录
    const memories: Array<{ personaName: string; content: string }> = []
    for (const [path, file] of Array.from(fileMap.entries())) {
      if (path.includes('/corememory/') && !file.name.startsWith('.')) {
        console.log('[ImportService] 找到记忆文件:', path)
        const content = await file.text()
        const fileName = path.split('/').pop() || ''
        
        // 支持 JSON 格式的记忆文件
        if (fileName.endsWith('.json')) {
          try {
            const jsonData = JSON.parse(content)
            // 提取人设名（从文件名中解析，如 "白_角色1_core_memory.json"）
            const nameParts = fileName.replace('_core_memory.json', '').split('_')
            const personaName = nameParts[nameParts.length - 1] || nameParts[0]
            
            // JSON 是数组格式，每个元素有 summary 字段
            if (Array.isArray(jsonData)) {
              for (const item of jsonData) {
                const summary = item.summary || item.content || item.text
                if (summary) {
                  console.log('[ImportService] 解析记忆条目:', personaName, summary.slice(0, 30))
                  memories.push({ personaName, content: summary })
                }
              }
            } else {
              // 单个对象
              const memoryContent = jsonData.summary || jsonData.content || jsonData.text || JSON.stringify(jsonData)
              if (personaName && memoryContent) {
                memories.push({ personaName, content: memoryContent })
              }
            }
          } catch (e) {
            console.warn('[ImportService] JSON 解析失败:', fileName, e)
          }
        } else {
          // 纯文本格式
          const personaName = fileName.replace(/\.[^.]+$/, '')
          if (personaName && content.trim()) {
            memories.push({ personaName, content: content.trim() })
          }
        }
      }
    }
    console.log('[ImportService] 解析到记忆数量:', memories.length)
    
    // 构建 AppData
    const appData = buildAppDataFromLegacy(config, personas, memories, options)
    
    // 保存
    if (options.merge) {
      return mergeLegacyData(appData, options)
    } else {
      dataService.save(appData)
    }
    
    const messageCount = appData.personas.reduce((sum, p) => sum + (p.messages?.length || 0), 0)
    
    return {
      success: true,
      message: `导入成功：${appData.personas.length} 个人设，${memories.length} 条核心记忆`,
      stats: {
        personaCount: appData.personas.length,
        messageCount,
        memoryCount: memories.length,
        emojiCount: 0,
      },
    }
  } catch (error) {
    console.error('[ImportService] 目录导入失败:', error)
    return {
      success: false,
      message: '目录解析失败',
      error: String(error),
    }
  }
}

/**
 * 解析 config.py 内容（纯文本版本）
 */
function parseConfigPyContent(content: string): LegacyConfig {
  const config: LegacyConfig = {}
  
  const patterns: Array<{ key: keyof LegacyConfig; regex: RegExp; type: 'string' | 'number' | 'boolean' }> = [
    { key: 'DEEPSEEK_API_KEY', regex: /DEEPSEEK_API_KEY\s*=\s*["'](.*)["']/, type: 'string' },
    { key: 'DEEPSEEK_BASE_URL', regex: /DEEPSEEK_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MODEL', regex: /MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MAX_TOKEN', regex: /MAX_TOKEN\s*=\s*(\d+)/, type: 'number' },
    { key: 'TEMPERATURE', regex: /TEMPERATURE\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'MAX_GROUPS', regex: /MAX_GROUPS\s*=\s*(\d+)/, type: 'number' },
    { key: 'ENABLE_AUTO_MESSAGE', regex: /ENABLE_AUTO_MESSAGE\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'MIN_COUNTDOWN_HOURS', regex: /MIN_COUNTDOWN_HOURS\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'MAX_COUNTDOWN_HOURS', regex: /MAX_COUNTDOWN_HOURS\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'AUTO_MESSAGE', regex: /AUTO_MESSAGE\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'QUIET_TIME_START', regex: /QUIET_TIME_START\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'QUIET_TIME_END', regex: /QUIET_TIME_END\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MOONSHOT_API_KEY', regex: /MOONSHOT_API_KEY\s*=\s*["'](.*)["']/, type: 'string' },
    { key: 'MOONSHOT_BASE_URL', regex: /MOONSHOT_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MOONSHOT_MODEL', regex: /MOONSHOT_MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ENABLE_IMAGE_RECOGNITION', regex: /ENABLE_IMAGE_RECOGNITION\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'ONLINE_BASE_URL', regex: /ONLINE_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ONLINE_MODEL', regex: /ONLINE_MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ONLINE_API_KEY', regex: /ONLINE_API_KEY\s*=\s*["'](.*)["']/, type: 'string' },
    { key: 'ENABLE_ONLINE_API', regex: /ENABLE_ONLINE_API\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'SEARCH_DETECTION_PROMPT', regex: /SEARCH_DETECTION_PROMPT\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ENABLE_EMOJI_SENDING', regex: /ENABLE_EMOJI_SENDING\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'EMOJI_SENDING_PROBABILITY', regex: /EMOJI_SENDING_PROBABILITY\s*=\s*(\d+)/, type: 'number' },
  ]
  
  for (const { key, regex, type } of patterns) {
    const match = content.match(regex)
    if (match) {
      if (type === 'string') {
        (config as Record<string, unknown>)[key] = match[1]
      } else if (type === 'number') {
        (config as Record<string, unknown>)[key] = parseFloat(match[1])
      } else if (type === 'boolean') {
        (config as Record<string, unknown>)[key] = match[1] === 'True'
      }
    }
  }
  
  return config
}

/**
 * 查找 ZIP 中的文件（支持多层目录）
 */
async function findFileInZip(zip: JSZip, filename: string): Promise<string | null> {
  // 收集所有匹配的文件
  const matches: JSZip.JSZipObject[] = []
  
  zip.forEach((relativePath, file) => {
    if (!file.dir && relativePath.endsWith(filename)) {
      // 排除 __pycache__ 目录
      if (!relativePath.includes('__pycache__')) {
        matches.push(file)
      }
    }
  })
  
  if (matches.length === 0) return null
  
  // 优先选择路径最短的（更接近根目录）
  matches.sort((a, b) => a.name.split('/').length - b.name.split('/').length)
  
  return await matches[0].async('text')
}

/**
 * 获取 ZIP 中文件的基础路径
 */
function getBasePath(zip: JSZip): string {
  let basePath = ''
  
  zip.forEach((relativePath, file) => {
    if (!file.dir && relativePath.endsWith('config.py') && !relativePath.includes('__pycache__')) {
      // 获取 config.py 所在目录作为基础路径
      const parts = relativePath.split('/')
      parts.pop() // 移除 config.py
      basePath = parts.join('/')
      if (basePath) basePath += '/'
    }
  })
  
  return basePath
}

/**
 * 解析 config.py
 */
async function parseConfigPy(zip: JSZip): Promise<LegacyConfig> {
  const config: LegacyConfig = {}
  
  const content = await findFileInZip(zip, 'config.py')
  
  if (!content) {
    console.warn('[ImportService] 未找到 config.py')
    return config
  }
  
  // 解析 Python 配置
  const patterns: Array<{ key: keyof LegacyConfig; regex: RegExp; type: 'string' | 'number' | 'boolean' }> = [
    { key: 'DEEPSEEK_API_KEY', regex: /DEEPSEEK_API_KEY\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'DEEPSEEK_BASE_URL', regex: /DEEPSEEK_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MODEL', regex: /MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MAX_TOKEN', regex: /MAX_TOKEN\s*=\s*(\d+)/, type: 'number' },
    { key: 'TEMPERATURE', regex: /TEMPERATURE\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'MAX_GROUPS', regex: /MAX_GROUPS\s*=\s*(\d+)/, type: 'number' },
    { key: 'ENABLE_AUTO_MESSAGE', regex: /ENABLE_AUTO_MESSAGE\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'MIN_COUNTDOWN_HOURS', regex: /MIN_COUNTDOWN_HOURS\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'MAX_COUNTDOWN_HOURS', regex: /MAX_COUNTDOWN_HOURS\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'AUTO_MESSAGE', regex: /AUTO_MESSAGE\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'QUIET_TIME_START', regex: /QUIET_TIME_START\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'QUIET_TIME_END', regex: /QUIET_TIME_END\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MOONSHOT_API_KEY', regex: /MOONSHOT_API_KEY\s*=\s*["'](.*)["']/, type: 'string' },
    { key: 'MOONSHOT_BASE_URL', regex: /MOONSHOT_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'MOONSHOT_MODEL', regex: /MOONSHOT_MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ENABLE_IMAGE_RECOGNITION', regex: /ENABLE_IMAGE_RECOGNITION\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'ONLINE_BASE_URL', regex: /ONLINE_BASE_URL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ONLINE_MODEL', regex: /ONLINE_MODEL\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ONLINE_API_KEY', regex: /ONLINE_API_KEY\s*=\s*["'](.*)["']/, type: 'string' },
    { key: 'ENABLE_ONLINE_API', regex: /ENABLE_ONLINE_API\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'SEARCH_DETECTION_PROMPT', regex: /SEARCH_DETECTION_PROMPT\s*=\s*["'](.+?)["']/, type: 'string' },
    { key: 'ENABLE_EMOJI_SENDING', regex: /ENABLE_EMOJI_SENDING\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'EMOJI_SENDING_PROBABILITY', regex: /EMOJI_SENDING_PROBABILITY\s*=\s*(\d+)/, type: 'number' },
  ]
  
  for (const { key, regex, type } of patterns) {
    const match = content.match(regex)
    if (match) {
      if (type === 'string') {
        (config as Record<string, unknown>)[key] = match[1]
      } else if (type === 'number') {
        (config as Record<string, unknown>)[key] = parseFloat(match[1])
      } else if (type === 'boolean') {
        (config as Record<string, unknown>)[key] = match[1] === 'True'
      }
    }
  }
  
  return config
}

/**
 * 解析 prompts 目录
 */
async function parsePrompts(zip: JSZip): Promise<Persona[]> {
  const personas: Persona[] = []
  const promptFiles: JSZip.JSZipObject[] = []
  const basePath = getBasePath(zip)
  
  // 收集所有 prompts 目录下的 .md 文件
  zip.forEach((relativePath, file) => {
    if (!file.dir && relativePath.endsWith('.md')) {
      // 检查是否在 prompts 目录下
      if (relativePath.includes('/prompts/') || relativePath.startsWith('prompts/')) {
        promptFiles.push(file)
      }
    }
  })
  
  // 解析每个文件
  for (const file of promptFiles) {
    try {
      const content = await file.async('text')
      const fileName = file.name.split('/').pop() || ''
      const name = fileName.replace('.md', '')
      
      if (name && content) {
        personas.push({
          id: `persona_imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          content,
          messages: [],
          isDefault: false,
          createdAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.warn('[ImportService] 解析提示词失败:', file.name, error)
    }
  }
  
  return personas
}

/**
 * 解析 CoreMemory 目录
 */
async function parseCoreMemory(zip: JSZip): Promise<Array<{ personaName: string; content: string }>> {
  const memories: Array<{ personaName: string; content: string }> = []
  const memoryFiles: JSZip.JSZipObject[] = []
  
  // 收集核心记忆文件
  zip.forEach((relativePath, file) => {
    if (relativePath.includes('CoreMemory') && !file.dir) {
      memoryFiles.push(file)
    }
  })
  
  for (const file of memoryFiles) {
    try {
      const content = await file.async('text')
      const fileName = file.name.split('/').pop() || ''
      const personaName = fileName.replace(/\.[^.]+$/, '')
      
      if (personaName && content.trim()) {
        memories.push({ personaName, content: content.trim() })
      }
    } catch (error) {
      console.warn('[ImportService] 解析核心记忆失败:', file.name, error)
    }
  }
  
  return memories
}

/**
 * 从旧版数据构建 AppData
 */
function buildAppDataFromLegacy(
  config: LegacyConfig,
  personas: Persona[],
  memories: Array<{ personaName: string; content: string }>,
  options: ImportOptions
): AppData {
  // 转换配置
  const appConfig: AppConfig = {
    ...defaultConfig,
    api: {
      apiKey: config.DEEPSEEK_API_KEY || '',
      apiBaseUrl: config.DEEPSEEK_BASE_URL || '',
    },
    gpt: {
      ...defaultConfig.gpt,
      model: config.MODEL || defaultConfig.gpt.model,
      maxTokens: config.MAX_TOKEN || defaultConfig.gpt.maxTokens,
      temperature: config.TEMPERATURE || defaultConfig.gpt.temperature,
      talkCount: config.MAX_GROUPS || defaultConfig.gpt.talkCount,
    },
    autoMessage: {
      enabled: config.ENABLE_AUTO_MESSAGE || false,
      minInterval: (config.MIN_COUNTDOWN_HOURS || 1) * 60,
      maxInterval: (config.MAX_COUNTDOWN_HOURS || 2) * 60,
      prompt: config.AUTO_MESSAGE || defaultConfig.autoMessage.prompt,
    },
    quietTime: {
      enabled: Boolean(config.QUIET_TIME_START),
      startTime: config.QUIET_TIME_START || '22:00',
      endTime: config.QUIET_TIME_END || '08:00',
    },
    vision: {
      enabled: config.ENABLE_IMAGE_RECOGNITION ?? Boolean(config.MOONSHOT_API_KEY),
      apiKey: config.MOONSHOT_API_KEY || '',
      apiBaseUrl: config.MOONSHOT_BASE_URL || '',
      model: config.MOONSHOT_MODEL || 'gpt-4o',
    },
    onlineSearch: {
      ...defaultConfig.onlineSearch,
      enabled: config.ENABLE_ONLINE_API || false,
      apiKey: config.ONLINE_API_KEY || '',
      apiBaseUrl: config.ONLINE_BASE_URL || '',
      model: config.ONLINE_MODEL || defaultConfig.onlineSearch.model,
      searchPrompt: config.SEARCH_DETECTION_PROMPT || defaultConfig.onlineSearch.searchPrompt,
    },
    emoji: {
      enabled: config.ENABLE_EMOJI_SENDING ?? true,
      probability: config.EMOJI_SENDING_PROBABILITY ?? 25,
    },
  }
  
  // 使用导入的人设，如果没有则使用默认
  const finalPersonas = personas.length > 0 ? personas : defaultPersonas
  
  // 将记忆关联到人设
  const coreMemories = memories.map((mem, idx) => {
    const matchedPersona = finalPersonas.find(
      p => p.name.toLowerCase() === mem.personaName.toLowerCase()
    )
    return {
      id: `mem_imported_${Date.now()}_${idx}`,
      personaId: matchedPersona?.id || finalPersonas[0]?.id || '',
      content: mem.content,
      importance: 3,
      createdAt: new Date().toISOString(),
      category: 'other' as const,
    }
  })
  
  return {
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
    personas: finalPersonas,
    activePersonaId: finalPersonas[0]?.id || null,
    config: options.importConfig !== false ? appConfig : defaultConfig,
    memories: {
      core: options.importMemories !== false ? coreMemories : [],
      temp: {},
    },
    theme: 'wechat',
    customEmojis: [],
  }
}

/**
 * 合并旧版数据
 */
function mergeLegacyData(imported: AppData, options: ImportOptions): ImportResult {
  const current = dataService.load()
  let personaCount = 0
  
  // 合并人设
  if (options.importPersonas !== false) {
    const existingNames = new Set(current.personas.map(p => p.name.toLowerCase()))
    
    for (const persona of imported.personas) {
      if (!existingNames.has(persona.name.toLowerCase())) {
        current.personas.push(persona)
        personaCount++
      }
    }
  }
  
  // 合并配置
  if (options.importConfig) {
    current.config = { ...current.config, ...imported.config }
  }
  
  // 合并记忆
  const memoryCount = imported.memories.core.length
  if (options.importMemories !== false) {
    current.memories.core.push(...imported.memories.core)
  }
  
  dataService.save(current)
  
  return {
    success: true,
    message: `合并完成：新增 ${personaCount} 个人设，${memoryCount} 条记忆`,
    stats: {
      personaCount,
      messageCount: 0,
      memoryCount,
      emojiCount: 0,
    },
  }
}

// ============ 统一导入入口 ============

/**
 * 自动检测文件类型并导入
 */
export async function importFile(file: File, options: ImportOptions = {}): Promise<ImportResult> {
  const fileType = detectFileType(file)
  
  switch (fileType) {
    case 'json':
      return importFromJsonFile(file, options)
    case 'zip':
      return importFromZipFile(file, options)
    default:
      return {
        success: false,
        message: '不支持的文件格式，请选择 .json 或 .zip 文件',
        error: 'UNSUPPORTED_FORMAT',
      }
  }
}

// ============ 导出 ============

export const importService = {
  detectFileType,
  importFile,
  importFromJsonFile,
  importFromZipFile,
}

export default importService
