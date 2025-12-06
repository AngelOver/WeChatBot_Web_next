'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useConfigStore } from '@/store/configStore'
import { usePersonaStore } from '@/store/personaStore'
import { useMemoryStore } from '@/store/memoryStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { PersonaDrawer } from '../persona/PersonaDrawer'
import { SettingsModal } from '../settings/SettingsModal'
import { ImportModal } from '../settings/ImportModal'
import { ExportModal } from '../settings/ExportModal'
import { LogViewer } from '../settings/LogViewer'
import { streamChatMessage } from '@/lib/api'
import { generateTickleResponse, organizeMemory, shouldAutoOrganize } from '@/lib/memory'
import { recognizeImage } from '@/lib/vision'
import { transcribeAudio } from '@/lib/speech'
import { processWithSearch } from '@/lib/onlineSearch'
import { autoMessageTimer, generateAutoMessage, isInQuietTime } from '@/lib/autoMessage'
import { shouldSendEmoji, suggestEmoji, appendEmoji, shouldSendGifEmoji } from '@/lib/emoji'
import { chatLog, memoryLog, autoMsgLog, apiLog } from '@/lib/logger'
import { Github, MessageCircle, Rocket } from 'lucide-react'

interface ChatContainerProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
  onLock?: () => void
}

export function ChatContainer({ onMenuClick, showMenuButton, onLock }: ChatContainerProps) {
  const { 
    gptConfig, apiConfig, userInfo,
    autoMessageConfig, quietTimeConfig, visionConfig, onlineSearchConfig, emojiConfig 
  } = useConfigStore()
  const { 
    personas, activePersonaId, setActive,
    addMessage, updateMessage, recallMessage, clearMessages 
  } = usePersonaStore()
  const { addTempLog, addCoreMemory, clearTempLogs, getTopCoreMemories } = useMemoryStore()
  
  const [loading, setLoading] = useState(false)
  const [showPersona, setShowPersona] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'api' | 'profile' | 'smart' | 'theme' | undefined>(undefined)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动选择第一个人设
  useEffect(() => {
    if (!activePersonaId && personas.length > 0) {
      setActive(personas[0].id)
    }
  }, [activePersonaId, personas, setActive])

  // 人设 = 会话，直接从当前人设获取消息
  const currentPersona = personas.find(p => p.id === activePersonaId)
  const messages = currentPersona?.messages || []

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // 判断是否需要显示时间分隔（间隔超过5分钟）
  const shouldShowTimeDivider = (prevTime?: string, currTime?: string): boolean => {
    if (!prevTime || !currTime) return true
    try {
      const prev = new Date(prevTime).getTime()
      const curr = new Date(currTime).getTime()
      return Math.abs(curr - prev) > 5 * 60 * 1000 // 5分钟
    } catch {
      return true
    }
  }

  // 格式化时间分隔显示
  const formatTimeDivider = (dateTime?: string): string => {
    if (!dateTime) return ''
    try {
      const date = new Date(dateTime)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      
      if (messageDate.getTime() === today.getTime()) {
        return time
      } else if (messageDate.getTime() === yesterday.getTime()) {
        return `昨天 ${time}`
      } else {
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' + time
      }
    } catch {
      return dateTime
    }
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text: string, imageBase64?: string) => {
    if (!activePersonaId || loading) return

    // 检查 API Key，未配置时弹出设置并强制打开 API 标签页
    if (!apiConfig.apiKey) {
      setSettingsDefaultTab('api')
      setShowSettings(true)
      showToast('请先配置 API Key')
      return
    }

    // 重置主动消息定时器
    if (autoMessageConfig.enabled) {
      autoMessageTimer.reset(autoMessageConfig.minInterval, autoMessageConfig.maxInterval)
      autoMsgLog.debug('定时器已重置')
    }

    // 添加用户消息
    const userText = imageBase64 ? (text || '请看这张图片') : text
    chatLog.info(`发送消息: ${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}`)
    addMessage(activePersonaId, {
      text: userText,
      inversion: true,
      dateTime: new Date().toLocaleString('zh-CN'),
      error: false,
      image: imageBase64,  // 存储图片
    })

    // 记录临时记忆 - 用户消息
    addTempLog(activePersonaId, { role: 'user', content: userText })
    memoryLog.debug('记录临时记忆 - 用户消息')

    // 添加AI占位消息
    addMessage(activePersonaId, {
      text: '',
      inversion: false,
      dateTime: new Date().toLocaleString('zh-CN'),
      loading: true,
      error: false,
    })

    setLoading(true)

    // 获取当前人设
    const persona = personas.find(p => p.id === activePersonaId)
    const roleName = persona?.name || 'AI'

    // 构建系统消息（包含核心记忆）
    let systemMessage = persona?.content || gptConfig.systemMessage
    const coreMemories = getTopCoreMemories(activePersonaId, 10)
    if (coreMemories.length > 0) {
      const memoryText = coreMemories.map(m => `- ${m.content}`).join('\n')
      systemMessage = `${systemMessage}\n\n[核心记忆]\n${memoryText}`
      memoryLog.info(`加载 ${coreMemories.length} 条核心记忆到系统提示词`)
    }

    // 构建消息历史
    const contextMessages = messages.slice(-gptConfig.talkCount * 2).map((m) => ({
      role: m.inversion ? 'user' : 'assistant',
      content: m.text,
    }))

    try {
      let userContent = text
      
      // 图片识别
      if (imageBase64 && visionConfig.enabled) {
        showToast('正在识别图片...')
        const imageDescription = await recognizeImage({
          imageBase64,
          apiKey: visionConfig.apiKey || apiConfig.apiKey,
          apiBaseUrl: visionConfig.apiBaseUrl || apiConfig.apiBaseUrl,
          model: visionConfig.model,
          prompt: text || '请描述这张图片的内容',
        })
        userContent = `[用户发送了一张图片，图片内容: ${imageDescription}]\n用户说: ${text}`
      }

      // 联网搜索
      if (onlineSearchConfig.enabled && !imageBase64) {
        const searchResult = await processWithSearch({
          userMessage: text,
          searchConfig: onlineSearchConfig,
          mainConfig: { apiKey: apiConfig.apiKey, apiBaseUrl: apiConfig.apiBaseUrl, model: gptConfig.model },
        })
        if (searchResult.needSearch && searchResult.searchResult) {
          userContent = `${text}\n\n[联网搜索参考信息: ${searchResult.searchResult}]`
        }
      }

      // 获取最新的消息列表和最后一条消息ID（用于流式更新）
      const latestPersona = usePersonaStore.getState().personas.find(p => p.id === activePersonaId)
      const latestMessages = latestPersona?.messages || []
      const lastMsgId = latestMessages[latestMessages.length - 1]?.id

      // 流式请求
      apiLog.info(`调用 API: ${gptConfig.model}`, { url: apiConfig.apiBaseUrl })
      let responseText = ''
      const stream = streamChatMessage({
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          ...contextMessages,
          { role: 'user', content: userContent },
        ],
        model: gptConfig.model,
        maxTokens: gptConfig.maxTokens,
        temperature: gptConfig.temperature,
        apiKey: apiConfig.apiKey,
        apiBaseUrl: apiConfig.apiBaseUrl,
      })

      // 逐步接收流式内容
      for await (const chunk of stream) {
        responseText += chunk
        updateMessage(activePersonaId, lastMsgId || '', {
          text: responseText,
          loading: true,
        })
      }
      apiLog.info(`收到回复: ${responseText.length} 字符`)

      // 检查是否有 [tickle] 指令
      if (responseText.includes('[tickle]')) {
        responseText = responseText.replace(/\[tickle\]/g, '')
        addMessage(activePersonaId, {
          text: `${roleName} 拍了拍你`,
          inversion: false,
          dateTime: new Date().toLocaleString('zh-CN'),
          isTickle: true,
        })
      }

      // 检查是否有 [tickle_self] 指令
      if (responseText.includes('[tickle_self]')) {
        responseText = responseText.replace(/\[tickle_self\]/g, '')
        addMessage(activePersonaId, {
          text: `${roleName} 拍了拍自己`,
          inversion: false,
          dateTime: new Date().toLocaleString('zh-CN'),
          isTickle: true,
        })
      }

      // 检查是否有 [recall] 指令 - 撤回上一条
      if (responseText.includes('[recall]')) {
        responseText = responseText.replace(/\[recall\]/g, '')
        // 撤回最后一条AI消息
        const aiMessages = latestMessages.filter((m: { inversion?: boolean; isTickle?: boolean }) => !m.inversion && !m.isTickle)
        if (aiMessages.length > 1) {
          const toRecall = aiMessages[aiMessages.length - 2]
          if (toRecall) {
            recallMessage(activePersonaId!, toRecall.id)
          }
        }
      }

      // 处理分隔的多条消息：支持 \\ 或 换行符
      const messageParts = responseText.trim()
        .split(/\\\\|\\(?![\\])|\n{2,}/)  // 支持 \\ 或 双换行
        .map(s => s.trim().replace(/\n/g, ' '))  // 单换行替换为空格
        .filter(Boolean)
      
      if (messageParts.length > 1) {
        // 多条消息：更新第一条，然后逐个添加后续消息
        let firstText = messageParts[0]
        if (emojiConfig.enabled && shouldSendEmoji(emojiConfig.probability)) {
          const emoji = suggestEmoji(firstText)
          if (emoji) firstText = appendEmoji(firstText, emoji)
        }
        
        updateMessage(activePersonaId, lastMsgId || '', {
          text: firstText,
          loading: false,
          dateTime: new Date().toLocaleString('zh-CN'),
        })
        
        // 延迟添加后续消息，模拟打字效果
        for (let i = 1; i < messageParts.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
          let partText = messageParts[i]
          // 最后一条消息可能加表情
          if (i === messageParts.length - 1 && emojiConfig.enabled && shouldSendEmoji(emojiConfig.probability)) {
            const emoji = suggestEmoji(partText)
            if (emoji) partText = appendEmoji(partText, emoji)
          }
          addMessage(activePersonaId, {
            text: partText,
            inversion: false,
            dateTime: new Date().toLocaleString('zh-CN'),
          })
        }
        
        // 记录临时记忆 - 合并所有消息
        addTempLog(activePersonaId, { role: 'ai', content: messageParts.join(' ') })
      } else {
        // 单条消息：原有逻辑
        let finalText = responseText.trim()
        if (emojiConfig.enabled && shouldSendEmoji(emojiConfig.probability)) {
          const emoji = suggestEmoji(finalText)
          if (emoji) {
            finalText = appendEmoji(finalText, emoji)
          }
        }

        updateMessage(activePersonaId, lastMsgId || '', {
          text: finalText,
          loading: false,
          dateTime: new Date().toLocaleString('zh-CN'),
        })

        // 记录临时记忆 - AI 回复
        addTempLog(activePersonaId, { role: 'ai', content: finalText })
      }
      memoryLog.debug('记录临时记忆 - AI 回复')
      chatLog.info('对话完成')

      // AI 自动发送 GIF 表情（根据概率和情绪）
      if (emojiConfig.enabled && apiConfig.apiKey) {
        try {
          const gifUrl = await shouldSendGifEmoji(
            responseText,
            emojiConfig.probability,
            { apiKey: apiConfig.apiKey, apiBaseUrl: apiConfig.apiBaseUrl, model: gptConfig.model }
          )
          if (gifUrl) {
            await new Promise(resolve => setTimeout(resolve, 500))
            addMessage(activePersonaId, {
              text: '[表情]',
              inversion: false,
              dateTime: new Date().toLocaleString('zh-CN'),
              image: gifUrl,
            })
          }
        } catch (e) {
          console.error('发送表情失败:', e)
        }
      }

      // 更新会话标题（如果是第一条消息）
      if (messages.length === 0) {
        // 人设名称不需要更新
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发送失败'
      apiLog.error('API 调用失败', { error: errorMessage })
      const errPersona = usePersonaStore.getState().personas.find(p => p.id === activePersonaId)
      const errMessages = errPersona?.messages || []
      const errLastMsgId = errMessages[errMessages.length - 1]?.id
      updateMessage(activePersonaId, errLastMsgId || '', {
        text: errorMessage,
        loading: false,
        error: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // 拍一拍功能 - 触发 AI 回应
  const handleTickle = async (target: 'ai' | 'user' = 'ai') => {
    if (!activePersonaId || loading) return

    const persona = personas.find(p => p.id === activePersonaId)
    const roleName = persona?.name || 'AI'
    const userName = userInfo.name || '我'

    // 添加拍一拍消息
    const tickleText = target === 'ai' 
      ? `你 拍了拍 ${roleName}`
      : `你 拍了拍 自己`
    
    addMessage(activePersonaId, {
      text: tickleText,
      inversion: false,
      dateTime: new Date().toLocaleString('zh-CN'),
      isTickle: true,
    })

    showToast('👉 拍一拍')

    // 触发 AI 回应
    if (apiConfig.apiKey) {
      try {
        const response = await generateTickleResponse({
          roleName,
          personaContent: persona?.content || '',
          apiKey: apiConfig.apiKey,
          apiBaseUrl: apiConfig.apiBaseUrl,
          model: gptConfig.model,
        })

        if (response) {
          let text = response
          // 处理 AI 回拍
          if (text.includes('[tickle]')) {
            text = text.replace(/\[tickle\]/g, '').trim()
            addMessage(activePersonaId, {
              text: `${roleName} 拍了拍你`,
              inversion: false,
              dateTime: new Date().toLocaleString('zh-CN'),
              isTickle: true,
            })
          }
          // 处理换行分隔，拆分成多条消息
          if (text) {
            const parts = text.split(/\\+/).map(s => s.trim()).filter(Boolean)
            for (const part of parts) {
              addMessage(activePersonaId, {
                text: part,
                inversion: false,
                dateTime: new Date().toLocaleString('zh-CN'),
              })
            }
          }
        }
      } catch (e) {
        console.error('拍一拍回应失败:', e)
      }
    }
  }

  // 发送语音消息 - 转写后发送给 AI
  const handleSendVoice = async (audioBase64: string, duration: number) => {
    if (!activePersonaId) return
    
    // 先添加语音消息到界面
    addMessage(activePersonaId, {
      text: '[语音消息]',
      inversion: true,
      dateTime: new Date().toLocaleString('zh-CN'),
      audio: audioBase64,
      audioDuration: duration,
    })
    
    chatLog.info(`发送语音消息: ${duration}秒`)
    
    // 调用 Whisper API 转写语音
    if (apiConfig.apiKey) {
      try {
        showToast('正在识别语音...')
        const transcribedText = await transcribeAudio({
          audioBase64,
          apiKey: apiConfig.apiKey,
          apiBaseUrl: apiConfig.apiBaseUrl,
        })
        
        if (transcribedText) {
          chatLog.info(`语音转写: ${transcribedText}`)
          // 更新语音消息显示转写文本
          const latestPersona = usePersonaStore.getState().personas.find(p => p.id === activePersonaId)
          const latestMessages = latestPersona?.messages || []
          const voiceMsgId = latestMessages[latestMessages.length - 1]?.id
          if (voiceMsgId) {
            updateMessage(activePersonaId, voiceMsgId, { text: transcribedText })
          }
          // 发送转写文本给 AI
          await handleSend(transcribedText)
        }
      } catch (error) {
        console.error('语音转写失败:', error)
        showToast('语音识别失败')
      }
    }
  }

  // 手动记忆整理
  const handleOrganizeMemory = async () => {
    if (!activePersonaId || loading) return
    if (!apiConfig.apiKey) {
      showToast('请先配置 API Key')
      return
    }

    const unorganizedMessages = messages.filter(
      (m) => !m.isTickle && !m.isRecalled && m.text?.trim()
    )

    if (unorganizedMessages.length < 5) {
      showToast('消息太少，无需整理')
      return
    }

    showToast('正在整理记忆...')
    memoryLog.info(`开始记忆整理, 消息数: ${unorganizedMessages.length}`)

    try {
      const persona = personas.find(p => p.id === activePersonaId)
      const roleName = persona?.name || 'AI'

      const result = await organizeMemory({
        messages: unorganizedMessages.map((m) => ({
          role: m.inversion ? 'user' : 'assistant',
          content: m.text,
          dateTime: m.dateTime,
        })),
        roleName,
        apiKey: apiConfig.apiKey,
        apiBaseUrl: apiConfig.apiBaseUrl,
        model: gptConfig.model,
      })

      // 保存到核心记忆
      if (result.summary) {
        addCoreMemory({
          personaId: activePersonaId,
          content: result.summary,
          importance: result.importance,
          category: result.category,
        })
        memoryLog.info(`保存核心记忆, 重要度: ${result.importance}, 分类: ${result.category}`)
      }

      // 清空临时记忆
      clearTempLogs(activePersonaId)
      memoryLog.debug('临时记忆已清空')

      // 添加记忆分隔线
      addMessage(activePersonaId, {
        text: `📝 记忆已整理: ${result.summary.slice(0, 100)}...`,
        inversion: false,
        dateTime: new Date().toLocaleString('zh-CN'),
        isMemoryDivider: true,
      })

      showToast('记忆整理完成')
    } catch (e) {
      console.error('记忆整理失败:', e)
      showToast('记忆整理失败')
    }
  }

  // 清理当前角色记忆（聊天记录）
  const handleClearMemory = () => {
    if (!activePersonaId) return
    if (confirm('确定要清理当前角色的所有聊天记录吗？此操作不可恢复！')) {
      clearMessages(activePersonaId)
      showToast('聊天记录已清理')
    }
  }

  // 自动记忆整理检查
  useEffect(() => {
    if (gptConfig.autoMemoryOrganize && shouldAutoOrganize(messages.length)) {
      memoryLog.info(`触发自动记忆整理, 消息数: ${messages.length}`)
      handleOrganizeMemory()
    }
  }, [messages.length])

  // 主动消息功能
  const handleAutoMessage = useCallback(async () => {
    if (!activePersonaId || loading || !apiConfig.apiKey) return
    
    // 检查安静时间
    if (quietTimeConfig.enabled && isInQuietTime(quietTimeConfig.startTime, quietTimeConfig.endTime)) {
      autoMsgLog.debug('当前处于安静时间，跳过主动消息')
      return
    }

    autoMsgLog.info('触发主动消息')
    const persona = personas.find(p => p.id === activePersonaId)
    const roleName = persona?.name || 'AI'
    const systemPrompt = persona?.content || gptConfig.systemMessage

    try {
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.inversion ? 'user' : 'assistant',
        content: m.text,
      }))

      const autoMsg = await generateAutoMessage({
        roleName,
        recentMessages,
        prompt: autoMessageConfig.prompt,
        apiKey: apiConfig.apiKey,
        apiBaseUrl: apiConfig.apiBaseUrl,
        model: gptConfig.model,
        systemPrompt,
      })

      if (autoMsg) {
        addMessage(activePersonaId, {
          text: autoMsg,
          inversion: false,
          dateTime: new Date().toLocaleString('zh-CN'),
        })
        showToast('💬 主动消息')
      }
    } catch (e) {
      console.error('主动消息生成失败:', e)
    }
  }, [activePersonaId, loading, apiConfig, quietTimeConfig, autoMessageConfig, gptConfig, messages, personas, addMessage])

  // 启动/停止主动消息定时器
  useEffect(() => {
    if (autoMessageConfig.enabled && apiConfig.apiKey && activePersonaId) {
      autoMessageTimer.start(autoMessageConfig.minInterval, autoMessageConfig.maxInterval, handleAutoMessage)
    } else {
      autoMessageTimer.stop()
    }
    return () => autoMessageTimer.stop()
  }, [autoMessageConfig.enabled, autoMessageConfig.minInterval, autoMessageConfig.maxInterval, apiConfig.apiKey, activePersonaId, handleAutoMessage])

  // 如果没有当前人设，尝试自动选择第一个
  if (!currentPersona) {
    if (personas.length > 0) {
      // 有人设但没选中，自动选择第一个
      setActive(personas[0].id)
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--theme-chat-bg)]">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--theme-chat-bg)] relative">
      <ChatHeader
        title={currentPersona.name}
        onOpenPersona={() => setShowPersona(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenImport={() => setShowImport(true)}
        onOpenExport={() => setShowExport(true)}
        onOrganizeMemory={handleOrganizeMemory}
        onClearMemory={handleClearMemory}
        onOpenLogs={() => setShowLogs(true)}
        onLock={onLock}
        onMenuClick={onMenuClick}
        showMenuButton={showMenuButton}
      />

      {/* Toast 提示 */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/70 text-white rounded-lg text-sm">
          {toast}
        </div>
      )}

      {/* 消息列表 */}
      <div 
        className="flex-1 overflow-y-auto py-4"
        style={userInfo.backgroundImage ? {
          backgroundImage: `url(${userInfo.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center pt-4 px-4">
            {/* 项目介绍面板 */}
            <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-[var(--theme-border)] shadow-lg p-5 mb-6">
              <h2 className="text-lg font-bold text-center text-[var(--theme-text-primary)] mb-3 flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5 text-[var(--theme-primary)]" />
                WeChatBot Web 模拟器
                <a href="https://github.com/onebai123/WeChatBot_Web" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-gray-900 hover:text-gray-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </h2>
              <div className="flex justify-center gap-2 text-xs mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">👤 角色扮演</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded">🧠 记忆整理</span>
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded">📥 导入配置</span>
              </div>
              <div className="flex justify-center gap-2 text-xs mb-4">
                <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded">💬 主动消息</span>
                <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded">😊 表情识别</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-600 rounded">👋 拍一拍</span>
              </div>
              <div className="space-y-1.5 text-sm text-[var(--theme-text-secondary)] ml-8 sm:ml-10 md:ml-14 lg:ml-16">
                <p className="text-green-600 font-medium">✅ 快速开始</p>
                <p className="ml-2">1. 点击顶部 <span className="text-orange-500 font-medium">设置</span> → 填写接口地址和密钥</p>
                <p className="ml-2">2. 点击 <span className="text-blue-500 font-medium">＋</span> 或 <span className="text-blue-500 font-medium">人设</span> → 选择或创建 AI 角色</p>
                <p className="ml-2">3. <span className="text-green-600 font-medium">开始对话！</span></p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex flex-wrap justify-center gap-3 text-xs items-center">
                <span className="text-green-600">🌐 开源项目</span>
                <a href="https://ai.feishu.cn/wiki/CRWqw3VdTinXxSkCK4ZccyQKnXf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-500 hover:underline">
                  <Rocket className="w-3 h-3" /> 一键部署
                </a>
                <span className="text-blue-600">📱 可打包 APP</span>
              </div>
              <p className="text-center text-xs text-[var(--theme-text-muted)] mt-2">
                🔒 数据存储在浏览器本地，不上传服务器
              </p>
            </div>
            
            {/* 示例对话预览 */}
            <div className="max-w-sm w-full space-y-3 opacity-80 mb-6">
              <div className="text-center text-xs text-[var(--theme-text-muted)] mb-4">昨天 23:42</div>
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm text-sm text-gray-600">生气了？</div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[var(--theme-primary)]/20 rounded-2xl px-4 py-2 shadow-sm text-sm text-gray-600">没有啦...就是有点想你了 🥺</div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm text-sm text-gray-600">那你怎么不回我消息</div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[var(--theme-primary)]/20 rounded-2xl px-4 py-2 shadow-sm text-sm text-gray-600">手机没电了嘛！你看你又凶我 😤</div>
              </div>
            </div>
            {/* 引导文字 */}
            <div className="text-center">
              <div className="text-lg font-medium text-[var(--theme-text-primary)]">💬 发送消息开始你们的故事~</div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            // 检查是否需要显示时间分隔
            const showTimeDivider = index === 0 || shouldShowTimeDivider(
              messages[index - 1]?.dateTime,
              message.dateTime
            )
            return (
              <div key={message.id}>
                {showTimeDivider && (
                  <div className="text-center text-xs text-[var(--theme-text-muted)] py-3">
                    {formatTimeDivider(message.dateTime)}
                  </div>
                )}
                <MessageBubble message={message} personaId={activePersonaId!} onTickle={handleTickle} />
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSend={handleSend} 
        onSendVoice={handleSendVoice}
        onTickle={handleTickle} 
        disabled={loading}
        visionEnabled={visionConfig.enabled}
      />

      {/* 人设抽屉 */}
      <PersonaDrawer open={showPersona} onClose={() => setShowPersona(false)} />

      {/* 设置弹窗 */}
      <SettingsModal 
        open={showSettings} 
        onClose={() => { setShowSettings(false); setSettingsDefaultTab(undefined) }}
        defaultTab={settingsDefaultTab}
      />

      {/* 导入配置弹窗 */}
      <ImportModal open={showImport} onClose={() => setShowImport(false)} />

      {/* 导出数据弹窗 */}
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />

      {/* 日志查看器 */}
      <LogViewer open={showLogs} onClose={() => setShowLogs(false)} />
    </div>
  )
}
