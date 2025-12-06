/**
 * 语音识别服务
 * 使用 OpenAI Whisper API 进行语音转文字
 */

interface TranscribeOptions {
  audioBase64: string
  apiKey: string
  apiBaseUrl: string
}

/**
 * 将语音转换为文字
 * @param options 包含音频 base64 和 API 配置
 * @returns 识别出的文字
 */
export async function transcribeAudio(options: TranscribeOptions): Promise<string> {
  const { audioBase64, apiKey, apiBaseUrl } = options
  
  if (!apiKey) {
    throw new Error('请先配置 API Key')
  }

  // 解析 base64
  const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '')
  const binaryData = atob(base64Data)
  const bytes = new Uint8Array(binaryData.length)
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i)
  }

  // 创建 FormData
  const blob = new Blob([bytes], { type: 'audio/webm' })
  const formData = new FormData()
  formData.append('file', blob, 'audio.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'zh')

  // 调用 Whisper API
  const baseUrl = apiBaseUrl || 'https://api.openai.com'
  const response = await fetch(`${baseUrl}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`语音识别失败: ${error}`)
  }

  const result = await response.json()
  return result.text || ''
}
