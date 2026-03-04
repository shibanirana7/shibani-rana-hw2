'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/participants', label: 'Participants' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/groups', label: 'Groups' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">
        <Link href="/" className="text-lg font-bold text-amber-400 flex items-center gap-2">
          🍻 Happy Hour Matcher
        </Link>
        <div className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-amber-500 text-slate-900'
                  : 'text-slate-300 hover:text-amber-400 hover:bg-slate-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <a
          href="/skill.md"
          target="_blank"
          className="text-xs text-slate-500 hover:text-amber-400 font-mono"
        >
          SKILL.md →
        </a>
      </div>
    </nav>
  )
}
