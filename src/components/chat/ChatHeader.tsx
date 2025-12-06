'use client'

import { useState } from 'react'
import { Settings, User, ChevronDown, ChevronLeft, Upload, Download, Brain, MoreHorizontal, FileText, Lock, HelpCircle, Eraser } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'
import { useConfigStore } from '@/store/configStore'
import { MODEL_OPTIONS, getModelDisplayText } from '@/lib/constants'

interface ChatHeaderProps {
  title: string
  onOpenPersona: () => void
  onOpenSettings: () => void
  onOpenImport?: () => void
  onOpenExport?: () => void
  onOrganizeMemory?: () => void
  onClearMemory?: () => void
  onOpenLogs?: () => void
  onLock?: () => void
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function ChatHeader({
  title,
  onOpenPersona,
  onOpenSettings,
  onOpenImport,
  onOpenExport,
  onOrganizeMemory,
  onClearMemory,
  onOpenLogs,
  onLock,
  onMenuClick,
  showMenuButton,
}: ChatHeaderProps) {
  const { personas, activePersonaId } = usePersonaStore()
  const { gptConfig } = useConfigStore()
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const activePersona = personas.find((p) => p.id === activePersonaId)
  const displayTitle = activePersona?.name || title

  return (
    <header className="bg-[var(--theme-header-bg)] border-b border-[var(--theme-border)]">
      {/* 手机端布局 - 标题居中 (< 640px) */}
      <div className="flex sm:hidden items-center h-12 px-3 relative">
        {/* 左侧返回按钮 */}
        {showMenuButton && (
          <button onClick={onMenuClick} className="absolute left-2 p-1">
            <ChevronLeft className="w-6 h-6 text-[var(--theme-text-primary)]" />
          </button>
        )}
        
        {/* 居中标题 */}
        <div className="flex-1 text-center">
          <h1 className="font-medium text-[var(--theme-text-primary)] text-[17px] truncate px-10">{displayTitle}</h1>
        </div>
        
        {/* 右侧更多按钮 */}
        <button onClick={() => setShowMore(!showMore)} className="absolute right-2 p-1">
          <MoreHorizontal className="w-6 h-6 text-[var(--theme-text-primary)]" />
        </button>

        {/* 更多菜单 - 图标块网格 */}
        {showMore && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowMore(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--theme-chat-bg)] rounded-t-2xl p-4 pb-8 animate-slide-up">
              <div className="w-10 h-1 bg-[var(--theme-border)] rounded-full mx-auto mb-4" />
              <div className="grid grid-cols-4 gap-4">
                {/* 1. 教程 */}
                <button onClick={() => { window.open('https://ai.feishu.cn/wiki/CRWqw3VdTinXxSkCK4ZccyQKnXf', '_blank'); setShowMore(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-[var(--theme-text-secondary)]">教程</span>
                </button>
                {/* 2. 人设 */}
                <button onClick={() => { onOpenPersona(); setShowMore(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-[var(--theme-text-secondary)]">人设</span>
                </button>
                {/* 3. 导入 */}
                {onOpenImport && (
                  <button onClick={() => { onOpenImport(); setShowMore(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-[var(--theme-text-secondary)]">导入</span>
                  </button>
                )}
                {/* 4. 设置 */}
                <button onClick={() => { onOpenSettings(); setShowMore(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--theme-text-muted)] flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-[var(--theme-text-secondary)]">设置</span>
                </button>
                {/* 5. 记忆 */}
                {onOrganizeMemory && (
                  <button onClick={() => { onOrganizeMemory(); setShowMore(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                    <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-[var(--theme-text-secondary)]">记忆</span>
                  </button>
                )}
                {/* 6. 清理 */}
                {onClearMemory && (
                  <button onClick={() => { onClearMemory(); setShowMore(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                    <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                      <Eraser className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-[var(--theme-text-secondary)]">清理</span>
                  </button>
                )}
                {/* 7. 日志 */}
                {onOpenLogs && (
                  <button onClick={() => { onOpenLogs(); setShowMore(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                    <div className="w-12 h-12 rounded-xl bg-slate-500 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-[var(--theme-text-secondary)]">日志</span>
                  </button>
                )}
                {/* 7. 锁屏 */}
                {onLock && (
                  <button onClick={() => { onLock(); setShowMore(false); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[var(--theme-border)]/50 active:bg-[var(--theme-border)]">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-[var(--theme-text-secondary)]">锁屏</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* PC端布局 */}
      <div className="hidden sm:flex items-center justify-between px-4 py-3">
        {/* 左侧：头像 + 标题 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--theme-radius-avatar)] bg-[var(--theme-primary)] flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-medium text-[var(--theme-text-primary)]">{displayTitle}</h1>
            <button onClick={onOpenPersona}
              className="text-xs text-[var(--theme-primary)] hover:underline">点击选择人设</button>
          </div>
        </div>

        {/* 右侧：工具按钮 */}
        <div className="flex items-center gap-0.5">
          {onOpenImport && (
            <button onClick={onOpenImport} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
              <Upload className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-muted)]">导入</span>
            </button>
          )}
          {onOrganizeMemory && (
            <button onClick={onOrganizeMemory} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
              <Brain className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-muted)]">记忆</span>
            </button>
          )}
          {onClearMemory && (
            <button onClick={onClearMemory} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
              <Eraser className="w-4 h-4 text-red-500" />
              <span className="text-[10px] text-[var(--theme-text-muted)]">清理</span>
            </button>
          )}
          {onOpenLogs && (
            <button onClick={onOpenLogs} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
              <FileText className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-muted)]">日志</span>
            </button>
          )}
          {onLock && (
            <button onClick={onLock} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
              <Lock className="w-4 h-4 text-[var(--theme-text-secondary)]" />
              <span className="text-[10px] text-[var(--theme-text-muted)]">锁屏</span>
            </button>
          )}
          <button 
            onClick={() => window.open('https://ai.feishu.cn/wiki/CRWqw3VdTinXxSkCK4ZccyQKnXf', '_blank')}
            className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded"
          >
            <HelpCircle className="w-4 h-4 text-[var(--theme-text-secondary)]" />
            <span className="text-[10px] text-[var(--theme-text-muted)]">教程</span>
          </button>

          {/* 模型选择器 */}
          <div className="relative mx-1">
            <button onClick={() => setShowModelSelect(!showModelSelect)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)]/50 rounded">
              <span className="text-xs max-w-[100px] truncate">{getModelDisplayText(gptConfig.model)}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showModelSelect && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModelSelect(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[var(--theme-chat-bg)] rounded shadow-lg border border-[var(--theme-border)] py-1 min-w-[200px] max-h-[300px] overflow-y-auto z-50">
                  {MODEL_OPTIONS.map((m) => (
                    <button key={m.value} onClick={() => {
                      useConfigStore.getState().setGptConfig({ model: m.value })
                      setShowModelSelect(false)
                    }} className={`w-full px-3 py-1.5 text-xs text-left text-[var(--theme-text-primary)] hover:bg-[var(--theme-border)]/50 ${gptConfig.model === m.value ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]' : ''}`}>{m.text}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={onOpenSettings} className="flex flex-col items-center px-2 py-1 hover:bg-[var(--theme-border)]/50 rounded">
            <Settings className="w-4 h-4 text-[var(--theme-text-secondary)]" />
            <span className="text-[10px] text-[var(--theme-text-muted)]">设置</span>
          </button>
        </div>
      </div>
    </header>
  )
}
