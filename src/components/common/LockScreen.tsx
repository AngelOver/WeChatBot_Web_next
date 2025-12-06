'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronUp } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'

interface LockScreenProps {
  onUnlock: () => void
}

// 伪随机函数（固定种子）
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// 星星组件
function Stars() {
  const stars = useMemo(() => 
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: seededRandom(i * 1) * 100,
      y: seededRandom(i * 2) * 100,
      size: seededRandom(i * 3) * 2.5 + 0.5,
      duration: seededRandom(i * 4) * 3 + 2,
      delay: seededRandom(i * 5) * 3,
      twinkle: seededRandom(i * 6) > 0.7,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animation: star.twinkle 
              ? `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`
              : `glow ${star.duration}s ease-in-out infinite ${star.delay}s`,
            boxShadow: star.size > 2 ? '0 0 4px rgba(255,255,255,0.5)' : 'none',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// 流光效果
function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <div 
        className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 50%, rgba(255, 119, 198, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 20%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
          `,
          animation: 'aurora 15s ease-in-out infinite',
        }}
      />
      <style jsx>{`
        @keyframes aurora {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(5%, 5%) rotate(5deg); }
          50% { transform: translate(-5%, 10%) rotate(-5deg); }
          75% { transform: translate(10%, -5%) rotate(3deg); }
        }
      `}</style>
    </div>
  )
}

// 浮动粒子
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: seededRandom(i * 10 + 100) * 100,
      size: seededRandom(i * 10 + 101) * 4 + 2,
      duration: seededRandom(i * 10 + 102) * 10 + 10,
      delay: seededRandom(i * 10 + 103) * 5,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-10%',
            width: p.size,
            height: p.size,
            background: `rgba(255, 255, 255, ${0.1 + seededRandom(p.id + 200) * 0.2})`,
            animation: `float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// 流星效果
function ShootingStars() {
  const stars = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: i * 3 + seededRandom(i + 300) * 2,
      duration: 1 + seededRandom(i + 301) * 0.5,
      top: seededRandom(i + 302) * 50,
      left: seededRandom(i + 303) * 50 + 25,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: '100px',
            height: '2px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8), transparent)',
            transform: 'rotate(-45deg)',
            animation: `shoot ${s.duration}s ease-out infinite`,
            animationDelay: `${s.delay}s`,
            opacity: 0,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes shoot {
          0% { transform: rotate(-45deg) translateX(0); opacity: 0; }
          5% { opacity: 1; }
          100% { transform: rotate(-45deg) translateX(-300px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// 光晕脉冲
function GlowPulse() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div 
        className="w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(120,119,198,0.5) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-96 h-96 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(255,119,198,0.3) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite 1s',
        }}
      />
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.3); opacity: 0.1; }
        }
      `}</style>
    </div>
  )
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { personas, activePersonaId } = usePersonaStore()
  const [time, setTime] = useState(new Date())
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 获取当前人设最后一个时间段的消息（5分钟内算一段）
  const TIME_GAP_MINUTES = 5
  const MAX_DISPLAY = 3
  
  const { displayMessages, unreadCount, personaName } = useMemo(() => {
    const activePersona = personas.find(p => p.id === activePersonaId)
    if (!activePersona) {
      return { displayMessages: [], unreadCount: 0, personaName: '小美' }
    }
    
    const aiMessages = activePersona.messages?.filter(
      m => !m.inversion && !m.isTickle && !m.isMemoryDivider && m.text
    ) || []
    
    if (aiMessages.length === 0) {
      return { displayMessages: [], unreadCount: 0, personaName: activePersona.name }
    }
    
    // 从最后一条消息开始，找同一时间段的消息
    const lastMsgTime = new Date(aiMessages[aiMessages.length - 1].dateTime || Date.now()).getTime()
    const sameSegmentMessages: typeof aiMessages = []
    
    for (let i = aiMessages.length - 1; i >= 0; i--) {
      const msgTime = new Date(aiMessages[i].dateTime || Date.now()).getTime()
      // 如果时间差超过5分钟，停止
      if (lastMsgTime - msgTime > TIME_GAP_MINUTES * 60 * 1000) break
      sameSegmentMessages.unshift(aiMessages[i])
    }
    
    // 显示最多3条，计算未读数
    const displayMsgs = sameSegmentMessages.slice(-MAX_DISPLAY)
    const unread = sameSegmentMessages.length - displayMsgs.length
    
    return {
      displayMessages: displayMsgs.map(m => ({
        text: m.text,
        time: m.dateTime?.split(' ')[1]?.slice(0, 5) || '现在',
      })),
      unreadCount: unread,
      personaName: activePersona.name,
    }
  }, [personas, activePersonaId])

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 格式化时间
  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const dateStr = `${time.getMonth() + 1}月${time.getDate()}日 ${weekdays[time.getDay()]}`

  // 触摸/鼠标事件处理
  const handleStart = (clientY: number) => {
    setIsDragging(true)
    startYRef.current = clientY
  }

  const handleMove = (clientY: number) => {
    if (!isDragging) return
    const diff = startYRef.current - clientY
    setDragY(Math.max(0, Math.min(diff, 300)))
  }

  const handleEnd = () => {
    setIsDragging(false)
    if (dragY > 150) {
      // 解锁成功
      onUnlock()
    } else {
      // 回弹
      setDragY(0)
    }
  }

  // 触摸事件
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  // 鼠标事件
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY)
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY)
  const onMouseUp = () => handleEnd()
  const onMouseLeave = () => isDragging && handleEnd()

  // 计算透明度和位移
  const opacity = 1 - dragY / 300
  const translateY = -dragY

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] select-none cursor-grab active:cursor-grabbing"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        transform: `translateY(${translateY}px)`,
        opacity: opacity,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* 动态背景特效 */}
      <Stars />
      <Aurora />
      <FloatingParticles />
      <ShootingStars />
      <GlowPulse />
      
      {/* 状态栏 */}
      <div className="relative z-10 flex justify-between items-center px-6 py-3 text-white/80 text-sm">
        <span>{hours}:{minutes}</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-120px)] text-white">
        {/* 时间 - 带发光效果 */}
        <div 
          className="text-8xl font-extralight tracking-tight mb-2"
          style={{
            textShadow: '0 0 30px rgba(255,255,255,0.3), 0 0 60px rgba(120,119,198,0.2)',
          }}
        >
          {hours}:{minutes}
        </div>
        
        {/* 日期 */}
        <div className="text-xl font-light opacity-80">
          {dateStr}
        </div>

        {/* 通知预览 - 显示当前人设的消息 */}
        <div className="mt-8 w-[85%] max-w-sm space-y-2">
          {/* 未读提示 */}
          {unreadCount > 0 && (
            <div className="text-center text-xs text-white/50 mb-2">
              还有 {unreadCount} 条未读消息
            </div>
          )}
          
          {displayMessages.length > 0 ? (
            displayMessages.map((msg, index) => (
              <div 
                key={index} 
                className="animate-[slideIn_0.5s_ease-out]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-xl hover:bg-white/15 transition-all cursor-pointer" onClick={onUnlock}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#07c160] flex items-center justify-center text-white text-base shadow-lg shadow-green-500/30">
                      💬
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium opacity-80">微信</div>
                      <div className="text-sm truncate">
                        {personaName}: {msg.text.slice(0, 25)}{msg.text.length > 25 ? '...' : ''}
                      </div>
                    </div>
                    <div className="text-xs opacity-50 flex-shrink-0">
                      {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="animate-[slideIn_0.5s_ease-out]">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#07c160] flex items-center justify-center text-white text-base shadow-lg shadow-green-500/30">
                    💬
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium opacity-80">微信</div>
                    <div className="text-sm">{personaName}: 在干嘛呀～</div>
                  </div>
                  <div className="text-xs opacity-50">现在</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 底部滑动提示 */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 flex flex-col items-center text-white/60">
        <ChevronUp 
          className="w-8 h-8 animate-bounce" 
          style={{ 
            opacity: 1 - dragY / 100,
            transform: `translateY(${-dragY * 0.2}px)` 
          }} 
        />
        <span className="text-sm mt-1">向上滑动解锁</span>
        
        {/* 滑动进度条 */}
        <div className="w-32 h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full transition-all"
            style={{ width: `${(dragY / 150) * 100}%` }}
          />
        </div>
      </div>

      {/* Home 指示条 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  )
}
