/**
 * @deprecated 此 Store 已废弃，请使用 personaStore 代替
 * 保留此文件仅用于迁移旧数据
 * 新代码请使用 usePersonaStore 管理会话和消息
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Chat, Message } from '@/types'

/** @deprecated 使用 personaStore 代替 */
interface ChatState {
  history: Chat[]
  active: number | null
  currentChat: Chat | null
  
  // Actions
  initFromStorage: () => void
  addChat: (title?: string, personaId?: string) => number
  deleteChat: (uuid: number) => void
  setActive: (uuid: number) => void
  updateChatTitle: (uuid: number, title: string) => void
  
  // Message actions
  addMessage: (uuid: number, message: Omit<Message, 'id'>) => void
  updateMessage: (uuid: number, messageId: string, update: Partial<Message>) => void
  deleteMessage: (uuid: number, messageId: string) => void
  clearMessages: (uuid: number) => void
  recallMessage: (uuid: number, messageId: string) => void
}

const generateUuid = () => Date.now() + Math.floor(Math.random() * 1000)
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

/** @deprecated 使用 usePersonaStore 代替 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      history: [],
      active: null,
      currentChat: null,

      initFromStorage: () => {
        const { history, active } = get()
        if (history.length === 0) {
          // 创建默认会话
          const uuid = generateUuid()
          set({
            history: [{ uuid, title: '新的聊天', messages: [] }],
            active: uuid,
          })
        } else {
          // 去重：如果存在重复 uuid，重新分配
          const seen = new Set<number>()
          const deduped = history.map((chat) => {
            if (seen.has(chat.uuid)) {
              return { ...chat, uuid: generateUuid() }
            }
            seen.add(chat.uuid)
            return chat
          })
          const hasChange = deduped.some((c, i) => c.uuid !== history[i].uuid)
          if (hasChange) {
            set({ history: deduped, active: deduped[0].uuid })
          } else {
            set({ active: active ?? history[0].uuid })
          }
        }
      },

      addChat: (title = '新的聊天', personaId?: string) => {
        const uuid = generateUuid()
        set((state) => ({
          history: [{ uuid, title, messages: [], personaId }, ...state.history],
          active: uuid,
        }))
        return uuid
      },

      deleteChat: (uuid) => {
        set((state) => {
          const newHistory = state.history.filter((c) => c.uuid !== uuid)
          const newActive = newHistory.length > 0 
            ? (state.active === uuid ? newHistory[0].uuid : state.active)
            : null
          return { history: newHistory, active: newActive }
        })
      },

      setActive: (uuid) => {
        set({ active: uuid })
      },

      updateChatTitle: (uuid, title) => {
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid ? { ...c, title } : c
          ),
        }))
      },

      addMessage: (uuid, message) => {
        const id = generateMessageId()
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid
              ? { ...c, messages: [...c.messages, { ...message, id }] }
              : c
          ),
        }))
      },

      updateMessage: (uuid, messageId, update) => {
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...update } : m
                  ),
                }
              : c
          ),
        }))
      },

      deleteMessage: (uuid, messageId) => {
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid
              ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
              : c
          ),
        }))
      },

      clearMessages: (uuid) => {
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid ? { ...c, messages: [] } : c
          ),
        }))
      },

      recallMessage: (uuid, messageId) => {
        set((state) => ({
          history: state.history.map((c) =>
            c.uuid === uuid
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, isRecalled: true, text: '消息已撤回' } : m
                  ),
                }
              : c
          ),
        }))
      },
    }),
    { name: 'wechatbot-chat-storage' }
  )
)
