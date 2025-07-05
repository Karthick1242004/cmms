import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientLayout } from "@/components/client-layout"
import { NextAuthSessionProvider } from "@/components/session-provider"
import { AuthGuard } from "@/components/auth-guard"
import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CMMS Dashboard",
  description: "Computerized Maintenance Management System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <NextAuthSessionProvider >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <QueryProvider>
            <AuthGuard>
          <ClientLayout>{children}</ClientLayout>
            </AuthGuard>
          </QueryProvider>
            <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
