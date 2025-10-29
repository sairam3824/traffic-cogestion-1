import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeProvider } from "@/components/theme-provider"
import AuthNav from "@/components/auth-nav"
import MainNav from "@/components/main-nav"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Traffic Congestion Prediction System",
  description: "Real-time traffic analysis powered by LSTM, GNN, and CNN-GRU models",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <a href="/traffic-prediction" className="text-foreground font-bold text-lg hover:text-primary transition-colors">
                  Traffic Prediction
                </a>
                <MainNav />
              </div>
              <div className="flex items-center gap-4">
                <AuthNav />
                <ThemeToggle />
              </div>
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
