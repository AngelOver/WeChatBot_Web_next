'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'
import type { ThemeConfig } from '@/themes'

/** 将主题配置应用到 DOM CSS 变量 */
function applyThemeToDOM(theme: ThemeConfig) {
  const root = document.documentElement
  const { colors, radius } = theme

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

  // 圆角变量
  root.style.setProperty('--theme-radius-avatar', radius.avatar)
  root.style.setProperty('--theme-radius-bubble', radius.bubble)
  root.style.setProperty('--theme-radius-button', radius.button)
  root.style.setProperty('--theme-radius-card', radius.card)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useThemeStore()

  // 客户端加载时应用主题
  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  return <>{children}</>
}
