import { create } from 'zustand'
import type { EmojiItem } from '@/types'

interface EmojiState {
  emojis: EmojiItem[]
  
  // 操作
  addEmoji: (emoji: Omit<EmojiItem, 'id' | 'createdAt'>) => string
  deleteEmoji: (id: string) => void
  updateEmoji: (id: string, update: Partial<EmojiItem>) => void
  
  // 查询
  getEmojisByCategory: (category: string) => EmojiItem[]
  getRandomEmoji: (category?: string) => EmojiItem | null
  getAllCategories: () => string[]
  
  // 批量操作
  importEmojis: (emojis: Omit<EmojiItem, 'id' | 'createdAt'>[]) => void
  clearAllEmojis: () => void
  
  // 数据同步
  setEmojis: (emojis: EmojiItem[]) => void
}

const generateId = () => `emoji_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export const useEmojiStore = create<EmojiState>()((set, get) => ({
  emojis: [],

  addEmoji: (emoji) => {
    const id = generateId()
    const newEmoji: EmojiItem = { ...emoji, id, createdAt: new Date().toISOString() }
    set((state) => ({ emojis: [...state.emojis, newEmoji] }))
    return id
  },

  deleteEmoji: (id) => set((state) => ({ emojis: state.emojis.filter((e) => e.id !== id) })),

  updateEmoji: (id, update) => {
    set((state) => ({
      emojis: state.emojis.map((e) => e.id === id ? { ...e, ...update } : e),
    }))
  },

  getEmojisByCategory: (category) => get().emojis.filter((e) => e.category === category),

  getRandomEmoji: (category) => {
    const emojis = category ? get().getEmojisByCategory(category) : get().emojis
    return emojis.length === 0 ? null : emojis[Math.floor(Math.random() * emojis.length)]
  },

  getAllCategories: () => Array.from(new Set(get().emojis.map((e) => e.category))),

  importEmojis: (emojis) => {
    const newEmojis = emojis.map((emoji) => ({
      ...emoji,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }))
    set((state) => ({ emojis: [...state.emojis, ...newEmojis] }))
  },

  clearAllEmojis: () => set({ emojis: [] }),

  // 数据同步
  setEmojis: (emojis) => set({ emojis }),
}))
