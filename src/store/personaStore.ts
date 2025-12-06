import { create } from 'zustand'
import type { Persona, Message } from '@/types'
import { defaultPersonas } from '@/lib/defaults'

interface PersonaState {
  personas: Persona[]
  activePersonaId: string | null
  
  // 人设管理
  addPersona: (persona: Omit<Persona, 'id' | 'messages'>) => string
  updatePersona: (id: string, persona: Partial<Omit<Persona, 'messages'>>) => void
  deletePersona: (id: string) => void
  clonePersona: (id: string) => string | null
  setActive: (id: string | null) => void
  getActive: () => Persona | undefined
  togglePin: (id: string) => void
  
  // 消息管理
  addMessage: (personaId: string, message: Omit<Message, 'id'>) => void
  updateMessage: (personaId: string, messageId: string, update: Partial<Message>) => void
  deleteMessage: (personaId: string, messageId: string) => void
  clearMessages: (personaId: string) => void
  recallMessage: (personaId: string, messageId: string) => void
  
  // 数据同步
  setPersonas: (personas: Persona[]) => void
  setActivePersonaId: (id: string | null) => void
}

const generateId = () => `persona_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export const usePersonaStore = create<PersonaState>()((set, get) => ({
  personas: defaultPersonas,
  activePersonaId: defaultPersonas.length > 0 ? defaultPersonas[0].id : null,

  addPersona: (persona) => {
    const id = generateId()
    set((state) => ({
      personas: [...state.personas, { ...persona, id, messages: [], createdAt: new Date().toISOString() }],
    }))
    return id
  },

  updatePersona: (id, persona) => {
    set((state) => ({
      personas: state.personas.map((p) => p.id === id ? { ...p, ...persona } : p),
    }))
  },

  deletePersona: (id) => {
    set((state) => ({
      personas: state.personas.filter((p) => p.id !== id),
      activePersonaId: state.activePersonaId === id ? null : state.activePersonaId,
    }))
  },

  clonePersona: (id) => {
    const source = get().personas.find((p) => p.id === id)
    if (!source) return null
    const newId = generateId()
    const clonedMessages = (source.messages || []).map((m) => ({
      ...m,
      id: generateMessageId(),
    }))
    set((state) => ({
      personas: [
        ...state.personas,
        { ...source, id: newId, name: `${source.name} (副本)`, isDefault: false, messages: clonedMessages },
      ],
    }))
    return newId
  },

  setActive: (id) => set({ activePersonaId: id }),

  getActive: () => {
    const { personas, activePersonaId } = get()
    return personas.find((p) => p.id === activePersonaId)
  },

  togglePin: (id) => {
    set((state) => ({
      personas: state.personas.map((p) => p.id === id ? { ...p, pinned: !p.pinned } : p),
    }))
  },

  addMessage: (personaId, message) => {
    const id = generateMessageId()
    const now = new Date().toISOString()
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === personaId
          ? { ...p, messages: [...(p.messages || []), { ...message, id }], lastMessageTime: now }
          : p
      ),
    }))
  },

  updateMessage: (personaId, messageId, update) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === personaId
          ? { ...p, messages: (p.messages || []).map((m) => m.id === messageId ? { ...m, ...update } : m) }
          : p
      ),
    }))
  },

  deleteMessage: (personaId, messageId) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === personaId ? { ...p, messages: (p.messages || []).filter((m) => m.id !== messageId) } : p
      ),
    }))
  },

  clearMessages: (personaId) => {
    set((state) => ({
      personas: state.personas.map((p) => p.id === personaId ? { ...p, messages: [] } : p),
    }))
  },

  recallMessage: (personaId, messageId) => {
    set((state) => ({
      personas: state.personas.map((p) =>
        p.id === personaId
          ? { ...p, messages: (p.messages || []).map((m) => m.id === messageId ? { ...m, isRecalled: true, text: '消息已撤回' } : m) }
          : p
      ),
    }))
  },

  // 数据同步方法
  setPersonas: (personas) => set({ personas }),
  setActivePersonaId: (id) => set({ activePersonaId: id }),
}))
