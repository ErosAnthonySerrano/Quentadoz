import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ParsedReceiptItem } from '@/types'
import { z } from 'zod'

const ParsedItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive('amount must be positive'),
  due_date: z.string().nullable(),
})

const ParsedItemsSchema = z.array(ParsedItemSchema)

const TEXT_MIME_TYPES = ['text/plain', 'text/csv', 'text/markdown', 'text/x-markdown']
const PDF_MIME_TYPE = 'application/pdf'

const BASE_PROMPT = `You are an expert receipt and budget analyzer. Analyze this content and extract all expense items.

For each item, extract:
1. name (item name/description)
2. amount (numeric amount, if no currency is shown assume Philippine Peso)
3. due_date (due date if visible, otherwise null, in YYYY-MM-DD format)

Important:
- If a field cannot be determined, set it to null
- Do NOT guess or assume values
- Return ONLY a JSON array with no additional text, markdown, or code fences
- Each item must have name, amount, and due_date fields
- amount must be a number (not a string)

Example valid response:
[{"name":"Netflix","amount":599,"due_date":null},{"name":"Water Bill","amount":1200,"due_date":"2025-04-15"}]

If there are no expense items, return an empty array: []`

export async function parseReceiptFile(fileUrl: string): Promise<ParsedReceiptItem[]> {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = client.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error('Failed to fetch file from storage')
  }

  const mimeType = (response.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim()
  const isText = TEXT_MIME_TYPES.includes(mimeType) || mimeType.startsWith('text/')
  const isPdf = mimeType === PDF_MIME_TYPE

  let result

  if (isText) {
    // For text files, read content and append directly to prompt
    const text = await response.text()
    result = await model.generateContent([
      `${BASE_PROMPT}\n\nNow analyze this text content:\n\n${text}`,
    ])
  } else if (isPdf || mimeType.startsWith('image/')) {
    // For PDFs and images, use inlineData with base64
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      BASE_PROMPT,
    ])
  } else {
    throw new Error('Unsupported file type')
  }

  const text = result.response.text()

  // Strip markdown code fences if present
  let jsonText = text.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const parsed = JSON.parse(jsonText)
  const validated = ParsedItemsSchema.parse(parsed)

  return validated
}
