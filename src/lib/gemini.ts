import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ParsedReceiptItemWithCutoff } from '@/types'
import { z } from 'zod'

const ParsedItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive('amount must be positive'),
  due_date: z.string().nullable(),
  cutoff_number: z.number().int().positive().nullable(),
})

const ParsedItemsSchema = z.array(ParsedItemSchema)

const TEXT_MIME_TYPES = ['text/plain', 'text/csv', 'text/markdown', 'text/x-markdown']
const PDF_MIME_TYPE = 'application/pdf'

function buildPrompt(): string {
  return `You are an expert at extracting expense items from any kind of document. The document may be:
- A store or restaurant receipt (POS receipt, printed or digital)
- A budget planning document organized into cutoff/salary sections
- A list of bills or expenses
- Any other document containing items with prices or amounts

Your task: extract every expense item and return a JSON array.

For each item, extract:
1. name — the item or expense name. For store receipts, use the product name as printed (clean it up slightly if it's truncated or abbreviated, e.g. "NESTLE MILO 1KG" is fine). Skip non-item lines like store name, address, cashier name, tax summary labels, subtotal/total/change lines, receipt number, date/time header, "THANK YOU" etc.
2. amount — the item's price or cost as a number. For receipts, use the line-item price (the amount next to that specific item, not the total). If no currency is shown, assume Philippine Peso.
3. due_date — due date if visible (YYYY-MM-DD), otherwise null. For store receipts this is almost always null.
4. cutoff_number — a positive integer if the item appears under a labeled cutoff/salary-period section, or null if no such label is present. For plain store receipts with no section headers, always set null.

How to detect cutoff sections: look for ANY heading or label indicating a numbered salary period. The word "cutoff" may appear as "cutoff", "cut off", "cut-off", "cuttoff", "cutof", or any obvious misspelling. Match case-insensitively.

Recognized cutoff label patterns:
- Word-form ordinals: "First Cutoff", "Second Cutoff", "Third Cutoff" — and "cut off" / "cut-off" / misspelled variants
- Abbreviated ordinals: "1st Cutoff", "2nd Cutoff", "3rd Cutoff" — and variants
- Reversed numbered: "Cutoff 1", "Cut Off 2", "Cut-off 3"
- Salary/period labels: "Salary 1", "Salary Period 1", "Period 1", "Pay Period 1"
- Standalone ordinals as section headings: "1st", "2nd", "First", "Second", etc.
- Any label clearly marking a numbered salary period boundary

Ordinal-to-number mapping:
"First"/"1st" → 1, "Second"/"2nd" → 2, "Third"/"3rd" → 3, "Fourth"/"4th" → 4,
"Fifth"/"5th" → 5, "Sixth"/"6th" → 6, "Seventh"/"7th" → 7, "Eighth"/"8th" → 8

Receipt parsing tips:
- Each line usually has: item name (left) and price (right). Extract both.
- Qty × unit price formats: e.g. "2 x 50.00" — the item amount is the line total (100.00), not the unit price.
- Items may be in ALL CAPS — normalize to title case, e.g. "TIDE POWDER" → "Tide Powder"
- Discount or void lines (negative amounts) — skip them.
- Lines like "VAT", "TOTAL", "SUBTOTAL", "CASH", "CHANGE", "AMOUNT DUE", "SERVICE CHARGE" — skip them.
- If the receipt has a store name header line, skip it.

IMPORTANT:
- Assign cutoff_number based purely on a detected section label — do NOT assign one if no label is found
- Return ONLY a JSON array with no additional text, markdown, or code fences
- Each item must have name, amount, due_date, and cutoff_number fields
- amount must be a positive number (not a string)
- cutoff_number must be a positive integer or null

Example — store receipt (no cutoff labels):
[{"name":"Tide Powder 1kg","amount":149.75,"due_date":null,"cutoff_number":null},{"name":"Nestle Milo 300g","amount":89.00,"due_date":null,"cutoff_number":null}]

Example — budget document with cutoff sections:
[{"name":"Netflix","amount":400,"due_date":null,"cutoff_number":1},{"name":"Grocery","amount":5990,"due_date":null,"cutoff_number":1},{"name":"YT Premium","amount":300,"due_date":null,"cutoff_number":2}]

If there are no expense items, return an empty array: []`
}

export async function parseReceiptFile(fileUrl: string, cutoffCount: number): Promise<ParsedReceiptItemWithCutoff[]> {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = client.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })

  const prompt = buildPrompt()

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
      `${prompt}\n\nNow analyze this text content:\n\n${text}`,
    ])
  } else if (isPdf || mimeType.startsWith('image/')) {
    // For PDFs and images, use inlineData with base64
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      prompt,
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
