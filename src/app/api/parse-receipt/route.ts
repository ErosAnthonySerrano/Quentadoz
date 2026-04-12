import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseReceiptFile } from '@/lib/gemini'
import { z } from 'zod'

const RequestSchema = z.object({
  storageUrl: z.string().url(),
  cutoffCount: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    let storageUrl: string
    let cutoffCount: number

    try {
      const validated = RequestSchema.parse(body)
      storageUrl = validated.storageUrl
      cutoffCount = validated.cutoffCount
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid request: missing or invalid storageUrl or cutoffCount' },
        { status: 400 }
      )
    }

    // Parse the file using Gemini
    let items
    try {
      items = await parseReceiptFile(storageUrl, cutoffCount)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Gemini parsing error:', message)

      // Check if it's a JSON parse error or other parsing issue
      if (message.includes('JSON') || message.includes('parse')) {
        return NextResponse.json(
          { error: 'We couldn\'t read budget information from this image. Please try a clearer photo.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Parsing failed. Please try again or enter items manually.' },
        { status: 500 }
      )
    }

    // Return parsed items
    return NextResponse.json({ items }, { status: 200 })
  } catch (err) {
    console.error('POST /api/parse-receipt error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Check your connection and try again.' },
      { status: 500 }
    )
  }
}
