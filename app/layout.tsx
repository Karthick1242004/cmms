import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientLayout } from "@/components/client-layout"

import { AuthGuard } from "@/components/auth-guard"
import { QueryProvider } from "@/components/query-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FMMS Dashboard 360",
  description: "Computerized Maintenance Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false} 
          disableTransitionOnChange
          storageKey="cmms-theme"
        >
          <QueryProvider>
            <AuthGuard>
              <ClientLayout>{children}</ClientLayout>
            </AuthGuard>
          </QueryProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
