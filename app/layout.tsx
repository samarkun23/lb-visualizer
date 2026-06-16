import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Load Balancing Algorithms — Interactive Visualizer',
  description: 'Visualize and interact with all 8 load balancing algorithms used in system design',
  openGraph: {
    title: 'Load Balancing Algorithms — Interactive Visualizer',
    description: 'Click, simulate, and understand Round Robin, Least Connections, IP Hash & more',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
