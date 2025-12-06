/**
 * 记忆关联属性测试
 * **Feature: unified-data-layer, Property 12: 记忆关联有效性**
 * **Validates: Requirements 7.3, 7.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useMemoryStore } from './memoryStore'
import { usePersonaStore } from './personaStore'

describe('记忆关联', () => {
  beforeEach(() => {
    // 重置 Store 状态
    useMemoryStore.setState({ coreMemories: [], tempMemories: {} })
    usePersonaStore.setState({ personas: [], activePersonaId: null })
  })

  /**
   * Property 12: 记忆关联有效性
   * *For any* CoreMemory, its personaId SHALL reference an existing Persona
   */
  it('Property 12: 添加的记忆应关联到有效的 personaId', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 5 }),
        (personaId, content, importance) => {
          // 先添加人设
          usePersonaStore.setState({
            personas: [{ id: personaId, name: 'Test', content: '', messages: [] }],
          })

          // 添加记忆
          const memoryId = useMemoryStore.getState().addCoreMemory({
            personaId,
            content,
            importance,
            category: 'other',
          })

          // 验证记忆已添加
          const memories = useMemoryStore.getState().coreMemories
          const addedMemory = memories.find((m) => m.id === memoryId)
          
          expect(addedMemory).toBeDefined()
          expect(addedMemory?.personaId).toBe(personaId)
          expect(addedMemory?.content).toBe(content)

          // 清理
          useMemoryStore.setState({ coreMemories: [], tempMemories: {} })
          usePersonaStore.setState({ personas: [], activePersonaId: null })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 12.2: 按 personaId 查询应只返回该人设的记忆', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        (personaIds) => {
          const uniqueIds = [...new Set(personaIds)]
          if (uniqueIds.length < 2) return true // 需要至少2个不同的ID

          // 为每个 personaId 添加记忆
          uniqueIds.forEach((id, index) => {
            useMemoryStore.getState().addCoreMemory({
              personaId: id,
              content: `Memory for ${id}`,
              importance: index + 1,
              category: 'other',
            })
          })

          // 查询第一个 personaId 的记忆
          const firstId = uniqueIds[0]
          const memories = useMemoryStore.getState().getCoreMemoriesByPersonaId(firstId)

          // 验证只返回该 personaId 的记忆
          expect(memories.every((m) => m.personaId === firstId)).toBe(true)
          expect(memories.length).toBe(1)

          // 清理
          useMemoryStore.setState({ coreMemories: [], tempMemories: {} })
          return true
        }
      ),
      { numRuns: 30 }
    )
  })

  it('Property 12.3: 临时记忆应正确关联到 personaId', () => {
    const personaId = 'test-persona'
    
    // 添加临时记忆
    useMemoryStore.getState().addTempLog(personaId, { role: 'user', content: 'Hello' })
    useMemoryStore.getState().addTempLog(personaId, { role: 'ai', content: 'Hi there' })

    // 验证临时记忆
    const logs = useMemoryStore.getState().getTempLogs(personaId)
    expect(logs.length).toBe(2)
    expect(logs[0].content).toBe('Hello')
    expect(logs[1].content).toBe('Hi there')

    // 验证其他 personaId 没有记忆
    const otherLogs = useMemoryStore.getState().getTempLogs('other-persona')
    expect(otherLogs.length).toBe(0)
  })
})
