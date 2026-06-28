import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { PWAInstallButton } from "@/components/pwa-install-button";
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smarttutors.co.in"),
  title: {
    default: "SMART TUTORS – India’s No.1 Trusted Smart Learning Platform",
    template: "%s | Smart Tutors",
  },
  description:
    "Find the best personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams, Digital Courses, and Skill Development Programs. Learn with expert teachers through live classes, one-to-one mentoring, recorded lectures, study materials, mock tests, performance analytics, Library Support and complete career guidance — all in one platform. Whether you want better marks, skill development, career growth, or placement support — Smart Tutors helps students Learn, Grow, Earn & Get Placed for a brighter future.",
  keywords: [
    "Smart Tutors",
    "smart tutor","home schooling in navi mumbai","personal coaching","cet exam prepration","best coaching in mumbai",
    "smart tutors",
    "Smart Tutors Vashi",
    "coaching classes",
    "Best Coaching Institute Navi Mumbai",
    "CBSE ICSE SSC Coaching Vashi",
    "UPSC Foundation Mumbai",
    "classes near me",
    "JEE NEET Preparation Vashi",
    "Competitive Exam Coaching Mumbai",
    "Academic Mentoring Vashi",
    "Digital Learning Platform India","coaching","classes in navi mumbai"
  ],
  authors: [{ name: "Smart Tutors Academy" }],
  creator: "Smart Tutors Academy",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://smarttutors.co.in",
    siteName: "Smart Tutors",
    title: "SMART TUTORS – India’s No.1 Trusted Smart Learning Platform",
    description:
      "Find the best Personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams, Digital Courses, and Skill Development Programs. Learn with expert teachers through live classes, one-to-one mentoring, recorded lectures, study materials, mock tests, performance analytics, Library Support and complete career guidance — all in one platform. Whether you want better marks, skill development, career growth, or placement support — Smart Tutors helps students Learn, Grow, Earn & Get Placed for a brighter future.",
    images: [
      {
        url: "/image4.jpeg",
        width: 1200,
        height: 630,
        alt: "Smart Tutors Academy Campus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SMART TUTORS – India’s No.1 Trusted Smart Learning Platform",
    description: "Find the best Personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams, Digital Courses, and Skill Development Programs. Learn with expert teachers through live classes, one-to-one mentoring, recorded lectures, study materials, mock tests, performance analytics, Library Support and complete career guidance — all in one platform.",
    images: ["/image4.jpeg"],
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
    google: "verification_token", // PLACEHOLDER: Replace with actual token from Google Search Console
  },
  category: 'education',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
     { url: "/favicon-light.svg", type: "image/svg+xml" }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Smart Tutors',
    statusBarStyle: 'default',
    capable: true,
  },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    "name": "Smart Tutors Academy",
    "url": "https://smarttutors.co.in",
    "logo": "https://smarttutors.co.in/image4.jpeg",
    "description": "SMART TUTORS – India’s No.1 Trusted Smart Learning Platform. Find the best Personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams.",
"address": [
  {
    "@type": "PostalAddress",
    "streetAddress": "Sector 17, Vashi",
    "addressLocality": "Navi Mumbai",
    "addressRegion": "Maharashtra",
    "postalCode": "400703",
    "addressCountry": "IN"
  },
  {
    "@type": "PostalAddress",
    "streetAddress": "ADD PANVEL ADDRESS HERE",
    "addressLocality": "Panvel",
    "addressRegion": "Maharashtra",
    "addressCountry": "IN"
  }
],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8850447887",
      "contactType": "admissions",
      "email": "info@smarttutors.co.in"
    },
    "sameAs": [
      "https://www.instagram.com/smarttutors_academy/",
      "https://wa.me/918850447887"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Smart Tutors",
    "url": "https://smarttutors.co.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://smarttutors.co.in/courses?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Smart Tutors is India's No.1 trusted smart learning platform providing personal home tutors and online tutors for school boards (CBSE, ICSE, SSC), competitive exams (JEE, NEET, UPSC), and digital skill development."
        }
      },
      {
        "@type": "Question",
        "name": "Where is Smart Tutors located?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Smart Tutors has offline campus support in Vashi and Panvel, along with online digital programs."
        }
      },
      {
        "@type": "Question",
        "name": "What courses does Smart Tutors offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a wide range of programs including School Foundation (1st-10th), College Prep (11th-12th), JEE/NEET Coaching, UPSC Foundation, MPSC, Banking, SSC CGL, and Digital Future Skills."
        }
      }
    ]
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`light ${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}
      style={{ colorScheme: "light" }}
    >
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-9P82PKFSD9"
  strategy="lazyOnload"
/>

<Script id="google-analytics" strategy="lazyOnload">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-9P82PKFSD9');
  `}
</Script>
<ThemeProvider>
  <div className="relative z-10">
  <div className="no-report-chrome">
    <SiteHeader />
  </div>

  {children}

  <div className="no-report-chrome">
    <SiteFooter />
  </div>

  <div className="no-report-chrome">
  <FloatingWhatsApp />
  <PWAInstallButton />
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
