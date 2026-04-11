# SPEC-04: AI Receipt Parser - Setup Guide

## Prerequisites

The following environment variables must be set:

```
GEMINI_API_KEY           # Google Generative AI API key (get from https://ai.google.dev)
NEXT_PUBLIC_SUPABASE_URL # Already set
NEXT_PUBLIC_SUPABASE_ANON_KEY # Already set
```

## Supabase Storage Setup

1. **Create Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create a new bucket named `receipts`
   - Set it to **PRIVATE** (not public)
   - This ensures files are only accessible via authenticated requests

2. **Storage Bucket Policies**
   - Users can upload files to: `receipts/{user_id}/*` using their anon key
   - Server-side can delete files using the service role key
   - No public access is needed (signed URLs are used instead)

3. **Example SQL RLS policies:**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload receipts"
   ON storage.objects
   FOR INSERT
   WITH CHECK (
     bucket_id = 'receipts'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow users to delete their own files
   CREATE POLICY "Users can delete own receipts"
   ON storage.objects
   FOR DELETE
   USING (
     bucket_id = 'receipts'
     AND auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

## Files Created

- `/src/lib/gemini.ts` - Google Generative AI integration
- `/src/app/api/parse-receipt/route.ts` - API route for receipt parsing
- `/src/components/forms/AIUploadModal.tsx` - Upload modal component
- Updated `/src/components/forms/CutoffSection.tsx` - Added "Scan with AI" button
- Updated `/src/components/forms/budgetFormSchema.ts` - Made due_date optional

## How It Works

1. User clicks "Scan with AI" button in a cutoff section
2. File picker opens (accepts jpg, png, webp, heic, max 10MB)
3. User selects an image and clicks "Parse"
4. Image is uploaded to Supabase Storage (`receipts/{user_id}/{timestamp}`)
5. Signed URL is generated (expires in 1 hour)
6. Client calls `/api/parse-receipt` with the signed URL
7. Server fetches the image and sends to Gemini
8. Gemini extracts expense items and returns JSON
9. Client auto-fills the cutoff section rows
10. Client deletes the file from storage
11. User can edit/delete items before saving

## Error Handling

The feature handles:
- File too large (> 10MB)
- Unsupported file type
- Failed upload to storage
- Gemini API errors
- Failed image parsing
- Network errors

All errors are displayed inline in the modal.

## AI Item Identification

Parsed items are prefixed with "(AI)" in the name field so users can identify them:
- `Netflix (AI)` - automatically parsed
- Amount and due date are filled from the receipt

Users can:
- Edit the item name to remove "(AI)" prefix
- Edit amount or due date
- Delete rows they don't want
- Keep "(AI)" if they prefer
