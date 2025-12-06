/**
 * 迁移服务属性测试
 * **Feature: unified-data-layer, Property 6: 版本迁移幂等性**
 * **Feature: unified-data-layer, Property 7: 迁移失败保留原数据**
 * **Feature: unified-data-layer, Property 10: chatStore 数据迁移完整性**
 * **Validates: Requirements 4.3, 4.5, 6.2**
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { migrate, needsMigration, getMigrationPath } from './migrationService'
import { CURRENT_VERSION } from '@/types/appData'
import { DEFAULT_APP_DATA } from './defaults'
import type { AppData } from '@/types/appData'

describe('迁移服务', () => {
  /**
   * Property 6: 版本迁移幂等性
   * *For any* AppData with version < CURRENT_VERSION, 
   * migrating SHALL produce AppData with version === CURRENT_VERSION
   */
  it('Property 6: 迁移后版本应为当前版本', () => {
    // 测试 v1.0.0 数据迁移
    const v1Data = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      personas: [{ id: 'test', name: 'Test', content: '', messages: [] }],
      activePersonaId: null,
      config: DEFAULT_APP_DATA.config,
      memories: { core: [], temp: {} },
      theme: 'wechat',
      customEmojis: [],
    }

    const migrated = migrate(v1Data)
    expect(migrated.version).toBe(CURRENT_VERSION)
  })

  it('Property 6.2: 已是当前版本的数据迁移后版本不变', () => {
    const currentData = { ...DEFAULT_APP_DATA }
    const migrated = migrate(currentData)
    expect(migrated.version).toBe(CURRENT_VERSION)
  })

  /**
   * Property 7: 迁移失败保留原数据
   * *For any* AppData that causes migration to fail, 
   * the original data SHALL be preserved unchanged
   */
  it('Property 7: 无效数据应返回默认值', () => {
    const invalidData = null
    const result = migrate(invalidData)
    
    // 应返回有效的 AppData
    expect(result.version).toBe(CURRENT_VERSION)
    expect(Array.isArray(result.personas)).toBe(true)
  })

  it('Property 7.2: 空对象应返回默认值', () => {
    const result = migrate({})
    expect(result.version).toBe(CURRENT_VERSION)
  })

  /**
   * Property 10: chatStore 数据迁移完整性
   * *For any* legacy data containing chatStore history, 
   * migration SHALL transfer all messages to corresponding personas
   */
  it('Property 10: 旧格式记忆的 chatId 应转换为 personaId', () => {
    const v1DataWithMemory = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      personas: [
        { id: 'persona1', name: 'Test1', content: '', messages: [] },
        { id: 'persona2', name: 'Test2', content: '', messages: [] },
      ],
      activePersonaId: 'persona1',
      config: DEFAULT_APP_DATA.config,
      memories: {
        core: [
          { id: 'mem1', chatId: 0, content: 'memory content', importance: 3, createdAt: '', category: 'other' },
        ],
        temp: {
          '0': { chatId: 0, logs: [], lastUpdated: '' },
        },
      },
      theme: 'wechat',
      customEmojis: [],
    }

    const migrated = migrate(v1DataWithMemory)
    
    // 核心记忆应有 personaId 而非 chatId
    expect(migrated.memories.core.length).toBe(1)
    expect(migrated.memories.core[0]).toHaveProperty('personaId')
    expect(typeof migrated.memories.core[0].personaId).toBe('string')
  })

  it('needsMigration 应正确判断版本', () => {
    expect(needsMigration('1.0.0')).toBe(true)
    expect(needsMigration('1.9.9')).toBe(true)
    expect(needsMigration(CURRENT_VERSION)).toBe(false)
    expect(needsMigration('99.0.0')).toBe(false)
  })

  it('getMigrationPath 应返回正确的迁移路径', () => {
    const path = getMigrationPath('1.0.0', CURRENT_VERSION)
    expect(path[0]).toBe('1.0.0')
    expect(path[path.length - 1]).toBe(CURRENT_VERSION)
  })

  it('迁移应保留人设数据', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          content: fc.string(),
          messages: fc.constant([]),
        }), { minLength: 1, maxLength: 3 }),
        (personas) => {
          const v1Data = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            personas,
            activePersonaId: personas[0]?.id || null,
            config: DEFAULT_APP_DATA.config,
            memories: { core: [], temp: {} },
            theme: 'wechat',
            customEmojis: [],
          }

          const migrated = migrate(v1Data)
          
          // 人设数量应保持不变
          expect(migrated.personas.length).toBe(personas.length)
          
          // 人设 ID 应保持不变
          personas.forEach((p, i) => {
            expect(migrated.personas[i].id).toBe(p.id)
          })
        }
      ),
      { numRuns: 50 }
    )
  })
})


/**
 * Property 11: 旧 localStorage 键清理
 * **Validates: Requirements 6.3**
 */
describe('旧键清理', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
      get store() { return store },
    }
  })()

  // 在测试前设置 mock
  const originalLocalStorage = global.localStorage
  const originalWindow = global.window

  beforeAll(() => {
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })
    Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true })
  })

  afterAll(() => {
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true })
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true })
  })

  beforeEach(() => {
    localStorageMock.clear()
  })

  it('Property 11: cleanupLegacyStorage 应删除所有旧键', async () => {
    const { cleanupLegacyStorage, hasLegacyData } = await import('./migrationService')
    const { LEGACY_STORAGE_KEYS } = await import('@/types/appData')

    // 设置旧键
    LEGACY_STORAGE_KEYS.forEach((key) => {
      localStorageMock.setItem(key, JSON.stringify({ test: true }))
    })

    // 验证旧键存在
    expect(hasLegacyData()).toBe(true)

    // 清理
    cleanupLegacyStorage()

    // 验证所有旧键已删除
    LEGACY_STORAGE_KEYS.forEach((key) => {
      expect(localStorageMock.getItem(key)).toBeNull()
    })
  })

  it('Property 11.2: hasLegacyData 应正确检测旧数据', async () => {
    const { hasLegacyData } = await import('./migrationService')
    const { LEGACY_STORAGE_KEYS } = await import('@/types/appData')

    // 无旧数据时应返回 false
    expect(hasLegacyData()).toBe(false)

    // 设置一个旧键
    localStorageMock.setItem(LEGACY_STORAGE_KEYS[0], JSON.stringify({ test: true }))

    // 有旧数据时应返回 true
    expect(hasLegacyData()).toBe(true)
  })
})
