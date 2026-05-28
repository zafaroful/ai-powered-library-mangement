'use client'

import { BookChat } from '@/components/books/BookChat'
import { BookRecitation } from '@/components/books/BookRecitation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BookSidebarTabsProps {
  bookSlug: string
  bookTitle: string
  pdfProcessed: boolean
  description?: string | null
}

export function BookSidebarTabs({
  bookSlug,
  bookTitle,
  pdfProcessed,
  description,
}: BookSidebarTabsProps) {
  return (
    <Card className="flex h-[min(520px,70vh)] flex-col">
      <Tabs defaultValue="ask-ai" className="flex min-h-0 flex-1 flex-col">
        <CardHeader className="pb-3">
          <TabsList className="w-full">
            <TabsTrigger value="ask-ai" className="flex-1">
              Ask AI
            </TabsTrigger>
            <TabsTrigger value="recitation" className="flex-1">
              Recitation
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
          <TabsContent
            value="ask-ai"
            className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <BookChat
              bookSlug={bookSlug}
              bookTitle={bookTitle}
              pdfProcessed={pdfProcessed}
              embedded
            />
          </TabsContent>

          <TabsContent
            value="recitation"
            className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <BookRecitation
              bookSlug={bookSlug}
              bookTitle={bookTitle}
              description={description}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
