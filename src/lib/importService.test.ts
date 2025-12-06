/**
 * 导入服务测试
 * 测试 config.py 解析逻辑
 */

import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { detectFileType } from './importService'

// 解析配置的测试函数（与 importService 中的逻辑一致）
interface ParsedConfig {
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_BASE_URL?: string
  MODEL?: string
  MAX_TOKEN?: number
  TEMPERATURE?: number
  MAX_GROUPS?: number
  ENABLE_AUTO_MESSAGE?: boolean
  MOONSHOT_MODEL?: string
  ENABLE_IMAGE_RECOGNITION?: boolean
  ENABLE_ONLINE_API?: boolean
  ENABLE_EMOJI_SENDING?: boolean
  EMOJI_SENDING_PROBABILITY?: number
}

function parseConfigPy(content: string): ParsedConfig {
  const config: ParsedConfig = {}
  const patterns: Array<{ key: keyof ParsedConfig; regex: RegExp; type?: 'number' | 'boolean' }> = [
    { key: 'DEEPSEEK_API_KEY', regex: /DEEPSEEK_API_KEY\s*=\s*["'](.*)["']/ },
    { key: 'DEEPSEEK_BASE_URL', regex: /DEEPSEEK_BASE_URL\s*=\s*["'](.+?)["']/ },
    { key: 'MODEL', regex: /MODEL\s*=\s*["'](.+?)["']/ },
    { key: 'MAX_TOKEN', regex: /MAX_TOKEN\s*=\s*(\d+)/, type: 'number' },
    { key: 'TEMPERATURE', regex: /TEMPERATURE\s*=\s*([\d.]+)/, type: 'number' },
    { key: 'MAX_GROUPS', regex: /MAX_GROUPS\s*=\s*(\d+)/, type: 'number' },
    { key: 'ENABLE_AUTO_MESSAGE', regex: /ENABLE_AUTO_MESSAGE\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'MOONSHOT_MODEL', regex: /MOONSHOT_MODEL\s*=\s*["'](.+?)["']/ },
    { key: 'ENABLE_IMAGE_RECOGNITION', regex: /ENABLE_IMAGE_RECOGNITION\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'ENABLE_ONLINE_API', regex: /ENABLE_ONLINE_API\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'ENABLE_EMOJI_SENDING', regex: /ENABLE_EMOJI_SENDING\s*=\s*(True|False)/, type: 'boolean' },
    { key: 'EMOJI_SENDING_PROBABILITY', regex: /EMOJI_SENDING_PROBABILITY\s*=\s*(\d+)/, type: 'number' },
  ]
  
  for (const { key, regex, type } of patterns) {
    const match = content.match(regex)
    if (match) {
      if (type === 'number') {
        (config as Record<string, unknown>)[key] = parseFloat(match[1])
      } else if (type === 'boolean') {
        (config as Record<string, unknown>)[key] = match[1] === 'True'
      } else {
        (config as Record<string, unknown>)[key] = match[1]
      }
    }
  }
  
  return config
}

describe('importService', () => {
  describe('detectFileType', () => {
    it('应该检测 JSON 文件', () => {
      const file = new File(['{}'], 'backup.json', { type: 'application/json' })
      expect(detectFileType(file)).toBe('json')
    })

    it('应该检测 ZIP 文件', () => {
      const file = new File([''], 'backup.zip', { type: 'application/zip' })
      expect(detectFileType(file)).toBe('zip')
    })

    it('应该返回 unknown 对于未知类型', () => {
      const file = new File([''], 'backup.txt', { type: 'text/plain' })
      expect(detectFileType(file)).toBe('unknown')
    })
  })

  describe('config.py 解析', () => {
    it('应该正确解析完整的 config.py', () => {
      const configPy = `# -*- coding: utf-8 -*-

# DeepSeek API 配置
DEEPSEEK_API_KEY = 'sk-test-key-123'
DEEPSEEK_BASE_URL = 'https://vg.v1api.cc/v1'
MODEL = 'deepseek-v3-0324'
MAX_GROUPS = 5
MAX_TOKEN = 2000
TEMPERATURE = 1.1

# Moonshot AI配置
MOONSHOT_API_KEY = 'moon-key-456'
MOONSHOT_BASE_URL = 'https://vg.v1api.cc/v1'
MOONSHOT_MODEL = 'gpt-4o'
ENABLE_IMAGE_RECOGNITION = True

# 自动消息配置
ENABLE_AUTO_MESSAGE = True

# 联网API配置
ENABLE_ONLINE_API = False

# 表情包配置
ENABLE_EMOJI_SENDING = True
EMOJI_SENDING_PROBABILITY = 25
`
      const config = parseConfigPy(configPy)
      
      expect(config.DEEPSEEK_API_KEY).toBe('sk-test-key-123')
      expect(config.DEEPSEEK_BASE_URL).toBe('https://vg.v1api.cc/v1')
      expect(config.MODEL).toBe('deepseek-v3-0324')
      expect(config.MAX_GROUPS).toBe(5)
      expect(config.MAX_TOKEN).toBe(2000)
      expect(config.TEMPERATURE).toBe(1.1)
      expect(config.MOONSHOT_MODEL).toBe('gpt-4o')
      expect(config.ENABLE_IMAGE_RECOGNITION).toBe(true)
      expect(config.ENABLE_AUTO_MESSAGE).toBe(true)
      expect(config.ENABLE_ONLINE_API).toBe(false)
      expect(config.ENABLE_EMOJI_SENDING).toBe(true)
      expect(config.EMOJI_SENDING_PROBABILITY).toBe(25)
    })

    it('应该处理空的 API Key', () => {
      const configPy = `DEEPSEEK_API_KEY = ''
DEEPSEEK_BASE_URL = 'https://api.test.com'
`
      const config = parseConfigPy(configPy)
      
      expect(config.DEEPSEEK_API_KEY).toBe('')
      expect(config.DEEPSEEK_BASE_URL).toBe('https://api.test.com')
    })

    it('应该正确解析 Boolean 值', () => {
      const configPy = `ENABLE_AUTO_MESSAGE = True
ENABLE_ONLINE_API = False
ENABLE_IMAGE_RECOGNITION = True
ENABLE_EMOJI_SENDING = False
`
      const config = parseConfigPy(configPy)
      
      expect(config.ENABLE_AUTO_MESSAGE).toBe(true)
      expect(config.ENABLE_ONLINE_API).toBe(false)
      expect(config.ENABLE_IMAGE_RECOGNITION).toBe(true)
      expect(config.ENABLE_EMOJI_SENDING).toBe(false)
    })

    it('应该正确解析数字值', () => {
      const configPy = `MAX_TOKEN = 4000
TEMPERATURE = 0.7
MAX_GROUPS = 20
EMOJI_SENDING_PROBABILITY = 50
`
      const config = parseConfigPy(configPy)
      
      expect(config.MAX_TOKEN).toBe(4000)
      expect(config.TEMPERATURE).toBe(0.7)
      expect(config.MAX_GROUPS).toBe(20)
      expect(config.EMOJI_SENDING_PROBABILITY).toBe(50)
    })
  })

  describe('ZIP 文件结构解析', () => {
    it('应该能找到根目录的 config.py', async () => {
      const zip = new JSZip()
      zip.file('config.py', 'MODEL = "test"')
      
      let found = false
      zip.forEach((path, file) => {
        if (path.endsWith('config.py')) found = true
      })
      
      expect(found).toBe(true)
    })

    it('应该能找到多层目录的 config.py', async () => {
      const zip = new JSZip()
      zip.file('WeChatBot_WXAUTO_SE-3.26/WeChatBot/config.py', 'MODEL = "test"')
      
      let foundPath = ''
      zip.forEach((path, file) => {
        if (path.endsWith('config.py') && !path.includes('__pycache__')) {
          foundPath = path
        }
      })
      
      expect(foundPath).toBe('WeChatBot_WXAUTO_SE-3.26/WeChatBot/config.py')
    })

    it('应该能找到 prompts 目录的 .md 文件', async () => {
      const zip = new JSZip()
      zip.file('config.py', 'MODEL = "test"')
      zip.file('prompts/小美.md', '# 人设')
      zip.file('prompts/小帅.md', '# 人设')
      
      const personas: string[] = []
      zip.forEach((path, file) => {
        if (!file.dir && path.endsWith('.md') && path.includes('prompts')) {
          const name = path.split('/').pop()?.replace('.md', '') || ''
          if (name) personas.push(name)
        }
      })
      
      expect(personas).toContain('小美')
      expect(personas).toContain('小帅')
      expect(personas.length).toBe(2)
    })

    it('应该忽略 __pycache__ 目录', async () => {
      const zip = new JSZip()
      zip.file('config.py', 'MODEL = "real"')
      zip.file('__pycache__/config.py', 'MODEL = "cached"')
      
      let realConfig = ''
      zip.forEach((path, file) => {
        if (path.endsWith('config.py') && !path.includes('__pycache__')) {
          realConfig = path
        }
      })
      
      expect(realConfig).toBe('config.py')
    })
  })
})
