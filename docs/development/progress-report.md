# WeChatBot Web 开发进度报告

> 更新时间：2025-11-28

## 一、项目概述

基于 Next.js 14 + React 18 + TypeScript 构建的微信聊天模拟器 Web 版，复刻旧版 Python 项目的核心功能。

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| 状态管理 | Zustand (persist) |
| 图标 | Lucide React |
| 构建 | TypeScript 5.5 |

---

## 二、功能完成情况

### ✅ 已完成

#### 1. 核心聊天功能
- [x] 消息发送/接收
- [x] 流式响应 (SSE)
- [x] 多会话管理
- [x] 消息撤回
- [x] 拍一拍功能
- [x] Markdown 渲染

#### 2. 记忆系统（复刻旧项目）
- [x] **核心记忆 (CoreMemory)**
  - JSON 格式存储
  - 自动评分淘汰（公式：`0.6 × 重要度 - 0.4 × 时间(h)`）
  - 最大 50 条限制
  - 分类：user_info / event / preference / other
  
- [x] **临时记忆 (TempMemory)**
  - 对话日志记录
  - 最大 30 条
  - 按会话隔离

- [x] **记忆整理**
  - AI 总结对话生成摘要
  - 自动评估重要度 1-5
  - 自动分类

#### 3. 表情系统（复刻旧项目）
- [x] **表情收藏**
  - 按情绪分类（开心/悲伤/生气/爱心/惊讶/思考/打招呼/其他）
  - 图片 base64 存储
  - 批量导入

- [x] **AI 情绪检测**
  - 分析消息情绪
  - 匹配对应分类表情
  - 概率控制发送

#### 4. 导入功能
- [x] config.py 解析（API 配置）
- [x] .md 人设文件导入
- [x] 表情图片批量导入
- [x] 标签页切换 UI

#### 5. UI 微信风格适配
- [x] 字体：苹方 / 微软雅黑 / 思源黑体
- [x] 消息气泡：17px 字体，6px 圆角
- [x] 头像：42px 方形，4px 圆角
- [x] 颜色：绿色气泡 #95EC69，白色气泡
- [x] 响应式：640px 断点，手机端标题居中
- [x] 禁止缩放：viewport 配置

#### 6. 主题系统
- [x] 多主题切换（微信/暗黑/清新等）
- [x] CSS 变量动态应用
- [x] 主题持久化

---

### 🔄 进行中

#### 设置弹窗扩展
- [ ] 记忆管理界面（查看/删除核心记忆）
- [ ] 表情管理界面（查看/删除/重新分类）

---

### 📋 待开发

#### 高级功能
- [ ] 图片识别（Moonshot API）
- [ ] 提醒功能
- [ ] 主动消息触发
- [ ] 安静时间配置
- [ ] 联网搜索

---

## 三、文件结构

```
src/
├── app/
│   ├── globals.css          # 全局样式 + CSS 变量
│   ├── layout.tsx           # 根布局 + viewport
│   └── page.tsx             # 主页面
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatHeader.tsx   # 响应式头部
│   │   ├── MessageBubble.tsx # 消息气泡
│   │   └── InputArea.tsx
│   ├── layout/
│   │   └── Sidebar.tsx      # 响应式侧边栏
│   ├── settings/
│   │   ├── SettingsModal.tsx
│   │   └── ImportModal.tsx  # 配置+表情导入
│   └── providers/
│       └── ThemeProvider.tsx
├── store/
│   ├── chatStore.ts         # 会话状态
│   ├── configStore.ts       # 配置状态
│   ├── memoryStore.ts       # 记忆状态（核心+临时）
│   ├── emojiStore.ts        # 表情收藏
│   ├── personaStore.ts      # 人设状态
│   └── themeStore.ts        # 主题状态
├── lib/
│   ├── api.ts               # API 调用
│   ├── memory.ts            # 记忆整理服务
│   └── emoji.ts             # 表情情绪检测
├── types/
│   └── index.ts             # 类型定义
└── themes/
    └── index.ts             # 主题配置
```

---

## 四、Store 设计

### memoryStore

```typescript
interface MemoryState {
  coreMemories: CoreMemory[]           // 核心记忆
  tempMemories: Record<number, TempMemory>  // 临时记忆
  
  addCoreMemory()      // 添加核心记忆
  cleanupCoreMemories() // 淘汰低分记忆
  addTempLog()         // 添加对话日志
  clearTempLogs()      // 清空临时记忆
}
```

### emojiStore

```typescript
interface EmojiState {
  emojis: EmojiItem[]
  
  addEmoji()           // 添加表情
  getEmojisByCategory() // 按分类获取
  getRandomEmoji()     // 随机获取
  importEmojis()       // 批量导入
}
```

---

## 五、下一步计划

1. 完善设置弹窗的记忆/表情管理界面
2. 集成图片识别功能
3. 添加数据导出功能（ZIP 打包）
4. 优化移动端体验
