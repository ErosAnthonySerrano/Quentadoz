# SPEC-04: AI Receipt Parser
## Quentadoz — Feature Specification

---

## Overview

The AI Receipt Parser is a feature inside the Budget Form that allows users to upload a photo of a receipt, a handwritten budget note, or any image containing expense information. The image is sent to the Google Gemini Flash API, which extracts structured data and auto-fills the cutoff's budget item rows.

---

## Placement

- The AI upload button appears inside each cutoff section header in the Budget Form
- Each cutoff section has its own independent upload button
- The button is labeled with a camera/upload icon and the text "Scan with AI"

---

## Upload Flow

1. User clicks "Scan with AI" button in a cutoff section
2. A file picker opens — accepts image files (jpg, png, webp, heic) up to 10MB
3. A small preview thumbnail of the selected image is shown
4. User clicks "Parse" to confirm
5. Image is uploaded to Supabase Storage under `receipts/{user_id}/{timestamp}`
6. Client calls the Next.js API route `POST /api/parse-receipt`
7. API route retrieves the image, sends it to Gemini API with a structured prompt
8. Gemini returns a JSON array of extracted items
9. API route returns the parsed items to the client
10. Client auto-fills the cutoff section rows with the extracted data
11. User reviews the filled rows, makes edits if needed, then saves normally

---

## API Route: POST /api/parse-receipt

### Request

- Method: `POST`
- Body: `{ storageUrl: string }` — the Supabase Storage URL of the uploaded image
- Requires valid session (check Authorization header or cookie)

### Gemini Prompt

The prompt sent to Gemini should instruct it to analyze the image and return **only** a JSON array in this exact format, with no additional text:

```json
[{ "name": "string", "amount": number, "due_date": "YYYY-MM-DD or null" }]
```

> **Note:** If a field is not readable from the image, set it to `null`. Do not guess values.

### Response

- `200`: `{ items: [{ name, amount, due_date }] }`
- `400`: `{ error: "Image is not readable or does not contain budget information" }`
- `500`: `{ error: "Parsing failed. Please try again." }`

---

## Client Behavior After Parsing

- Existing empty rows in the cutoff section are replaced by the parsed items
- Existing rows with user-entered data are kept — parsed items are appended below
- Each parsed row is visually tagged with a small "AI" badge so the user knows it was auto-filled
- User can edit any auto-filled field before saving
- User can delete any auto-filled row

---

## Error States

| Scenario | Message |
|---|---|
| File too large (> 10MB) | Image must be under 10MB. |
| Unsupported file type | Please upload a JPG, PNG, WEBP, or HEIC image. |
| Image not readable / not budget-related | We couldn't read budget information from this image. Please try a clearer photo. |
| Gemini API error | Parsing failed. Please try again or enter items manually. |
| Network error | Something went wrong. Check your connection and try again. |

---

## Supabase Storage Rules

- Bucket name: `receipts`
- File path: `receipts/{user_id}/{timestamp}-{original_filename}`
- Bucket is private — only accessible via server-side Supabase service role key
- Files are not required to be kept long-term — consider a cleanup policy for files older than 30 days

> **Note:** The image is only used for parsing. It is not displayed anywhere in the UI after parsing is complete.

---

## Gemini API Integration

- Use Google Generative AI SDK: `@google/generative-ai`
- Model: `gemini-1.5-flash` (best free option for vision)
- Always call from a Next.js server-side API route — never expose `GEMINI_API_KEY` to the client
- Parse the response text as JSON — strip any markdown code fences before `JSON.parse()`
- Validate the returned shape with Zod before sending to client
