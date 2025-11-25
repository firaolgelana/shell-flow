import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './styles/globals.css'

import { AuthProvider } from '@/features/auth/presentation/AuthProvider'
import { ThemeProvider } from '@/shared/components/theme-provider'
import { FloatingThemeToggle } from '@/features/settings/presentation/components/FloatingThemeToggle'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ShellFlow',
  description: 'ShellFlow Platform',
  // generator: 'shell.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <FloatingThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  )
}
