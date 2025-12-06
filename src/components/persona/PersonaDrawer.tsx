'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check, Trash2, Edit2, RotateCcw, CopyPlus, Info, Download, Copy } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'
import { useMemoryStore } from '@/store/memoryStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common/Avatar'
import { AvatarUpload } from '@/components/common/AvatarUpload'
import type { Persona } from '@/types'

/** 计算认识时长 */
function formatDuration(createdAt?: string): string {
  if (!createdAt) return '未知'
  const diff = Date.now() - new Date(createdAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天认识'
  if (days === 1) return '认识 1 天'
  if (days < 30) return `认识 ${days} 天`
  const months = Math.floor(days / 30)
  if (months < 12) return `认识 ${months} 个月`
  const years = Math.floor(months / 12)
  return `认识 ${years} 年`
}

interface PersonaDrawerProps {
  open: boolean
  onClose: () => void
  autoShowAdd?: boolean  // 自动展开添加表单
}

export function PersonaDrawer({ open, onClose, autoShowAdd }: PersonaDrawerProps) {
  const { personas, activePersonaId, setActive, addPersona, updatePersona, deletePersona, clonePersona, clearMessages } = usePersonaStore()
  const { getCoreMemoriesByPersonaId, getTempLogs } = useMemoryStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', content: '', avatar: '' })
  const [showInfoId, setShowInfoId] = useState<string | null>(null)
  const [showJsonId, setShowJsonId] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // 如果 autoShowAdd 为 true，自动展开添加表单
  useEffect(() => {
    if (open && autoShowAdd) {
      setShowAddForm(true)
    }
  }, [open, autoShowAdd])

  const handleSelect = (persona: Persona) => {
    if (activePersonaId === persona.id) {
      setActive(null)
    } else {
      setActive(persona.id)
    }
    onClose()
  }

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.content.trim()) return
    addPersona({ name: formData.name, content: formData.content, avatar: formData.avatar || undefined })
    setFormData({ name: '', content: '', avatar: '' })
    setShowAddForm(false)
  }

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim() || !formData.content.trim()) return
    updatePersona(editingId, { name: formData.name, content: formData.content, avatar: formData.avatar || undefined })
    setEditingId(null)
    setFormData({ name: '', content: '', avatar: '' })
  }

  const handleEdit = (persona: Persona) => {
    setEditingId(persona.id)
    setFormData({ name: persona.name, content: persona.content, avatar: persona.avatar || '' })
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除此人设？')) {
      deletePersona(id)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 抽屉 */}
      <div className="absolute right-0 top-0 h-full w-96 bg-[var(--theme-chat-bg)] shadow-xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--theme-border)]">
          <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">选择人设</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--theme-border)]/50 rounded">
            <X className="w-5 h-5 text-[var(--theme-text-secondary)]" />
          </button>
        </div>

        {/* 人设列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 添加新人设 - 放在最上方 */}
          {showAddForm ? (
            <div className="p-4 rounded-lg border border-dashed border-[var(--theme-border)] space-y-3">
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="人设名称"
                className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-lg text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)]"
                autoFocus
              />
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="人设内容（系统提示词）"
                rows={6}
                className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-lg text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-1.5 bg-[var(--theme-primary)] text-white rounded-lg text-sm hover:opacity-90"
                >
                  创建
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ name: '', content: '', avatar: '' })
                  }}
                  className="flex-1 py-1.5 border border-[var(--theme-border)] rounded-lg text-sm text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)]/50"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 rounded-lg border border-dashed border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:border-[var(--theme-primary)] hover:text-[var(--theme-text-secondary)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加新人设
            </button>
          )}

          {personas.map((persona) => (
            <div
              key={persona.id}
              className={cn(
                'p-4 rounded-lg border cursor-pointer transition-all',
                activePersonaId === persona.id
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10'
                  : 'border-[var(--theme-border)] hover:border-[var(--theme-text-muted)]'
              )}
            >
              {editingId === persona.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AvatarUpload
                      value={formData.avatar}
                      onChange={(base64) => setFormData({ ...formData, avatar: base64 })}
                      size="md"
                    />
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="人设名称"
                      className="flex-1 px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-lg text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)]"
                    />
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="人设内容（系统提示词）"
                    rows={6}
                    className="w-full px-3 py-2 bg-[var(--theme-input-bg)] border border-[var(--theme-input-border)] rounded-lg text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-muted)] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 py-1.5 bg-[var(--theme-primary)] text-white rounded-lg text-sm hover:opacity-90"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setFormData({ name: '', content: '', avatar: '' })
                      }}
                      className="flex-1 py-1.5 border border-[var(--theme-border)] rounded-lg text-sm text-[var(--theme-text-secondary)] hover:bg-[var(--theme-border)]/50"
                    >
                      取消
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('确定要清空该人物的所有对话记录吗？此操作不可恢复。')) {
                        clearMessages(persona.id)
                        setEditingId(null)
                        setFormData({ name: '', content: '', avatar: '' })
                      }
                    }}
                    className="w-full mt-2 py-1 text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text-secondary)] flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    初始化对话
                  </button>
                </div>
              ) : (
                <div onClick={() => handleSelect(persona)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={persona.name} src={persona.avatar} size="sm" />
                      <span className="font-medium text-[var(--theme-text-primary)]">{persona.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {activePersonaId === persona.id && (
                        <Check className="w-4 h-4 text-[var(--theme-primary)]" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(persona)
                        }}
                        className="p-1 hover:bg-[var(--theme-border)]/50 rounded"
                        title="编辑"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowInfoId(showInfoId === persona.id ? null : persona.id)
                        }}
                        className="p-1 hover:bg-[var(--theme-border)]/50 rounded"
                        title="详情"
                      >
                        <Info className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clonePersona(persona.id)
                        }}
                        className="p-1 hover:bg-[var(--theme-border)]/50 rounded"
                        title="克隆"
                      >
                        <CopyPlus className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
                      </button>
                      {!persona.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(persona.id)
                          }}
                          className="p-1 hover:bg-[var(--theme-border)]/50 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[var(--theme-text-muted)]" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--theme-text-secondary)] line-clamp-3">
                    {persona.content.slice(0, 100)}...
                  </p>
                  
                  {/* 详情面板 */}
                  {showInfoId === persona.id && (
                    <div className="mt-3 pt-3 border-t border-[var(--theme-border)] space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between p-2 bg-[var(--theme-sidebar-bg)] rounded">
                          <span className="text-[var(--theme-text-muted)]">认识时长</span>
                          <span className="text-[var(--theme-text-primary)]">{formatDuration(persona.createdAt)}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-[var(--theme-sidebar-bg)] rounded">
                          <span className="text-[var(--theme-text-muted)]">对话次数</span>
                          <span className="text-[var(--theme-text-primary)]">{persona.messages?.length || 0} 条</span>
                        </div>
                        <div className="flex justify-between p-2 bg-[var(--theme-sidebar-bg)] rounded">
                          <span className="text-[var(--theme-text-muted)]">核心记忆</span>
                          <span className="text-[var(--theme-text-primary)]">{getCoreMemoriesByPersonaId(persona.id).length} 条</span>
                        </div>
                        <div className="flex justify-between p-2 bg-[var(--theme-sidebar-bg)] rounded">
                          <span className="text-[var(--theme-text-muted)]">临时记忆</span>
                          <span className="text-[var(--theme-text-primary)]">{getTempLogs(persona.id).length} 条</span>
                        </div>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowJsonId(showJsonId === persona.id ? null : persona.id)}
                          className="flex-1 py-1.5 text-xs border border-[var(--theme-border)] rounded flex items-center justify-center gap-1 hover:bg-[var(--theme-border)]/50"
                        >
                          <Copy className="w-3 h-3" />
                          查看 JSON
                        </button>
                        <button
                          onClick={() => {
                            const data = {
                              ...persona,
                              coreMemories: getCoreMemoriesByPersonaId(persona.id),
                              tempMemories: getTempLogs(persona.id),
                            }
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${persona.name}_backup.json`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="flex-1 py-1.5 text-xs border border-[var(--theme-border)] rounded flex items-center justify-center gap-1 hover:bg-[var(--theme-border)]/50"
                        >
                          <Download className="w-3 h-3" />
                          导出人设
                        </button>
                      </div>
                      
                      {/* JSON 查看器 */}
                      {showJsonId === persona.id && (
                        <div className="relative">
                          <pre className="p-2 bg-[var(--theme-sidebar-bg)] rounded text-[10px] text-[var(--theme-text-muted)] max-h-40 overflow-auto">
                            {JSON.stringify({
                              id: persona.id,
                              name: persona.name,
                              content: persona.content.slice(0, 200) + '...',
                              messagesCount: persona.messages?.length || 0,
                              coreMemoriesCount: getCoreMemoriesByPersonaId(persona.id).length,
                              tempLogsCount: getTempLogs(persona.id).length,
                              createdAt: persona.createdAt,
                            }, null, 2)}
                          </pre>
                          <button
                            onClick={async () => {
                              const data = {
                                ...persona,
                                coreMemories: getCoreMemoriesByPersonaId(persona.id),
                                tempMemories: getTempLogs(persona.id),
                              }
                              await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                              setCopySuccess(true)
                              setTimeout(() => setCopySuccess(false), 2000)
                            }}
                            className="absolute top-1 right-1 px-2 py-0.5 text-[10px] bg-[var(--theme-primary)] text-white rounded hover:opacity-90"
                          >
                            {copySuccess ? '已复制' : '复制全部'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-3 border-t border-[var(--theme-border)] bg-[var(--theme-sidebar-bg)]">
          <p className="text-xs text-[var(--theme-text-muted)]">
            人设定义了 AI 的性格和说话风格。点击人设即可应用，再次点击取消。
          </p>
        </div>
      </div>
    </div>
  )
}
