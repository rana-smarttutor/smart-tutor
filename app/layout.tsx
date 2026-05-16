import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import SmartTutorAIChatbot from "@/components/SmartTutorAIChatbot";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Smart Tutor",
  description:
    "Professional institute platform for Smart Tutor with role-based dashboards, local APIs, and a polished learning experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="relative min-h-screen isolate">
            <div className="relative z-10">
              <SiteHeader />
              {children}
              <SiteFooter />
              <FloatingWhatsApp />
              <SmartTutorAIChatbot />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
