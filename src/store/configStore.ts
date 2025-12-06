import { create } from 'zustand'
import type { 
  GptConfig, ApiConfig, UserInfo, 
  AutoMessageConfig, QuietTimeConfig, 
  VisionConfig, OnlineSearchConfig, EmojiConfig, LockScreenConfig 
} from '@/types'
import type { AppConfig } from '@/types/appData'
import { 
  defaultGptConfig, defaultApiConfig, defaultUserInfo,
  defaultAutoMessageConfig, defaultQuietTimeConfig,
  defaultVisionConfig, defaultOnlineSearchConfig, defaultEmojiConfig, defaultLockScreenConfig
} from '@/lib/defaults'

interface ConfigState {
  gptConfig: GptConfig
  apiConfig: ApiConfig
  userInfo: UserInfo
  autoMessageConfig: AutoMessageConfig
  quietTimeConfig: QuietTimeConfig
  visionConfig: VisionConfig
  onlineSearchConfig: OnlineSearchConfig
  emojiConfig: EmojiConfig
  lockScreenConfig: LockScreenConfig
  phoneMode: boolean
  
  setGptConfig: (config: Partial<GptConfig>) => void
  setApiConfig: (config: Partial<ApiConfig>) => void
  setUserInfo: (info: Partial<UserInfo>) => void
  setAutoMessageConfig: (config: Partial<AutoMessageConfig>) => void
  setQuietTimeConfig: (config: Partial<QuietTimeConfig>) => void
  setVisionConfig: (config: Partial<VisionConfig>) => void
  setOnlineSearchConfig: (config: Partial<OnlineSearchConfig>) => void
  setEmojiConfig: (config: Partial<EmojiConfig>) => void
  setLockScreenConfig: (config: Partial<LockScreenConfig>) => void
  setPhoneMode: (enabled: boolean) => void
  resetGptConfig: () => void
  
  // 数据同步
  setConfig: (config: AppConfig) => void
}

export const useConfigStore = create<ConfigState>()((set) => ({
  gptConfig: defaultGptConfig,
  apiConfig: defaultApiConfig,
  userInfo: defaultUserInfo,
  autoMessageConfig: defaultAutoMessageConfig,
  quietTimeConfig: defaultQuietTimeConfig,
  visionConfig: defaultVisionConfig,
  onlineSearchConfig: defaultOnlineSearchConfig,
  emojiConfig: defaultEmojiConfig,
  lockScreenConfig: defaultLockScreenConfig,
  phoneMode: false,

  setGptConfig: (config) => set((state) => ({ gptConfig: { ...state.gptConfig, ...config } })),
  setApiConfig: (config) => set((state) => ({ apiConfig: { ...state.apiConfig, ...config } })),
  setUserInfo: (info) => set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
  setAutoMessageConfig: (config) => set((state) => ({ autoMessageConfig: { ...state.autoMessageConfig, ...config } })),
  setQuietTimeConfig: (config) => set((state) => ({ quietTimeConfig: { ...state.quietTimeConfig, ...config } })),
  setVisionConfig: (config) => set((state) => ({ visionConfig: { ...state.visionConfig, ...config } })),
  setOnlineSearchConfig: (config) => set((state) => ({ onlineSearchConfig: { ...state.onlineSearchConfig, ...config } })),
  setEmojiConfig: (config) => set((state) => ({ emojiConfig: { ...state.emojiConfig, ...config } })),
  setLockScreenConfig: (config) => set((state) => ({ lockScreenConfig: { ...state.lockScreenConfig, ...config } })),
  setPhoneMode: (enabled) => set({ phoneMode: enabled }),
  resetGptConfig: () => set({ gptConfig: defaultGptConfig }),

  // 数据同步
  setConfig: (config) => set({
    apiConfig: config.api,
    gptConfig: config.gpt,
    userInfo: config.user,
    autoMessageConfig: config.autoMessage,
    quietTimeConfig: config.quietTime,
    visionConfig: config.vision,
    onlineSearchConfig: config.onlineSearch,
    emojiConfig: config.emoji,
    phoneMode: config.phoneMode,
  }),
}))
