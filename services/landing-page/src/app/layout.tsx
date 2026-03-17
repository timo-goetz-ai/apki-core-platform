import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Automation + KI — Souveräne KI-Infrastruktur',
  description: 'Vollständige KI-Infrastruktur auf eigener Hardware. Datensouverän, automatisiert, skalierbar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
