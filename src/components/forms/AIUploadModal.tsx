'use client'

import React, { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { HiArrowUpTray, HiOutlineXMark, HiSparkles, HiDocument, HiDocumentText } from 'react-icons/hi2'
import type { ParsedReceiptItemWithCutoff } from '@/types'

interface AIUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (items: ParsedReceiptItemWithCutoff[]) => void
  cutoffIndex: number
  cutoffCount: number
  title?: string
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown', 'text/x-markdown']
const PDF_TYPE = 'application/pdf'
const ACCEPTED_TYPES = [...IMAGE_TYPES, ...TEXT_TYPES, PDF_TYPE]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function getFileTypeLabel(type: string): string {
  if (IMAGE_TYPES.includes(type)) return 'Image'
  if (type === PDF_TYPE) return 'PDF'
  if (type === 'text/csv') return 'CSV'
  return 'Text file'
}

export function AIUploadModal({ isOpen, onClose, onSuccess, cutoffIndex, cutoffCount, title = 'Scan Receipt' }: AIUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('text/')) {
      setError('Please upload an image (JPG, PNG, WEBP, HEIC), a PDF, or a text file (CSV, MD, TXT).')
      return
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      setError('File must be under 10MB.')
      return
    }

    setSelectedFile(file)
    setPreview(null)

    // Only create preview for images
    if (IMAGE_TYPES.includes(file.type)) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleParse() {
    if (!selectedFile) {
      setError('Please select an image first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const timestamp = Date.now()
      const ext = selectedFile.name.split('.').pop() ?? 'bin'
      const fileName = `${timestamp}.${ext}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, selectedFile)

      if (uploadError) throw new Error(uploadError.message)

      // Get the signed URL (valid for 1 hour)
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(filePath, 3600)

      if (!data?.signedUrl) throw new Error('Failed to create signed URL')
      const storageUrl = data.signedUrl

      // Call parse API
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageUrl, cutoffCount }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to parse receipt')
      }

      const result = await response.json()
      
      // Clean up - delete the file after parsing
      await supabase.storage.from('receipts').remove([filePath])

      onSuccess(result.items)
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-header">{title}</h3>
          <button
            onClick={handleClose}
            type="button"
            className="p-1 text-muted hover:text-header transition-colors"
            disabled={loading}
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,.csv,.txt,.md,.markdown"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview */}
        {preview && (
          <div className="mb-4 rounded-md overflow-hidden bg-surface">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          </div>
        )}
        {selectedFile && !preview && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-md bg-surface border border-line">
            {selectedFile.type === PDF_TYPE
              ? <HiDocument size={24} className="text-due-danger shrink-0" />
              : <HiDocumentText size={24} className="text-accent shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-header truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted">{getFileTypeLabel(selectedFile.type)}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-due-danger bg-due-danger-bg rounded-md p-3 mb-4">
            {error}
          </p>
        )}

        {/* Help text */}
        {!selectedFile && (
          <div className="mb-4 flex flex-col gap-2">
            <p className="text-xs text-muted">
              Upload an image, PDF, CSV, or text file containing expense data. We'll extract the items and amounts.
            </p>
            {cutoffCount > 1 && (
              <p className="text-xs text-accent bg-accent-light rounded-md px-3 py-2">
                If your document has labeled sections (e.g. &quot;1st Cutoff&quot;, &quot;2nd Cutoff&quot;), items will be sent to the correct cutoffs automatically.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-1"
          >
            <HiArrowUpTray size={16} />
            Choose File
          </Button>
          <Button
            type="button"
            onClick={handleParse}
            disabled={!selectedFile || loading}
            loading={loading}
            className="flex-1 gap-1.5"
          >
            <HiSparkles size={14} />
            Parse
          </Button>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null)
              setPreview(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            disabled={loading}
            className="w-full mt-2 text-xs text-muted hover:text-body transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  )
}
