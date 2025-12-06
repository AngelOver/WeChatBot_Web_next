/**
 * 图片识别模块 - 调用视觉模型识别图片内容
 */

interface VisionParams {
  imageBase64: string
  apiKey: string
  apiBaseUrl: string
  model: string
  prompt?: string
}

/**
 * 构建视觉 API URL
 */
function buildVisionUrl(apiBaseUrl: string): string {
  let baseUrl = apiBaseUrl || 'https://api.openai.com/v1'
  baseUrl = baseUrl.replace(/\/$/, '')
  if (!baseUrl.endsWith('/v1')) {
    baseUrl = `${baseUrl}/v1`
  }
  return `${baseUrl}/chat/completions`
}

/**
 * 识别图片内容
 * Args: imageBase64-图片base64, apiKey/apiBaseUrl/model-API配置, prompt-提示词
 * Returns: string-识别结果
 */
export async function recognizeImage(params: VisionParams): Promise<string> {
  const { imageBase64, apiKey, apiBaseUrl, model, prompt = '请描述这张图片的内容' } = params

  if (!apiKey) throw new Error('请先配置视觉 API Key')
  if (!imageBase64) throw new Error('图片数据为空')

  const url = buildVisionUrl(apiBaseUrl)

  // 确保 base64 格式正确
  const imageData = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `图片识别请求失败: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || '无法识别图片内容'
}

/**
 * 将文件转换为 base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片（防止 base64 过大）
 */
export function compressImage(base64: string, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = base64
  })
}
