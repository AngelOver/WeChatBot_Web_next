'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check, Trash2, Edit2, RotateCcw, CopyPlus, Brain, Download, Copy, Camera } from 'lucide-react'
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
  const [showCoreMemories, setShowCoreMemories] = useState<string | null>(null)
  const [showTempMemories, setShowTempMemories] = useState<string | null>(null)
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
                  <div className="flex items-center gap-3 mb-3">
                    {/* 可点击修改头像 */}
                    <div className="relative group" onClick={(e) => e.stopPropagation()}>
                      <AvatarUpload
                        value={persona.avatar}
                        onChange={(base64) => updatePersona(persona.id, { avatar: base64 })}
                        size="md"
                      />
                      {/* 相机图标提示 */}
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--theme-text-primary)] truncate">{persona.name}</span>
                        {activePersonaId === persona.id && (
                          <span className="px-2 py-0.5 bg-[var(--theme-primary)] text-white text-[10px] rounded-full">当前</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--theme-text-muted)] mt-0.5">{formatDuration(persona.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--theme-text-secondary)] line-clamp-2 mb-2">
                    {persona.content.slice(0, 60)}...
                  </p>
                  {/* 操作按钮 - 一行显示 */}
                  <div className="flex gap-1.5 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(persona)}
                      className="px-2 py-1 text-[11px] bg-[var(--theme-primary)] text-white rounded flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <Edit2 className="w-3 h-3" />
                      编辑
                    </button>
                    <label className="px-2 py-1 text-[11px] border border-blue-200 text-blue-600 rounded flex items-center gap-0.5 hover:bg-blue-50 cursor-pointer whitespace-nowrap">
                      <Camera className="w-3 h-3" />
                      头像
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              updatePersona(persona.id, { avatar: ev.target?.result as string })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    <button
                      onClick={() => setShowInfoId(showInfoId === persona.id ? null : persona.id)}
                      className="px-2 py-1 text-[11px] border border-purple-200 text-purple-600 rounded flex items-center gap-0.5 hover:bg-purple-50 whitespace-nowrap"
                    >
                      <Brain className="w-3 h-3" />
                      记忆
                    </button>
                    <button
                      onClick={() => clonePersona(persona.id)}
                      className="px-2 py-1 text-[11px] border border-[var(--theme-border)] text-[var(--theme-text-secondary)] rounded flex items-center gap-0.5 hover:bg-[var(--theme-border)]/50 whitespace-nowrap"
                    >
                      <CopyPlus className="w-3 h-3" />
                      克隆
                    </button>
                    {!persona.isDefault && (
                      <button
                        onClick={() => handleDelete(persona.id)}
                        className="px-2 py-1 text-[11px] border border-red-200 text-red-500 rounded flex items-center gap-0.5 hover:bg-red-50 whitespace-nowrap"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    )}
                  </div>
                  
                  {/* 记忆面板 */}
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
                        <button 
                          onClick={() => setShowCoreMemories(showCoreMemories === persona.id ? null : persona.id)}
                          className="flex justify-between p-2 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                        >
                          <span className="text-purple-600">核心记忆</span>
                          <span className="text-purple-700 font-medium">{getCoreMemoriesByPersonaId(persona.id).length} 条 →</span>
                        </button>
                        <button 
                          onClick={() => setShowTempMemories(showTempMemories === persona.id ? null : persona.id)}
                          className="flex justify-between p-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                        >
                          <span className="text-orange-600">临时记忆</span>
                          <span className="text-orange-700 font-medium">{getTempLogs(persona.id).length} 条 →</span>
                        </button>
                      </div>
                      
                      {/* 清理按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (confirm('确定要清屏吗？将清除所有聊天记录。')) {
                              clearMessages(persona.id)
                            }
                          }}
                          className="flex-1 py-1.5 text-xs border border-blue-200 text-blue-600 rounded flex items-center justify-center gap-1 hover:bg-blue-50"
                        >
                          🧹 清屏
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定要清理临时记忆吗？')) {
                              useMemoryStore.getState().clearTempLogs(persona.id)
                            }
                          }}
                          className="flex-1 py-1.5 text-xs border border-orange-200 text-orange-600 rounded flex items-center justify-center gap-1 hover:bg-orange-50"
                        >
                          📝 清临时
                        </button>
                        <button
                          onClick={() => {
                            const memories = getCoreMemoriesByPersonaId(persona.id)
                            if (memories.length === 0) {
                              alert('暂无核心记忆')
                              return
                            }
                            if (confirm(`确定要清理 ${memories.length} 条核心记忆吗？`)) {
                              memories.forEach(m => useMemoryStore.getState().deleteCoreMemory(m.id))
                            }
                          }}
                          className="flex-1 py-1.5 text-xs border border-purple-200 text-purple-600 rounded flex items-center justify-center gap-1 hover:bg-purple-50"
                        >
                          🧠 清核心
                        </button>
                      </div>
                      
                      {/* 核心记忆列表 */}
                      {showCoreMemories === persona.id && (
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-purple-700">核心记忆列表</p>
                            {getCoreMemoriesByPersonaId(persona.id).length > 0 && (
                              <button
                                onClick={() => {
                                  if (confirm(`确定要清理 ${getCoreMemoriesByPersonaId(persona.id).length} 条核心记忆吗？`)) {
                                    const memories = getCoreMemoriesByPersonaId(persona.id)
                                    memories.forEach(m => useMemoryStore.getState().deleteCoreMemory(m.id))
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 bg-purple-200 text-purple-700 rounded hover:bg-purple-300"
                              >
                                清空
                              </button>
                            )}
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {getCoreMemoriesByPersonaId(persona.id).length === 0 ? (
                              <p className="text-xs text-purple-400">暂无核心记忆</p>
                            ) : (
                              <div className="space-y-1">
                                {getCoreMemoriesByPersonaId(persona.id).map((m, i) => (
                                  <div key={m.id} className="text-xs p-1.5 bg-white rounded group">
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="text-purple-600 flex-1">{i + 1}. {m.content.slice(0, 35)}{m.content.length > 35 ? '...' : ''}</span>
                                      <span className="text-[10px] text-purple-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                      <button
                                        onClick={() => {
                                          if (confirm('删除这条核心记忆？')) {
                                            useMemoryStore.getState().deleteCoreMemory(m.id)
                                          }
                                        }}
                                        className="text-red-400 hover:text-red-600 ml-1"
                                        title="删除"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 临时记忆列表 */}
                      {showTempMemories === persona.id && (
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-orange-700">临时记忆列表</p>
                            {getTempLogs(persona.id).length > 0 && (
                              <button
                                onClick={() => {
                                  if (confirm('确定要清理临时记忆吗？')) {
                                    useMemoryStore.getState().clearTempLogs(persona.id)
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 bg-orange-200 text-orange-700 rounded hover:bg-orange-300"
                              >
                                清空
                              </button>
                            )}
                          </div>
                          <div className="max-h-32 overflow-y-auto">
                            {getTempLogs(persona.id).length === 0 ? (
                              <p className="text-xs text-orange-400">暂无临时记忆</p>
                            ) : (
                              <div className="space-y-1">
                                {(() => {
                                  const logs = getTempLogs(persona.id)
                                  const startIndex = Math.max(0, logs.length - 10)
                                  return logs.slice(-10).map((log, i) => {
                                    const actualIndex = startIndex + i
                                    return (
                                      <div key={actualIndex} className="text-xs p-1.5 bg-white rounded">
                                        <div className="flex justify-between items-start gap-1">
                                          <span className="text-orange-600 flex-1">
                                            <span className="font-medium">{log.role === 'user' ? '👤' : '🤖'}</span> {log.content.slice(0, 20)}{log.content.length > 20 ? '...' : ''}
                                          </span>
                                          <span className="text-[10px] text-orange-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                          <button
                                            onClick={() => {
                                              if (confirm('删除这条临时记忆？')) {
                                                useMemoryStore.getState().deleteTempLog(persona.id, actualIndex)
                                              }
                                            }}
                                            className="text-red-400 hover:text-red-600 ml-1"
                                            title="删除"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })
                                })()}
                                {getTempLogs(persona.id).length > 10 && (
                                  <p className="text-[10px] text-orange-400 text-center">仅显示最近 10 条</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
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
