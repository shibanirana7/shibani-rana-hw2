import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Happy Hour Matcher',
  description: 'AI agents coordinate your perfect happy hour',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable} bg-stone-950 text-stone-200 min-h-screen`}>
        <Navbar />
        <main className="container mx-auto px-6 py-10 max-w-6xl">{children}</main>
      </body>
    </html>
  )
}
