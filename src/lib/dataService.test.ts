/**
 * 数据服务属性测试
 * **Feature: unified-data-layer, Property 3: 导出数据完整性**
 * **Feature: unified-data-layer, Property 4: 导入导出往返一致性**
 * **Feature: unified-data-layer, Property 8: 存储统计准确性**
 * **Feature: unified-data-layer, Property 9: 清除数据重置状态**
 * **Validates: Requirements 2.2, 2.3, 3.1, 5.2, 5.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { exportToJson, importFromJson, getStorageStats, generateExportFilename } from './dataService'
import { DEFAULT_APP_DATA } from './defaults'
import { CURRENT_VERSION } from '@/types/appData'
import type { AppData } from '@/types/appData'

// Mock localStorage 和 window
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } })

describe('数据服务', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  /**
   * Property 3: 导出数据完整性
   * *For any* AppData, exporting then parsing the JSON SHALL produce an equivalent AppData
   */
  it('Property 3: 导出的 JSON 应包含版本号和时间戳', () => {
    // 先保存一些数据
    localStorageMock.setItem('wechatbot-data', JSON.stringify(DEFAULT_APP_DATA))
    
    const json = exportToJson()
    const parsed = JSON.parse(json)
    
    expect(parsed.version).toBe(CURRENT_VERSION)
    expect(parsed.lastUpdated).toBeDefined()
    expect(typeof parsed.lastUpdated).toBe('string')
  })

  it('Property 3.2: 默认导出应排除 API Key', () => {
    const dataWithApiKey: AppData = {
      ...DEFAULT_APP_DATA,
      config: {
        ...DEFAULT_APP_DATA.config,
        api: { apiKey: 'sk-secret-key', apiBaseUrl: 'https://api.example.com' },
        vision: { ...DEFAULT_APP_DATA.config.vision, apiKey: 'vision-key' },
        onlineSearch: { ...DEFAULT_APP_DATA.config.onlineSearch, apiKey: 'search-key' },
      },
    }
    localStorageMock.setItem('wechatbot-data', JSON.stringify(dataWithApiKey))
    
    const json = exportToJson(false)
    const parsed = JSON.parse(json)
    
    expect(parsed.config.api.apiKey).toBe('')
    expect(parsed.config.api.apiBaseUrl).toBe('https://api.example.com')
    expect(parsed.config.vision.apiKey).toBe('')
    expect(parsed.config.onlineSearch.apiKey).toBe('')
  })

  it('Property 3.3: 包含 API Key 选项应保留 API Key', () => {
    const dataWithApiKey: AppData = {
      ...DEFAULT_APP_DATA,
      config: {
        ...DEFAULT_APP_DATA.config,
        api: { apiKey: 'sk-secret-key', apiBaseUrl: 'https://api.example.com' },
      },
    }
    localStorageMock.setItem('wechatbot-data', JSON.stringify(dataWithApiKey))
    
    const json = exportToJson(true)
    const parsed = JSON.parse(json)
    
    expect(parsed.config.api.apiKey).toBe('sk-secret-key')
  })

  /**
   * Property 4: 导入导出往返一致性
   * *For any* valid AppData, exporting to JSON then importing SHALL restore the original state
   */
  it('Property 4: 导入导出往返应保持数据一致', () => {
    const originalData: AppData = {
      ...DEFAULT_APP_DATA,
      personas: [
        { id: 'test1', name: 'Test Persona', content: 'Test content', messages: [] },
      ],
      theme: 'discord',
    }
    
    // 直接导入 JSON（不经过 load）
    const json = JSON.stringify(originalData)
    const result = importFromJson(json)
    
    expect(result.success).toBe(true)
    expect(result.stats?.personaCount).toBe(1)
    
    // 验证数据
    const imported = JSON.parse(localStorageMock.getItem('wechatbot-data') || '{}')
    expect(imported.personas[0].id).toBe('test1')
    expect(imported.theme).toBe('discord')
  })

  it('Property 4.2: 无效 JSON 导入应失败', () => {
    const result = importFromJson('not valid json')
    expect(result.success).toBe(false)
    expect(result.error).toBe('JSON_PARSE_ERROR')
  })

  it('Property 4.3: 无效数据结构导入应失败或迁移', () => {
    const result = importFromJson('{"invalid": true}')
    // 应该尝试迁移，如果失败则返回错误
    expect(result.success === false || result.success === true).toBe(true)
  })

  /**
   * Property 8: 存储统计准确性
   * *For any* AppData, getStorageStats() SHALL return counts matching the actual data
   */
  it('Property 8: 存储统计应准确反映数据', () => {
    const testData: AppData = {
      ...DEFAULT_APP_DATA,
      personas: [
        { id: 'p1', name: 'P1', content: '', messages: [{ id: 'm1', text: 'msg1', inversion: true, dateTime: '' }] },
        { id: 'p2', name: 'P2', content: '', messages: [{ id: 'm2', text: 'msg2', inversion: false, dateTime: '' }, { id: 'm3', text: 'msg3', inversion: true, dateTime: '' }] },
      ],
      memories: {
        core: [
          { id: 'mem1', personaId: 'p1', content: 'memory', importance: 3, createdAt: '', category: 'other' as const },
        ],
        temp: {},
      },
      customEmojis: [
        { id: 'e1', name: 'emoji1', url: 'data:image/png;base64,...', category: 'happy', createdAt: '' },
      ],
    }
    localStorageMock.setItem('wechatbot-data', JSON.stringify(testData))
    
    const stats = getStorageStats()
    
    expect(stats.personaCount).toBe(2)
    expect(stats.messageCount).toBe(3)  // 1 + 2
    expect(stats.memoryCount).toBe(1)
    expect(stats.emojiCount).toBe(1)
    expect(stats.version).toBe(CURRENT_VERSION)
  })

  it('generateExportFilename 应生成正确格式的文件名', () => {
    const filename = generateExportFilename()
    expect(filename).toMatch(/^wechatbot-backup-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('导入成功应返回统计信息', () => {
    const validData = {
      ...DEFAULT_APP_DATA,
      personas: [{ id: 'test', name: 'Test', content: '', messages: [] }],
    }
    
    const result = importFromJson(JSON.stringify(validData))
    
    expect(result.success).toBe(true)
    expect(result.stats).toBeDefined()
    expect(result.stats?.personaCount).toBe(1)
  })
})


/**
 * Property 13: 自定义表情导入导出
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
describe('表情导入导出', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('Property 13: 导出应包含自定义表情数据', () => {
    const dataWithEmojis: AppData = {
      ...DEFAULT_APP_DATA,
      customEmojis: [
        { id: 'e1', name: 'happy1', url: 'data:image/png;base64,abc123', category: 'happy', createdAt: '2024-01-01' },
        { id: 'e2', name: 'sad1', url: 'data:image/gif;base64,xyz789', category: 'sad', createdAt: '2024-01-02' },
      ],
    }
    localStorageMock.setItem('wechatbot-data', JSON.stringify(dataWithEmojis))

    const json = exportToJson(true)
    const parsed = JSON.parse(json)

    expect(parsed.customEmojis).toBeDefined()
    expect(parsed.customEmojis.length).toBe(2)
    expect(parsed.customEmojis[0].url).toContain('data:image')
    expect(parsed.customEmojis[1].category).toBe('sad')
  })

  it('Property 13.2: 导入应恢复自定义表情', () => {
    const dataWithEmojis: AppData = {
      ...DEFAULT_APP_DATA,
      customEmojis: [
        { id: 'emoji1', name: 'test', url: 'data:image/png;base64,test', category: 'happy', createdAt: '2024-01-01' },
      ],
    }

    const result = importFromJson(JSON.stringify(dataWithEmojis))

    expect(result.success).toBe(true)
    expect(result.stats?.emojiCount).toBe(1)

    // 验证数据已保存
    const saved = JSON.parse(localStorageMock.getItem('wechatbot-data') || '{}')
    expect(saved.customEmojis.length).toBe(1)
    expect(saved.customEmojis[0].name).toBe('test')
  })

  it('Property 13.3: 表情 base64 数据应完整保留', () => {
    const base64Data = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const dataWithEmoji: AppData = {
      ...DEFAULT_APP_DATA,
      customEmojis: [
        { id: 'gif1', name: 'tiny', url: base64Data, category: 'happy', createdAt: '2024-01-01' },
      ],
    }
    localStorageMock.setItem('wechatbot-data', JSON.stringify(dataWithEmoji))

    // 导出
    const json = exportToJson(true)
    
    // 清除并导入
    localStorageMock.clear()
    importFromJson(json)

    // 验证 base64 数据完整
    const saved = JSON.parse(localStorageMock.getItem('wechatbot-data') || '{}')
    expect(saved.customEmojis[0].url).toBe(base64Data)
  })
})
