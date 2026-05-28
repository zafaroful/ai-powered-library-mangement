'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  Home,
  BookMarked,
  ArrowLeftRight,
  CalendarClock,
  CircleDollarSign,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/student', label: 'Home', icon: Home },
  { href: '/student/books', label: 'Browse Books', icon: BookMarked },
  { href: '/student/borrow', label: 'My Loans', icon: ArrowLeftRight },
  { href: '/student/reservations', label: 'Reservations', icon: CalendarClock },
  { href: '/student/fines', label: 'Fines', icon: CircleDollarSign },
  { href: '/student/settings', label: 'Settings', icon: Settings },
]

export function StudentNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/student" className="flex items-center gap-2 font-semibold">
          <BookOpen className="size-5 text-primary" />
          <span>Library</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/student' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="size-4" />
          <span className="sr-only md:not-sr-only md:ml-1">Sign out</span>
        </Button>
      </div>
    </header>
  )
}
