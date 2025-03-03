import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Hedge Fund | Real-time Financial Intelligence",
  description: "AI-powered hedge fund intelligence for retail investors. Get real-time insights on institutional trades, market shifts, and investment opportunities.",
  keywords: "hedge fund, ai trading, stock updates, financial intelligence, market insights",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
} 