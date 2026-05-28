'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Upload, FileText } from 'lucide-react'
import type { Book, ReadingLevel } from '@/types'
import { BOOK_CATEGORIES } from '@/lib/constants/categories'

interface BookFormProps {
  book?: Book
  mode?: 'create' | 'edit'
}

export function BookForm({ book, mode = 'create' }: BookFormProps) {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [isbn, setIsbn] = useState(book?.isbn ?? '')
  const [description, setDescription] = useState(book?.description ?? '')
  const [coverPreview, setCoverPreview] = useState(book?.cover_url ?? '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState(book?.pdf_path ? 'PDF uploaded' : '')
  const [category, setCategory] = useState(book?.category ?? '')
  const [tags, setTags] = useState(book?.tags?.join(', ') ?? '')
  const [readingLevel, setReadingLevel] = useState<ReadingLevel | ''>(book?.reading_level ?? '')
  const [pageCount, setPageCount] = useState(book?.page_count?.toString() ?? '')
  const [totalCopies, setTotalCopies] = useState(book?.total_copies?.toString() ?? '1')
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [categorizing, setCategorizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    setPdfName(file.name)
  }

  async function handleAutoCategorize() {
    if (!title || !description) return
    setCategorizing(true)
    try {
      const res = await fetch('/api/books/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.category) setCategory(data.category)
        if (data.tags) setTags(data.tags.join(', '))
        if (data.reading_level) setReadingLevel(data.reading_level)
      }
    } finally {
      setCategorizing(false)
    }
  }

  async function uploadFiles(bookId: string) {
    if (coverFile) {
      setUploadStatus('Uploading cover...')
      const fd = new FormData()
      fd.append('bookId', bookId)
      fd.append('file', coverFile)
      const res = await fetch('/api/books/upload-cover', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Cover upload failed')
      }
    }

    if (pdfFile) {
      setUploadStatus('Uploading and indexing PDF (may take a minute)...')
      const fd = new FormData()
      fd.append('bookId', bookId)
      fd.append('file', pdfFile)
      const res = await fetch('/api/books/upload-pdf', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'PDF upload failed')
      }
    }
    setUploadStatus(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      title,
      author,
      isbn: isbn || null,
      description: description || null,
      cover_url: coverPreview && !coverFile ? coverPreview : null,
      category: category || null,
      tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : [],
      reading_level: readingLevel || null,
      page_count: pageCount ? parseInt(pageCount) : null,
      total_copies: parseInt(totalCopies) || 1,
    }

    const url = mode === 'edit' ? `/api/books/${book?.id}` : '/api/books'
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to save book')
      setLoading(false)
      return
    }

    const { book: savedBook } = await res.json()
    const bookId = savedBook?.id ?? book?.id

    if (bookId && (coverFile || pdfFile)) {
      try {
        await uploadFiles(bookId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'File upload failed')
        setLoading(false)
        return
      }
    }

    router.push('/admin/books')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'edit' ? 'Edit Book' : 'Add New Book'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {uploadStatus && (
            <Alert>
              <AlertDescription>{uploadStatus}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN</Label>
            <Input id="isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cover image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => coverInputRef.current?.click()}
              >
                <Upload className="size-4" />
                {coverFile ? coverFile.name : 'Choose cover image'}
              </Button>
              {coverPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="mt-2 h-32 w-24 rounded-md object-cover border"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Book PDF</Label>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => pdfInputRef.current?.click()}
              >
                <FileText className="size-4" />
                {pdfName || 'Choose PDF file'}
              </Button>
              <p className="text-xs text-muted-foreground">
                PDF is indexed for the student AI chatbot (max 50MB).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoCategorize}
                disabled={categorizing || !title || !description}
              >
                <Sparkles className="size-3" />
                {categorizing ? 'Categorizing...' : 'Auto-categorize'}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              onBlur={() => {
                if (mode === 'create' && title && description && !category) {
                  handleAutoCategorize()
                }
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reading Level</Label>
              <Select value={readingLevel} onValueChange={(v) => setReadingLevel(v as ReadingLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageCount">Page Count</Label>
              <Input id="pageCount" type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, programming, python" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalCopies">Total Copies</Label>
            <Input id="totalCopies" type="number" min="1" value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (uploadStatus ?? 'Saving...') : mode === 'edit' ? 'Update Book' : 'Add Book'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
