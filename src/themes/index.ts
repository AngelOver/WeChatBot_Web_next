/** 主题配置类型 */
export interface ThemeConfig {
  name: string
  displayName: string
  description: string  // 风格描述
  icon: string         // 图标 emoji
  colors: {
    // 主色调
    primary: string
    primaryHover: string
    // 背景色
    sidebarBg: string
    headerBg: string
    chatBg: string
    // 消息气泡
    bubbleUser: string
    bubbleAi: string
    bubbleUserText: string
    bubbleAiText: string
    // 文字颜色
    textPrimary: string
    textSecondary: string
    textMuted: string
    // 边框和分割线
    border: string
    divider: string
    // 头像背景
    avatarUser: string
    avatarAi: string
    // 输入框
    inputBg: string
    inputBorder: string
    // 发送按钮
    sendButton: string
    sendButtonText: string
  }
  // 圆角配置
  radius: {
    avatar: string
    bubble: string
    button: string
    card: string
    input: string
  }
  // 布局样式
  layout: {
    sidebarWidth: string        // 侧边栏宽度
    headerHeight: string        // 头部高度
    inputAreaPadding: string    // 输入区域内边距
    messagePadding: string      // 消息间距
  }
  // 其他样式
  style: {
    bubbleArrow: boolean           // 是否显示气泡小三角
    avatarShape: 'circle' | 'rounded'  // 头像形状
    avatarSize: string             // 头像大小
    bubbleShadow: string           // 气泡阴影
    headerShadow: string           // 头部阴影
    sidebarShadow: string          // 侧边栏阴影
    cardShadow: string             // 卡片阴影
    listItemHover: string          // 列表项 hover 背景
    darkMode: boolean              // 是否深色模式
  }
}

/** 微信主题 */
export const wechatTheme: ThemeConfig = {
  name: 'wechat',
  displayName: '微信',
  description: '经典微信聊天风格',
  icon: '💬',
  colors: {
    primary: '#07c160',
    primaryHover: '#06ad56',
    sidebarBg: '#e9e9e9',      // 微信实际是浅灰
    headerBg: '#f5f5f5',
    chatBg: '#f5f5f5',         // 聊天背景浅灰
    bubbleUser: '#95ec69',     // 微信绿
    bubbleAi: '#ffffff',
    bubbleUserText: '#000000',
    bubbleAiText: '#000000',
    textPrimary: '#191919',
    textSecondary: '#666666',
    textMuted: '#b2b2b2',
    border: '#d6d6d6',
    divider: '#d6d6d6',
    avatarUser: '#07c160',
    avatarAi: '#07c160',
    inputBg: '#ffffff',
    inputBorder: '#e5e5e5',
    sendButton: '#07c160',
    sendButtonText: '#ffffff',
  },
  radius: {
    avatar: '4px',             // 微信头像是小圆角方形
    bubble: '4px',             // 微信气泡圆角很小
    button: '4px',
    card: '4px',
    input: '4px',
  },
  layout: {
    sidebarWidth: '250px',
    headerHeight: '56px',
    inputAreaPadding: '10px',
    messagePadding: '8px',
  },
  style: {
    bubbleArrow: true,  // 微信气泡有小箭头
    avatarShape: 'rounded',
    avatarSize: '40px',
    bubbleShadow: 'none',
    headerShadow: 'none',
    sidebarShadow: 'none',
    cardShadow: 'none',
    listItemHover: 'rgba(0,0,0,0.05)',
    darkMode: false,
  },
}

/** QQ主题 */
export const qqTheme: ThemeConfig = {
  name: 'qq',
  displayName: 'QQ',
  description: '清新QQ聊天风格',
  icon: '🐧',
  colors: {
    primary: '#12b7f5',
    primaryHover: '#0ea5e9',
    sidebarBg: '#f5f6f7',
    headerBg: '#ffffff',
    chatBg: '#f5f6f7',
    bubbleUser: '#12b7f5',
    bubbleAi: '#ffffff',
    bubbleUserText: '#ffffff',
    bubbleAiText: '#333333',
    textPrimary: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#e8e8e8',
    divider: '#eeeeee',
    avatarUser: '#12b7f5',
    avatarAi: '#ff9500',
    inputBg: '#ffffff',
    inputBorder: '#e8e8e8',
    sendButton: '#12b7f5',
    sendButtonText: '#ffffff',
  },
  radius: {
    avatar: '50%',
    bubble: '18px',
    button: '20px',
    card: '12px',
    input: '20px',
  },
  layout: {
    sidebarWidth: '260px',
    headerHeight: '52px',
    inputAreaPadding: '10px',
    messagePadding: '10px',
  },
  style: {
    bubbleArrow: false,
    avatarShape: 'circle',
    avatarSize: '42px',
    bubbleShadow: '0 2px 8px rgba(0,0,0,0.08)',
    headerShadow: '0 1px 4px rgba(0,0,0,0.05)',
    sidebarShadow: '2px 0 8px rgba(0,0,0,0.06)',
    cardShadow: '0 2px 12px rgba(0,0,0,0.08)',
    listItemHover: 'rgba(18,183,245,0.1)',
    darkMode: false,
  },
}

/** iOS iMessage 主题 */
export const iosTheme: ThemeConfig = {
  name: 'ios',
  displayName: 'iOS',
  description: 'Apple iMessage 风格',
  icon: '🍎',
  colors: {
    primary: '#007aff',
    primaryHover: '#0066cc',
    sidebarBg: '#f2f2f7',
    headerBg: '#ffffff',
    chatBg: '#ffffff',
    bubbleUser: '#007aff',
    bubbleAi: '#e9e9eb',
    bubbleUserText: '#ffffff',
    bubbleAiText: '#000000',
    textPrimary: '#000000',
    textSecondary: '#8e8e93',
    textMuted: '#c7c7cc',
    border: '#c6c6c8',
    divider: '#c6c6c8',
    avatarUser: '#007aff',
    avatarAi: '#34c759',
    inputBg: '#f2f2f7',
    inputBorder: '#c6c6c8',
    sendButton: '#007aff',
    sendButtonText: '#ffffff',
  },
  radius: {
    avatar: '50%',
    bubble: '18px',
    button: '8px',
    card: '10px',
    input: '18px',
  },
  layout: {
    sidebarWidth: '320px',
    headerHeight: '44px',
    inputAreaPadding: '8px',
    messagePadding: '6px',
  },
  style: {
    bubbleArrow: false,
    avatarShape: 'circle',
    avatarSize: '36px',
    bubbleShadow: 'none',
    headerShadow: '0 0.5px 0 rgba(0,0,0,0.3)',
    sidebarShadow: 'none',
    cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
    listItemHover: 'rgba(0,122,255,0.1)',
    darkMode: false,
  },
}

/** Discord 主题 */
export const discordTheme: ThemeConfig = {
  name: 'discord',
  displayName: 'Discord',
  description: '暗黑Discord风格',
  icon: '🎮',
  colors: {
    primary: '#5865f2',
    primaryHover: '#4752c4',
    sidebarBg: '#2b2d31',
    headerBg: '#313338',
    chatBg: '#313338',
    bubbleUser: '#5865f2',
    bubbleAi: '#383a40',
    bubbleUserText: '#ffffff',
    bubbleAiText: '#dbdee1',
    textPrimary: '#f2f3f5',
    textSecondary: '#b5bac1',
    textMuted: '#949ba4',
    border: '#3f4147',
    divider: '#3f4147',
    avatarUser: '#5865f2',
    avatarAi: '#57f287',
    inputBg: '#383a40',
    inputBorder: '#1e1f22',
    sendButton: '#5865f2',
    sendButtonText: '#ffffff',
  },
  radius: {
    avatar: '50%',
    bubble: '4px',
    button: '4px',
    card: '8px',
    input: '8px',
  },
  layout: {
    sidebarWidth: '240px',
    headerHeight: '48px',
    inputAreaPadding: '16px',
    messagePadding: '4px',
  },
  style: {
    bubbleArrow: false,
    avatarShape: 'circle',
    avatarSize: '40px',
    bubbleShadow: 'none',
    headerShadow: '0 1px 0 rgba(0,0,0,0.2)',
    sidebarShadow: 'none',
    cardShadow: 'none',
    listItemHover: 'rgba(88,101,242,0.15)',
    darkMode: true,
  },
}

/** Telegram 主题 */
export const telegramTheme: ThemeConfig = {
  name: 'telegram',
  displayName: 'Telegram',
  description: '简洁Telegram风格',
  icon: '✈️',
  colors: {
    primary: '#2AABEE',
    primaryHover: '#229ED9',
    sidebarBg: '#ffffff',
    headerBg: '#517da2',
    chatBg: '#e6ebee',
    bubbleUser: '#effdde',
    bubbleAi: '#ffffff',
    bubbleUserText: '#000000',
    bubbleAiText: '#000000',
    textPrimary: '#000000',
    textSecondary: '#708499',
    textMuted: '#a0adb8',
    border: '#dadce0',
    divider: '#e6e6e6',
    avatarUser: '#2AABEE',
    avatarAi: '#ff5722',
    inputBg: '#ffffff',
    inputBorder: '#dadce0',
    sendButton: '#2AABEE',
    sendButtonText: '#ffffff',
  },
  radius: {
    avatar: '50%',
    bubble: '12px',
    button: '50%',
    card: '8px',
    input: '20px',
  },
  layout: {
    sidebarWidth: '260px',
    headerHeight: '56px',
    inputAreaPadding: '8px',
    messagePadding: '4px',
  },
  style: {
    bubbleArrow: true,
    avatarShape: 'circle',
    avatarSize: '42px',
    bubbleShadow: '0 1px 2px rgba(0,0,0,0.08)',
    headerShadow: 'none',
    sidebarShadow: 'none',
    cardShadow: '0 1px 4px rgba(0,0,0,0.08)',
    listItemHover: 'rgba(42,171,238,0.1)',
    darkMode: false,
  },
}

/** 所有主题列表 */
export const themes: Record<string, ThemeConfig> = {
  wechat: wechatTheme,
  qq: qqTheme,
  ios: iosTheme,
  telegram: telegramTheme,
  discord: discordTheme,
}

/** 主题顺序 */
export const themeOrder = ['wechat', 'qq', 'ios', 'telegram', 'discord']

/** 获取主题 */
export const getTheme = (name: string): ThemeConfig => themes[name] || wechatTheme
