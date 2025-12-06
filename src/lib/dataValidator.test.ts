/**
 * 数据验证属性测试
 * **Feature: unified-data-layer, Property 5: 数据验证拒绝无效输入**
 * **Validates: Requirements 3.2, 3.4**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateAppData, isValidAppData } from './dataValidator'
import { DEFAULT_APP_DATA } from './defaults'
import type { AppData } from '@/types/appData'
import { CURRENT_VERSION } from '@/types/appData'

describe('数据验证服务', () => {
  /**
   * Property 5: 数据验证拒绝无效输入
   * *For any* invalid JSON or malformed AppData structure, 
   * importing SHALL fail and return an error result
   */
  
  it('Property 5.1: null/undefined 应被拒绝', () => {
    expect(validateAppData(null).valid).toBe(false)
    expect(validateAppData(undefined).valid).toBe(false)
  })

  it('Property 5.2: 非对象类型应被拒绝', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.array(fc.anything())),
        (value) => {
          const result = validateAppData(value)
          expect(result.valid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 5.3: 缺少必需字段的对象应被拒绝', () => {
    const requiredFields = ['version', 'lastUpdated', 'personas', 'config', 'memories', 'theme', 'customEmojis']
    
    requiredFields.forEach((field) => {
      const data = { ...DEFAULT_APP_DATA }
      delete (data as Record<string, unknown>)[field]
      
      const result = validateAppData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes(field))).toBe(true)
    })
  })

  it('Property 5.4: 字段类型错误应被拒绝', () => {
    // version 应为 string
    const wrongVersion = { ...DEFAULT_APP_DATA, version: 123 }
    expect(validateAppData(wrongVersion).valid).toBe(false)

    // personas 应为数组
    const wrongPersonas = { ...DEFAULT_APP_DATA, personas: 'not an array' }
    expect(validateAppData(wrongPersonas).valid).toBe(false)

    // theme 应为 string
    const wrongTheme = { ...DEFAULT_APP_DATA, theme: null }
    expect(validateAppData(wrongTheme).valid).toBe(false)
  })

  it('Property 5.5: Persona ID 必须是非空字符串', () => {
    const invalidPersonas = [
      { ...DEFAULT_APP_DATA, personas: [{ id: '', name: 'test', content: '', messages: [] }] },
      { ...DEFAULT_APP_DATA, personas: [{ id: 123, name: 'test', content: '', messages: [] }] },
      { ...DEFAULT_APP_DATA, personas: [{ name: 'test', content: '', messages: [] }] }, // 缺少 id
    ]

    invalidPersonas.forEach((data) => {
      const result = validateAppData(data)
      expect(result.valid).toBe(false)
    })
  })

  it('Property 5.6: CoreMemory personaId 必须是非空字符串', () => {
    const invalidMemory = {
      ...DEFAULT_APP_DATA,
      memories: {
        core: [{ id: 'mem1', personaId: '', content: 'test', importance: 3, createdAt: '', category: 'other' }],
        temp: {},
      },
    }
    
    const result = validateAppData(invalidMemory)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('personaId'))).toBe(true)
  })

  it('有效的 DEFAULT_APP_DATA 应通过验证', () => {
    const result = validateAppData(DEFAULT_APP_DATA)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('isValidAppData 应正确判断数据有效性', () => {
    expect(isValidAppData(DEFAULT_APP_DATA)).toBe(true)
    expect(isValidAppData(null)).toBe(false)
    expect(isValidAppData({})).toBe(false)
  })
})
