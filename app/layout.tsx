import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Node Editor - Agentic',
  description: 'Procedural image node editor in the browser',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
