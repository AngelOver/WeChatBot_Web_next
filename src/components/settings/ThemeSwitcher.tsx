'use client'

import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'
import type { ThemeConfig } from '@/themes'
import { Check } from 'lucide-react'

/** 主题选择器网格 */
export function ThemeSwitcher() {
  const { currentTheme, setTheme, getThemeList } = useThemeStore()
  const themeList = getThemeList()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {themeList.map((theme) => (
        <ThemeCard
          key={theme.name}
          theme={theme}
          isActive={currentTheme === theme.name}
          onClick={() => setTheme(theme.name)}
        />
      ))}
    </div>
  )
}

/** 单个主题卡片 */
function ThemeCard({
  theme,
  isActive,
  onClick,
}: {
  theme: ThemeConfig
  isActive: boolean
  onClick: () => void
}) {
  const { colors, radius, style } = theme

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-3 rounded-xl border-2 transition-all text-left',
        isActive
          ? 'border-[var(--theme-primary)] shadow-lg ring-2 ring-[var(--theme-primary)]/20'
          : 'border-gray-200 hover:border-gray-300 hover:shadow'
      )}
    >
      {/* 预览区域 */}
      <div
        className="h-24 rounded-lg overflow-hidden mb-2"
        style={{ background: colors.chatBg }}
      >
        {/* 头部 */}
        <div
          className="h-5 flex items-center px-2"
          style={{ background: colors.headerBg, boxShadow: style.headerShadow }}
        >
          <div className="w-8 h-2 rounded" style={{ background: colors.textMuted }} />
        </div>

        {/* 消息区域 */}
        <div className="p-2 space-y-1.5">
          {/* AI 消息 */}
          <div className="flex items-start gap-1">
            <div
              className="w-4 h-4 flex-shrink-0"
              style={{
                background: colors.avatarAi,
                borderRadius: style.avatarShape === 'circle' ? '50%' : '2px',
              }}
            />
            <div
              className="h-4 w-16"
              style={{
                background: colors.bubbleAi,
                borderRadius: radius.bubble,
                boxShadow: style.bubbleShadow,
              }}
            />
          </div>
          {/* 用户消息 */}
          <div className="flex items-start gap-1 justify-end">
            <div
              className="h-4 w-12"
              style={{
                background: colors.bubbleUser,
                borderRadius: radius.bubble,
                boxShadow: style.bubbleShadow,
              }}
            />
            <div
              className="w-4 h-4 flex-shrink-0"
              style={{
                background: colors.avatarUser,
                borderRadius: style.avatarShape === 'circle' ? '50%' : '2px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 主题信息 */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{theme.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{theme.displayName}</div>
          <div className="text-xs text-gray-500 truncate">{theme.description}</div>
        </div>
      </div>

      {/* 选中标记 */}
      {isActive && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: colors.primary }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  )
}

/** 快速主题切换按钮组（用于头部等位置） */
export function QuickThemeSwitcher({ className }: { className?: string }) {
  const { currentTheme, setTheme, getThemeList } = useThemeStore()
  const themeList = getThemeList()

  return (
    <div className={cn('flex gap-1', className)}>
      {themeList.map((t) => (
        <button
          key={t.name}
          onClick={() => setTheme(t.name)}
          title={t.displayName}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all text-sm',
            currentTheme === t.name
              ? 'ring-2 ring-[var(--theme-primary)] ring-offset-1'
              : 'hover:bg-gray-100'
          )}
          style={currentTheme === t.name ? { background: t.colors.primary } : {}}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
