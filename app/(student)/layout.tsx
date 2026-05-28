import { StudentNavbar } from '@/components/layout/StudentNavbar'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <StudentNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
    </div>
  )
}
