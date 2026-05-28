import { BookForm } from '@/components/books/BookForm'

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Add New Book</h1>
      <BookForm mode="create" />
    </div>
  )
}
