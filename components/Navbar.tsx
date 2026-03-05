'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/participants', label: 'Participants' },
  { href: '/groups', label: 'Groups' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="bg-stone-950 border-b border-stone-800 sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
        <Link href="/" className="font-display italic text-gold-300 text-xl tracking-wide">
          Happy Hour Matcher
        </Link>

        <div className="flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[11px] uppercase tracking-widest font-medium transition-colors ${
                pathname === l.href
                  ? 'text-gold-300'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <a
          href="/skill.md"
          target="_blank"
          className="text-[10px] uppercase tracking-widest text-stone-600 hover:text-gold-400 transition-colors font-mono"
        >
          Skill.md
        </a>
      </div>
    </nav>
  )
}
