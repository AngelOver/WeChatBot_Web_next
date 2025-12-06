/**
 * 联网搜索模块 - 检测是否需要搜索并获取在线信息
 */

import { sendChatMessage } from './api'

interface SearchParams {
  query: string
  apiKey: string
  apiBaseUrl: string
  model: string
}

interface DetectParams {
  message: string
  searchPrompt: string
  apiKey: string
  apiBaseUrl: string
  model: string
}

/**
 * 检测是否需要联网搜索
 * Args: message-用户消息, searchPrompt-检测提示词, apiKey/apiBaseUrl/model-API配置
 * Returns: boolean-是否需要搜索
 */
export async function detectSearchNeed(params: DetectParams): Promise<boolean> {
  const { message, searchPrompt, apiKey, apiBaseUrl, model } = params

  const prompt = `判断以下用户消息是否需要联网搜索才能回答。${searchPrompt}
只回答"是"或"否"。

用户消息: "${message}"`

  const response = await sendChatMessage({
    messages: [{ role: 'user', content: prompt }],
    model,
    maxTokens: 10,
    temperature: 0.1,
    apiKey,
    apiBaseUrl,
  })

  return response.content.includes('是')
}

/**
 * 执行联网搜索
 * 使用支持联网的模型（如 net-gpt-4o-mini）获取实时信息
 */
export async function performOnlineSearch(params: SearchParams): Promise<string> {
  const { query, apiKey, apiBaseUrl, model } = params

  const response = await sendChatMessage({
    messages: [
      {
        role: 'system',
        content: '你是一个联网搜索助手，请根据用户的问题搜索最新信息并简洁回答。',
      },
      { role: 'user', content: query },
    ],
    model,
    maxTokens: 1000,
    temperature: 0.7,
    apiKey,
    apiBaseUrl,
  })

  return response.content
}

/**
 * 处理带联网搜索的消息
 * 先检测是否需要搜索，如需要则先获取搜索结果，再构建带参考信息的提示
 */
export async function processWithSearch(params: {
  userMessage: string
  searchConfig: {
    apiKey: string
    apiBaseUrl: string
    model: string
    searchPrompt: string
  }
  mainConfig: {
    apiKey: string
    apiBaseUrl: string
    model: string
  }
}): Promise<{ needSearch: boolean; searchResult?: string }> {
  const { userMessage, searchConfig, mainConfig } = params

  // 检测是否需要搜索
  const needSearch = await detectSearchNeed({
    message: userMessage,
    searchPrompt: searchConfig.searchPrompt,
    apiKey: searchConfig.apiKey || mainConfig.apiKey,
    apiBaseUrl: searchConfig.apiBaseUrl || mainConfig.apiBaseUrl,
    model: mainConfig.model,
  })

  if (!needSearch) {
    return { needSearch: false }
  }

  // 执行搜索
  const searchResult = await performOnlineSearch({
    query: userMessage,
    apiKey: searchConfig.apiKey || mainConfig.apiKey,
    apiBaseUrl: searchConfig.apiBaseUrl || mainConfig.apiBaseUrl,
    model: searchConfig.model,
  })

  return { needSearch: true, searchResult }
}
