import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import SmartTutorsAIChatbot from "@/components/SmartTutorsAIChatbot";
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
  metadataBase: new URL("https://smarttutors.co.in"),
  title: {
    default: "Smart Tutors | Leading Educational Institute in Vashi, Navi Mumbai",
    template: "%s | Smart Tutors",
  },
  description:
    "Smart Tutors is Navi Mumbai's premier coaching institute for school boards (CBSE/ICSE/SSC), UPSC foundation, JEE, NEET, and competitive exams. Expert mentoring and disciplined preparation in Vashi.",
  keywords: [
    "Smart Tutors",
    "Smart Tutors Vashi",
    "Best Coaching Institute Navi Mumbai",
    "CBSE ICSE SSC Coaching Vashi",
    "UPSC Foundation Mumbai",
    "JEE NEET Preparation Vashi",
    "Competitive Exam Coaching Mumbai",
    "Academic Mentoring Vashi",
    "Digital Learning Platform India",
  ],
  authors: [{ name: "Smart Tutors Academy" }],
  creator: "Smart Tutors Academy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://smarttutors.co.in",
    siteName: "Smart Tutors",
    title: "Smart Tutors | Professional Academic Mentoring & Coaching in Vashi",
    description:
      "Transform your academic journey with Smart Tutors. Expert faculty, AI-powered analytics, and personalized mentoring for school and competitive exams.",
    images: [
      {
        url: "/image1.png",
        width: 1200,
        height: 630,
        alt: "Smart Tutors Academy Campus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Tutors | Top-Rated Coaching Institute in Navi Mumbai",
    description: "Empowering students through disciplined learning, expert faculty, and modern digital tools.",
    images: ["/image1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "verification_token", // Placeholder
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Smart Tutors Academy",
    "url": "https://smarttutors.co.in",
    "logo": "https://smarttutors.co.in/image1.png",
    "description": "Leading coaching institute in Vashi, Navi Mumbai for CBSE, ICSE, SSC, UPSC, and competitive exams.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Vashi",
      "addressRegion": "Navi Mumbai",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8850447887",
      "contactType": "admissions",
      "email": "admissions@smarttutors.co.in"
    }
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className="relative min-h-screen isolate">
            <div className="relative z-10">
              <SiteHeader />
              {children}
              <SiteFooter />
              <FloatingWhatsApp />
              <SmartTutorsAIChatbot />
            </div>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
