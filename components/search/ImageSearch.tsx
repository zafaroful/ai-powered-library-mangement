'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, ImagePlus, ScanBarcode, StopCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeIsbn } from '@/lib/utils/isbn'
import type { Book, ImageSearchMeta } from '@/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

interface ImageSearchProps {
  onResults: (results: Book[], meta: ImageSearchMeta) => void
  onSearchStart?: () => void
  onSearchEnd?: () => void
  onClear?: () => void
}

function isLikelyIsbn(text: string): boolean {
  const digits = text.replace(/[^0-9Xx]/g, '')
  return digits.length === 10 || digits.length === 13
}

async function decodeBarcodeFromFile(file: File): Promise<string | null> {
  const reader = new BrowserMultiFormatReader()
  const url = URL.createObjectURL(file)
  try {
    const result = await reader.decodeFromImageUrl(url)
    return result.getText()
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function ImageSearch({
  onResults,
  onSearchStart,
  onSearchEnd,
  onClear,
}: ImageSearchProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ImageSearchMeta['extracted']>()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop()
    scannerControlsRef.current = null
    readerRef.current = null
    setScanning(false)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl, stopCamera])

  const runIsbnSearch = useCallback(
    async (isbn: string) => {
      setStatus('Looking up ISBN...')
      setExtracted({ isbn: normalizeIsbn(isbn) })

      const res = await fetch(`/api/search?isbn=${encodeURIComponent(isbn)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'ISBN lookup failed')
      }

      onResults(data.results ?? [], {
        matchType: data.matchType,
        extracted: data.extracted,
        query: isbn,
      })
    },
    [onResults]
  )

  const runCoverSearch = useCallback(
    async (file: File) => {
      setStatus('Analyzing cover...')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/search/image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Image search failed')
      }

      setExtracted(data.extracted)
      onResults(data.results ?? [], {
        matchType: data.matchType,
        extracted: data.extracted,
      })
    },
    [onResults]
  )

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      setExtracted(undefined)
      onSearchStart?.()

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Use JPEG, PNG, or WebP images.')
        onSearchEnd?.()
        return
      }

      if (file.size > MAX_SIZE) {
        setError('Image must be under 5MB.')
        onSearchEnd?.()
        return
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))

      try {
        setStatus('Scanning barcode...')
        const barcode = await decodeBarcodeFromFile(file)

        if (barcode && isLikelyIsbn(barcode)) {
          await runIsbnSearch(barcode)
          return
        }

        await runCoverSearch(file)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
        onResults([], {})
      } finally {
        setStatus(null)
        onSearchEnd?.()
      }
    },
    [onResults, onSearchEnd, onSearchStart, previewUrl, runCoverSearch, runIsbnSearch]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const startCamera = async () => {
    setError(null)
    onClear?.()
    setExtracted(undefined)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available in this browser.')
      return
    }

    try {
      stopCamera()
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      setScanning(true)
      setStatus('Point camera at barcode...')

      await reader.decodeFromVideoDevice(undefined, videoRef.current!, async (result, err) => {
        if (result) {
          const text = result.getText()
          if (isLikelyIsbn(text)) {
            stopCamera()
            onSearchStart?.()
            try {
              await runIsbnSearch(text)
            } catch (scanErr) {
              setError(scanErr instanceof Error ? scanErr.message : 'ISBN lookup failed')
              onResults([], {})
            } finally {
              setStatus(null)
              onSearchEnd?.()
            }
          }
        }
        if (err && err.name !== 'NotFoundException') {
          // ignore continuous scan misses
        }
      }).then((controls) => {
        scannerControlsRef.current = controls
      })
    } catch {
      setError('Could not access camera. Check permissions or use upload instead.')
      stopCamera()
      setStatus(null)
    }
  }

  const handleClear = () => {
    setError(null)
    setExtracted(undefined)
    setStatus(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    stopCamera()
    onClear?.()
    onResults([], {})
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          capture="environment"
          aria-label="Upload book cover or barcode photo"
          className="sr-only"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="mx-auto mb-3 max-h-40 rounded-md object-contain"
          />
        ) : (
          <ImagePlus className="mx-auto mb-2 size-8 text-muted-foreground" />
        )}

        <p className="text-sm text-muted-foreground">
          Upload or drop a book cover or barcode photo
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />
            Choose image
          </Button>
          {!scanning ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void startCamera()}>
              <Camera className="size-4" />
              Scan barcode
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={stopCamera}>
              <StopCircle className="size-4" />
              Stop camera
            </Button>
          )}
          {(previewUrl || extracted) && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {scanning && (
        <div className="overflow-hidden rounded-lg border bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
      )}

      {status && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ScanBarcode className="size-3.5 animate-pulse" />
          {status}
        </p>
      )}

      {extracted && (extracted.title || extracted.author || extracted.isbn) && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <p className="font-medium">Detected</p>
          {extracted.title && <p>Title: {extracted.title}</p>}
          {extracted.author && <p>Author: {extracted.author}</p>}
          {extracted.isbn && <p>ISBN: {extracted.isbn}</p>}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
