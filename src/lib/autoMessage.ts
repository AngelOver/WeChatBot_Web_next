/**
 * 主动消息模块 - AI 定时主动发起对话
 */

import { sendChatMessage } from './api'

interface AutoMessageParams {
  roleName: string
  recentMessages: Array<{ role: string; content: string }>
  prompt: string
  apiKey: string
  apiBaseUrl: string
  model: string
  systemPrompt?: string
}

/**
 * 检查当前是否在安静时间内
 * Args: startTime-开始时间(HH:mm), endTime-结束时间(HH:mm)
 * Returns: boolean-是否在安静时间
 */
export function isInQuietTime(startTime: string, endTime: string): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  // 跨夜情况 (如 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
  
  // 同日情况
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

/**
 * 生成随机间隔时间（分钟转毫秒）
 */
export function getRandomInterval(min: number, max: number): number {
  return (Math.random() * (max - min) + min) * 60 * 1000
}

/**
 * 生成主动消息内容
 */
export async function generateAutoMessage(params: AutoMessageParams): Promise<string> {
  const { roleName, recentMessages, prompt, apiKey, apiBaseUrl, model, systemPrompt } = params

  // 构建上下文
  const contextSummary = recentMessages.length > 0
    ? `最近对话:\n${recentMessages.slice(-5).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}`
    : '这是新的对话开始'

  const fullPrompt = `${prompt}\n\n${contextSummary}\n\n请以${roleName}的身份，用简短自然的语气主动发起对话。不要超过30字。`

  const response = await sendChatMessage({
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: fullPrompt },
    ],
    model,
    maxTokens: 100,
    temperature: 0.9,
    apiKey,
    apiBaseUrl,
  })

  return response.content.trim()
}

/**
 * 主动消息定时器管理类
 */
export class AutoMessageTimer {
  private timerId: NodeJS.Timeout | null = null
  private callback: (() => void) | null = null
  
  /**
   * 启动定时器
   */
  start(minInterval: number, maxInterval: number, callback: () => void) {
    this.stop()
    this.callback = callback
    this.scheduleNext(minInterval, maxInterval)
  }
  
  /**
   * 调度下一次触发
   */
  private scheduleNext(min: number, max: number) {
    const delay = getRandomInterval(min, max)
    this.timerId = setTimeout(() => {
      this.callback?.()
      this.scheduleNext(min, max)
    }, delay)
  }
  
  /**
   * 停止定时器
   */
  stop() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }
  
  /**
   * 重置定时器（用户发送消息后调用）
   */
  reset(minInterval: number, maxInterval: number) {
    if (this.callback) {
      this.start(minInterval, maxInterval, this.callback)
    }
  }
  
  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this.timerId !== null
  }
}

// 全局单例
export const autoMessageTimer = new AutoMessageTimer()
