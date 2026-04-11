# SPEC-09: AI Multi-Cutoff Routing
## Quentadoz — Feature Specification

---

## Overview

This spec upgrades the existing AI Receipt Parser (SPEC-04) to be **cutoff-aware**. When a user uploads a document that contains labeled cutoff sections (e.g. "1st Cutoff", "2nd Cutoff"), the AI will detect those labels, tag each extracted item with a `cutoff_number`, and automatically route the items to the correct cutoff sections in the Budget Form — instead of dumping everything into the cutoff that triggered the upload.

This is a non-breaking enhancement. Documents without cutoff labels continue to work exactly as they did before — all items fall back to the source cutoff.

---

## Trigger

User experience is unchanged: the user clicks "Scan with AI" on any cutoff section, selects a file, and clicks "Parse". The multi-cutoff routing happens transparently in the background.

---

## What Changes vs. SPEC-04

| Area | SPEC-04 (current) | SPEC-09 (new) |
|---|---|---|
| Gemini prompt | Extract flat list of items | Extract items grouped by detected cutoff label |
| Response schema | `{ name, amount, due_date }` | `{ name, amount, due_date, cutoff_number: number \| null }` |
| API request body | `{ storageUrl }` | `{ storageUrl, cutoffCount }` |
| API response | `{ items: ParsedReceiptItem[] }` | `{ items: ParsedReceiptItemWithCutoff[] }` |
| Client routing | All items → source cutoff | Items routed by `cutoff_number`; `null` → source cutoff |

---

## Updated API Route: POST /api/parse-receipt

### Request Body

```ts
{
  storageUrl: string   // Supabase Storage URL of the uploaded file
  cutoffCount: number  // Total number of cutoffs in this budget (e.g. 2)
}
```

- `cutoffCount` is passed so the model knows the valid range of cutoff numbers (1 to N)
- Both fields are required. Validate with Zod.

### Updated Gemini Prompt

The prompt must now instruct Gemini to:

1. Scan the document for cutoff section headers or labels
2. Recognize headers in any common format, including but not limited to:
   - "1st Cutoff", "2nd Cutoff", "3rd Cutoff"
   - "Cutoff 1", "Cutoff 2"
   - "1st", "2nd", "3rd" (as standalone section labels)
   - "Period 1", "Period 2"
   - "Salary 1", "Salary 2"
3. Tag each extracted item with the cutoff number it appears under
4. If no cutoff label is detected for an item, set `cutoff_number` to `null`
5. If detected cutoff number exceeds `cutoffCount`, set `cutoff_number` to `null`

The prompt must still return **only** a JSON array with no extra text, markdown, or code fences. The new item shape is:

```json
[
  { "name": "Netflix", "amount": 400, "due_date": null, "cutoff_number": 1 },
  { "name": "Grocery", "amount": 5990, "due_date": null, "cutoff_number": 1 },
  { "name": "YT Premium", "amount": 300, "due_date": null, "cutoff_number": 2 },
  { "name": "Spay", "amount": 1500, "due_date": null, "cutoff_number": 2 }
]
```

### Updated Response

- `200`: `{ items: ParsedReceiptItemWithCutoff[] }`
- `400`: `{ error: "..." }` — unchanged from SPEC-04
- `500`: `{ error: "..." }` — unchanged from SPEC-04

---

## Updated Types

```ts
// types/index.ts

// Existing type (keep for backward compatibility)
export interface ParsedReceiptItem {
  name: string
  amount: number
  due_date: string | null
}

// New extended type
export interface ParsedReceiptItemWithCutoff extends ParsedReceiptItem {
  cutoff_number: number | null
}
```

---

## Updated Zod Schema (lib/gemini.ts)

```ts
const ParsedItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  due_date: z.string().nullable(),
  cutoff_number: z.number().int().positive().nullable(),
})
```

---

## Client Behavior After Parsing

### Routing Logic

After the API returns the item array, the client groups items by `cutoff_number`:

1. **Item has a valid `cutoff_number` (1 to N):**
   - Route the item to that cutoff section
   - If that cutoff section exists in the form, append the item there (same as SPEC-04 append behavior: keep existing user-entered rows, append AI items below)

2. **Item has `cutoff_number: null`:**
   - Route the item to the **source cutoff** (the cutoff the user clicked "Scan with AI" from)

3. **Item has a `cutoff_number` that exceeds the budget's `cutoffCount`:**
   - Treat as `null` — route to source cutoff
   - (This is also enforced server-side in the API route)

### Visual Feedback

- Items inserted into a cutoff section retain the "AI" badge, same as SPEC-04
- No additional UI is needed to indicate cross-cutoff routing — the user sees items appear in the correct sections naturally
- If items were routed to cutoffs other than the source, show a single informational toast:

  > *"Items were distributed across [N] cutoffs based on the document."*

  This toast is only shown when at least one item was routed to a cutoff different from the source. It is not an error — just a helpful notice.

---

## Fallback Behavior

| Situation | Behavior |
|---|---|
| Document has no cutoff labels | All items get `cutoff_number: null` → all go to source cutoff (same as SPEC-04) |
| Document partially labeled (some sections labeled, some not) | Labeled items route to their cutoff; unlabeled items go to source cutoff |
| Detected cutoff number > `cutoffCount` | Item treated as `null` → source cutoff |
| AI returns malformed or missing `cutoff_number` | Zod coerces to `null` → source cutoff |
| Budget only has 1 cutoff | `cutoff_number` is irrelevant — everything goes to cutoff 1 regardless |

---

## Files to Change

| File | Change |
|---|---|
| `src/lib/gemini.ts` | Update `ParsedItemSchema`, update `BASE_PROMPT`, update function signature to accept `cutoffCount` |
| `src/types/index.ts` | Add `ParsedReceiptItemWithCutoff` interface |
| `src/app/api/parse-receipt/route.ts` | Accept `cutoffCount` in request body, pass to `parseReceiptFile()` |
| `src/components/forms/AIUploadModal.tsx` | Pass `cutoffCount` to API request; return items to parent with `cutoff_number` included |
| `src/components/forms/CutoffSection.tsx` | No change needed — SPEC-04 append behavior already handles new items |
| `src/components/forms/BudgetForm.tsx` | Handle routing logic in the AI parse callback: group items by `cutoff_number` and insert into the correct cutoff's field array; show distribution toast if applicable |

---

## Error States (additions to SPEC-04)

| Scenario | Message |
|---|---|
| `cutoffCount` missing or invalid in request | Invalid request: cutoffCount is required. |
| All other errors | Unchanged from SPEC-04 |

---

## Out of Scope for This Spec

- AI detection of salary amounts per cutoff (still entered manually)
- AI detection of cutoff dates
- Uploading a single file to cover all cutoffs from a top-level button (not per-cutoff) — this may be a future spec
- Renaming or restructuring the `AIUploadModal` component beyond what is needed for this feature
