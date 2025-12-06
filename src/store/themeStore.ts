import { create } from 'zustand'
import { themes, themeOrder, getTheme, type ThemeConfig } from '@/themes'

interface ThemeState {
  currentTheme: string
  theme: ThemeConfig
  setTheme: (name: string) => void
  resetToWechat: () => void
  getThemeList: () => ThemeConfig[]
  // 数据同步
  setCurrentTheme: (name: string) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  currentTheme: 'wechat',
  theme: themes.wechat,

  setTheme: (name: string) => {
    const theme = getTheme(name)
    set({ currentTheme: name, theme })
    applyThemeToDOM(theme)
  },

  resetToWechat: () => {
    const theme = themes.wechat
    set({ currentTheme: 'wechat', theme })
    applyThemeToDOM(theme)
  },

  getThemeList: () => themeOrder.map((name) => themes[name]),

  // 数据同步
  setCurrentTheme: (name: string) => {
    const theme = getTheme(name)
    set({ currentTheme: name, theme })
    applyThemeToDOM(theme)
  },
}))

/** 将主题配置应用到 DOM CSS 变量 */
function applyThemeToDOM(theme: ThemeConfig) {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const { colors, radius, layout, style } = theme

  // 颜色变量
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-primary-hover', colors.primaryHover)
  root.style.setProperty('--theme-sidebar-bg', colors.sidebarBg)
  root.style.setProperty('--theme-header-bg', colors.headerBg)
  root.style.setProperty('--theme-chat-bg', colors.chatBg)
  root.style.setProperty('--theme-bubble-user', colors.bubbleUser)
  root.style.setProperty('--theme-bubble-ai', colors.bubbleAi)
  root.style.setProperty('--theme-bubble-user-text', colors.bubbleUserText)
  root.style.setProperty('--theme-bubble-ai-text', colors.bubbleAiText)
  root.style.setProperty('--theme-text-primary', colors.textPrimary)
  root.style.setProperty('--theme-text-secondary', colors.textSecondary)
  root.style.setProperty('--theme-text-muted', colors.textMuted)
  root.style.setProperty('--theme-border', colors.border)
  root.style.setProperty('--theme-divider', colors.divider)
  root.style.setProperty('--theme-avatar-user', colors.avatarUser)
  root.style.setProperty('--theme-avatar-ai', colors.avatarAi)
  root.style.setProperty('--theme-input-bg', colors.inputBg)
  root.style.setProperty('--theme-input-border', colors.inputBorder)
  root.style.setProperty('--theme-send-button', colors.sendButton)
  root.style.setProperty('--theme-send-button-text', colors.sendButtonText)

  // 圆角变量
  root.style.setProperty('--theme-radius-avatar', radius.avatar)
  root.style.setProperty('--theme-radius-bubble', radius.bubble)
  root.style.setProperty('--theme-radius-button', radius.button)
  root.style.setProperty('--theme-radius-card', radius.card)
  root.style.setProperty('--theme-radius-input', radius.input)

  // 布局变量
  root.style.setProperty('--theme-sidebar-width', layout.sidebarWidth)
  root.style.setProperty('--theme-header-height', layout.headerHeight)
  root.style.setProperty('--theme-input-padding', layout.inputAreaPadding)
  root.style.setProperty('--theme-message-padding', layout.messagePadding)

  // 样式变量
  root.style.setProperty('--theme-avatar-size', style.avatarSize)
  root.style.setProperty('--theme-bubble-shadow', style.bubbleShadow)
  root.style.setProperty('--theme-header-shadow', style.headerShadow)
  root.style.setProperty('--theme-sidebar-shadow', style.sidebarShadow)
  root.style.setProperty('--theme-card-shadow', style.cardShadow)
  root.style.setProperty('--theme-list-item-hover', style.listItemHover)
  root.style.setProperty('--theme-bubble-arrow', style.bubbleArrow ? '1' : '0')
  
  // 深色模式 class
  if (style.darkMode) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
