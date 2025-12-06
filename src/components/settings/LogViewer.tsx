'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Download, RefreshCw } from 'lucide-react'
import { logger, type LogEntry, type LogLevel, type LogCategory } from '@/lib/logger'
import { cn } from '@/lib/utils'

interface LogViewerProps {
  open: boolean
  onClose: () => void
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: 'text-green-600 bg-green-50',
  warn: 'text-yellow-600 bg-yellow-50',
  error: 'text-red-600 bg-red-50',
  debug: 'text-purple-600 bg-purple-50',
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: '信息',
  warn: '警告',
  error: '错误',
  debug: '调试',
}

const CATEGORY_LABELS: Record<LogCategory, string> = {
  general: '通用',
  event: '事件',
  schedule: '定时任务',
}

const CATEGORY_COLORS: Record<LogCategory, string> = {
  general: 'bg-gray-500',
  event: 'bg-orange-500',
  schedule: 'bg-cyan-500',
}

export function LogViewer({ open, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 初始加载
    setLogs(logger.getLogs())

    // 订阅更新
    const unsubscribe = logger.subscribe(setLogs)
    return () => { unsubscribe() }
  }, [])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
    return true
  })

  const handleExport = () => {
    const content = logger.export()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wechatbot_logs_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    logger.clear()
    setLogs([])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-[700px] max-w-[95vw] h-[80vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h2 className="text-base font-semibold">📋 应用日志</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="p-1.5 hover:bg-gray-200 rounded" title="导出日志">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleClear} className="p-1.5 hover:bg-gray-200 rounded text-red-500" title="清空日志">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-gray-50/50">
          {/* 分类筛选 */}
          <span className="text-xs text-gray-500">分类:</span>
          {(['all', 'general', 'event', 'schedule'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2 py-0.5 text-xs rounded transition-colors',
                categoryFilter === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}
            </button>
          ))}
          
          <span className="text-gray-300 mx-1">|</span>
          
          {/* 级别筛选 */}
          <span className="text-xs text-gray-500">级别:</span>
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={cn(
                'px-2 py-0.5 text-xs rounded transition-colors',
                levelFilter === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {level === 'all' ? '全部' : LEVEL_LABELS[level]}
            </button>
          ))}
          <div className="flex-1" />
          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            自动滚动
          </label>
          <span className="text-xs text-gray-400">{filteredLogs.length} 条</span>
        </div>

        {/* 日志列表 */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-gray-900"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              暂无日志
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={cn(
                  'px-2 py-1 mb-0.5 rounded flex items-start gap-2',
                  log.level === 'error' ? 'bg-red-900/30' : 'hover:bg-gray-800'
                )}
              >
                <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                <span className={cn(
                  'px-1 rounded text-[10px] font-bold shrink-0 text-white',
                  CATEGORY_COLORS[log.category]
                )}>
                  {CATEGORY_LABELS[log.category]?.slice(0, 2)}
                </span>
                <span className={cn(
                  'px-1 rounded text-[10px] font-bold shrink-0',
                  LEVEL_COLORS[log.level]
                )}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-blue-400 shrink-0">[{log.module}]</span>
                <span className="text-gray-200 break-all">{log.message}</span>
                {log.data !== undefined && (
                  <span className="text-gray-500 break-all">
                    {JSON.stringify(log.data)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* 统计 */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <span className="text-gray-600">● 通用: {logs.filter(l => l.category === 'general').length}</span>
          <span className="text-orange-600">● 事件: {logs.filter(l => l.category === 'event').length}</span>
          <span className="text-cyan-600">● 定时: {logs.filter(l => l.category === 'schedule').length}</span>
          <span className="text-gray-300">|</span>
          <span className="text-green-600">● 信息: {logs.filter(l => l.level === 'info').length}</span>
          <span className="text-yellow-600">● 警告: {logs.filter(l => l.level === 'warn').length}</span>
          <span className="text-red-600">● 错误: {logs.filter(l => l.level === 'error').length}</span>
        </div>
      </div>
    </div>
  )
}
