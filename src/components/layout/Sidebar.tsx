'use client'

import { Plus, Settings, Trash2, Pin, Github } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'
import { useConfigStore } from '@/store/configStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'

interface SidebarProps {
  onSelectChat?: () => void
  onOpenSettings?: () => void
  onOpenPersona?: () => void
  onAddPersona?: () => void  // 点击+直接添加人设
}

export function Sidebar({ onSelectChat, onOpenSettings, onOpenPersona, onAddPersona }: SidebarProps) {
  const { personas, activePersonaId, setActive, deletePersona, togglePin } = usePersonaStore()
  const { userInfo } = useConfigStore()

  // 排序：置顶优先，然后按最后消息时间
  const sortedPersonas = [...personas].sort((a, b) => {
    // 置顶优先
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    // 按时间排序
    const aTime = a.lastMessageTime || (a.messages?.length ? new Date().toISOString() : '')
    const bTime = b.lastMessageTime || (b.messages?.length ? new Date().toISOString() : '')
    if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime()
    if (aTime) return -1
    if (bTime) return 1
    return 0
  })

  const handleSelectPersona = (personaId: string) => {
    setActive(personaId)
    onSelectChat?.()
  }

  const handleDeletePersona = (e: React.MouseEvent, personaId: string) => {
    e.stopPropagation()
    if (personas.length > 1) {
      deletePersona(personaId)
    }
  }

  return (
    <aside
      className="bg-[var(--theme-sidebar-bg)] border-r border-[var(--theme-border)] flex flex-col h-full w-[75vw] min-w-[260px] max-w-[300px] sm:w-[250px] sm:max-w-none"
      style={{ boxShadow: 'var(--theme-sidebar-shadow)' }}
    >
      {/* 头部 - 搜索 + 新建人设 */}
      <div className="p-3 border-b border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[var(--theme-input-bg)] rounded px-3 py-1.5 flex items-center gap-2 border border-[var(--theme-input-border)]">
            <svg className="w-4 h-4 text-[var(--theme-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-[var(--theme-text-muted)]">搜索</span>
          </div>
          <button
            onClick={onAddPersona}
            className="p-1.5 hover:bg-[var(--theme-border)] rounded transition-colors"
            title="新建人设"
          >
            <Plus className="w-5 h-5 text-[var(--theme-text-secondary)]" />
          </button>
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="px-4 py-2">
        <span className="text-xs text-[var(--theme-text-muted)] font-medium">联系人</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {sortedPersonas.map((persona) => {
          const messages = persona.messages || []
          const lastMessage = messages[messages.length - 1]
          return (
            <div
              key={persona.id}
              onClick={() => handleSelectPersona(persona.id)}
              className={cn(
                'px-4 py-3 cursor-pointer flex items-center justify-between group rounded-xl mx-2',
                'transition-all duration-200 ease-out',
                'hover:scale-[1.02] hover:shadow-md',
                'active:scale-[0.98]',
                activePersonaId === persona.id
                  ? 'bg-[var(--theme-primary)]/15 shadow-sm'
                  : 'hover:bg-[var(--theme-list-item-hover)]'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar name={persona.name} size="lg" src={persona.avatar} />
                  {activePersonaId === persona.id && (
                    <div 
                      className="absolute inset-0 ring-2 ring-[var(--theme-primary)]/40 animate-pulse" 
                      style={{ borderRadius: 'var(--theme-radius-avatar)' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--theme-text-primary)] truncate flex items-center gap-1">
                    {persona.pinned && <Pin className="w-3 h-3 text-[var(--theme-primary)]" />}
                    {persona.name}
                  </div>
                  <div className="text-xs text-[var(--theme-text-muted)] truncate">
                    {lastMessage
                      ? lastMessage.text.slice(0, 20) + (lastMessage.text.length > 20 ? '...' : '')
                      : `👋 和${persona.name}打个招呼吧~`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {/* 置顶按钮 */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(persona.id) }}
                  className={cn(
                    'p-1.5 rounded transition-all',
                    persona.pinned ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-text-muted)]'
                  )}
                  title={persona.pinned ? '取消置顶' : '置顶'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                {/* 删除按钮 - 暂时隐藏，避免误删
                {personas.length > 1 && !persona.isDefault && (
                  <button
                    onClick={(e) => handleDeletePersona(e, persona.id)}
                    className="p-1 hover:bg-red-50 rounded transition-all"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[var(--theme-text-muted)] hover:text-red-500 transition-colors" />
                  </button>
                )}
                */}
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部操作 */}
      <div className="p-3 border-t border-[var(--theme-border)]">
        {/* 项目信息 */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2 py-2 hover:bg-[var(--theme-border)]/50 rounded-lg transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #2DC100, #07C160)' }}>W</div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--theme-text-primary)]">微信-AI模拟器</div>
            <div className="text-xs text-[var(--theme-text-muted)]">Star on <a 
              href="https://github.com/onebai123/WeChatBot_Web" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:underline"
            >GitHub</a></div>
          </div>
          <Settings className="w-5 h-5 text-[var(--theme-text-secondary)]" />
        </div>
      </div>
    </aside>
  )
}
