import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

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
  title: {
    default: "Smart Tutor | Academic Empowerment in Vashi",
    template: "%s | Smart Tutor",
  },
  description:
    "Smart Tutor is Vashi's leading educational institute for school boards, civil services foundation, and competitive exams. Beyond coaching—total student empowerment.",
  keywords: [
    "Smart Tutor",
    "Vashi Coaching",
    "Navi Mumbai Institute",
    "Class 10 Board Prep",
    "UPSC Foundation Mumbai",
    "JEE NEET Preparation Vashi",
    "Academic Mentoring",
  ],
  authors: [{ name: "Smart Tutor Academy" }],
  creator: "Smart Tutor Academy",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://smarttutor.in",
    siteName: "Smart Tutor",
    title: "Smart Tutor | Professional Academic Mentoring in Vashi",
    description:
      "Disciplined preparation, expert mentoring, and visible academic growth for school, college, and competitive exams.",
    images: [
      {
        url: "/image1.png",
        width: 1200,
        height: 630,
        alt: "Smart Tutor Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Tutor | Leading Institute in Navi Mumbai",
    description: "Empowering students through disciplined learning and expert faculty support.",
    images: ["/image1.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <Analytics />
      </body>
    </html>
  );
}
