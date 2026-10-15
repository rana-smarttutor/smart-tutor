import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

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
import { ConditionalLayout } from "@/components/conditional-layout";
import { PageLoader } from "@/components/page-loader";
import { AuthAccessExperience } from "@/components/auth-access-experience";

import "./globals.css";

/* =====================================================
   FONT CONFIGURATION
===================================================== */

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

/* =====================================================
   SITE CONSTANTS
===================================================== */

const SITE_URL = "https://smartiqinstitute.in";

const SITE_NAME = "SmartIQ Institute";

const SITE_DESCRIPTION =
  "SmartIQ Institute provides personal tutoring, online learning, school and board exam preparation, competitive and government exam coaching, digital skill development, mock tests, mentorship, and career guidance.";

const SITE_LOGO = `${SITE_URL}/Smart-institue-logo.jpeg`;

const GA_MEASUREMENT_ID = "G-9P82PKFSD9";

/* =====================================================
   SEO METADATA
===================================================== */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "SmartIQ Institute | Smart Learning & Career Development",
    template: "%s | SmartIQ Institute",
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "SmartIQ Institute",
    "SmartIQ Institute Vashi",
    "SmartIQ Institute Navi Mumbai",
    "SmartIQ Institute Panvel",
    "Home Tutors Navi Mumbai",
    "Personal Coaching",
    "Online Tuition",
    "Online Tutors",
    "School Coaching",
    "CBSE Coaching",
    "ICSE Coaching",
    "SSC Board Coaching",
    "Class 6 to 12 Coaching",
    "JEE Preparation",
    "NEET Preparation",
    "MHT CET Preparation",
    "Competitive Exam Coaching",
    "Government Exam Preparation",
    "UPSC Preparation",
    "MPSC Preparation",
    "Banking Exam Preparation",
    "SSC CGL Preparation",
    "Career Counselling",
    "Academic Mentoring",
    "Mock Tests",
    "Digital Learning",
    "Skill Development",
    "Artificial Intelligence Courses",
    "Coding Classes",
    "Coaching Institute Navi Mumbai",
  ],

  authors: [
    {
      name: "SmartIQ Institute",
    },
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  category: "education",

  referrer: "origin-when-cross-origin",

  alternates: {
    canonical: SITE_URL,
  },

  /* ===================================================
     OPEN GRAPH
  =================================================== */

  openGraph: {
    type: "website",

    locale: "en_IN",

    url: SITE_URL,

    siteName: SITE_NAME,

    title: "SmartIQ Institute | Smart Learning & Career Development",

    description: SITE_DESCRIPTION,

    images: [
      {
        url: "/Smart-institue-logo.jpeg",
        width: 1200,
        height: 630,
        alt: "SmartIQ Institute",
      },
    ],
  },

  /* ===================================================
     TWITTER / X
  =================================================== */

  twitter: {
    card: "summary_large_image",

    title: "SmartIQ Institute | Smart Learning & Career Development",

    description: SITE_DESCRIPTION,

    images: ["/Smart-institue-logo.jpeg"],
  },

  /* ===================================================
     SEARCH ENGINE ROBOTS
  =================================================== */

  robots: {
    index: true,

    follow: true,

    googleBot: {
      index: true,

      follow: true,

      "max-video-preview": -1,

      "max-image-preview": "large",

      "max-snippet": -1,
    },
  },

  /* ===================================================
     PWA / APP CONFIGURATION
  =================================================== */

  manifest: "/site.webmanifest",

  appleWebApp: {
    title: SITE_NAME,

    statusBarStyle: "default",

    capable: true,
  },

  formatDetection: {
    telephone: true,

    date: true,

    address: true,

    email: true,

    url: true,
  },

  other: {
    "apple-mobile-web-app-title": SITE_NAME,

    "mobile-web-app-capable": "yes",

    "og:country-name": "India",

    "og:region": "Maharashtra",
  },
};

/* =====================================================
   VIEWPORT CONFIGURATION
===================================================== */

export const viewport: Viewport = {
  themeColor: "#2563eb",

  width: "device-width",

  initialScale: 1,

  maximumScale: 5,
};

/* =====================================================
   SAFE JSON-LD SERIALIZATION
===================================================== */

function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* =====================================================
   EDUCATIONAL ORGANIZATION SCHEMA
===================================================== */

const organizationJsonLd = {
  "@context": "https://schema.org",

  "@type": "EducationalOrganization",

  "@id": `${SITE_URL}/#organization`,

  name: SITE_NAME,

  alternateName: ["SmartIQ Institute Academy", "SmartIQ"],

  url: SITE_URL,

  logo: {
    "@type": "ImageObject",

    "@id": `${SITE_URL}/#logo`,

    url: SITE_LOGO,

    contentUrl: SITE_LOGO,
  },

  image: SITE_LOGO,

  description: SITE_DESCRIPTION,

  address: {
    "@type": "PostalAddress",

    streetAddress: "Sector 17, Vashi",

    addressLocality: "Navi Mumbai",

    addressRegion: "Maharashtra",

    postalCode: "400703",

    addressCountry: "IN",
  },

  contactPoint: {
    "@type": "ContactPoint",

    telephone: "+91-8850447887",

    email: "info@smartiqinstitute.in",

    contactType: "admissions",

    availableLanguage: ["English", "Hindi", "Marathi"],
  },

  sameAs: ["https://www.instagram.com/smarttutors_academy/"],

  areaServed: {
    "@type": "Country",

    name: "India",
  },

  knowsAbout: [
    "School Education",
    "Personal Tutoring",
    "Online Education",
    "CBSE Preparation",
    "ICSE Preparation",
    "SSC Board Preparation",
    "JEE Preparation",
    "NEET Preparation",
    "MHT CET Preparation",
    "UPSC Preparation",
    "Government Exams",
    "Competitive Exams",
    "Academic Mentoring",
    "Career Counselling",
    "Digital Skills",
    "Artificial Intelligence",
    "Skill Development",
    "Mock Tests",
  ],
};

/* =====================================================
   WEBSITE SCHEMA
===================================================== */

const websiteJsonLd = {
  "@context": "https://schema.org",

  "@type": "WebSite",

  "@id": `${SITE_URL}/#website`,

  name: SITE_NAME,

  url: SITE_URL,

  description: SITE_DESCRIPTION,

  inLanguage: "en-IN",

  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
};

/* =====================================================
   ROOT LAYOUT
===================================================== */

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`light ${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}
      style={{
        colorScheme: "light",
      }}
    >
      <head>
        {/* ============================================
            THEME CONFIGURATION
        ============================================ */}

        <meta name="color-scheme" content="light" />

        <meta name="supported-color-schemes" content="light" />

        {/* ============================================
            EDUCATIONAL ORGANIZATION JSON-LD
        ============================================ */}

        <script
          id="smartiq-organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />

        {/* ============================================
            WEBSITE JSON-LD
        ============================================ */}

        <script
          id="smartiq-website-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(websiteJsonLd),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {/* ============================================
            GLOBAL PAGE LOADER
        ============================================ */}

        <PageLoader />

        {/* ============================================
            GOOGLE ANALYTICS
        ============================================ */}

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />

        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        {/* ============================================
            THEME PROVIDER
        ============================================ */}

        <ThemeProvider>
          <div className="relative z-10">
            {/* ========================================
                WEBSITE HEADER
            ======================================== */}

            <ConditionalLayout>
              <div className="no-report-chrome">
                <SiteHeader />
              </div>
            </ConditionalLayout>

            {/* ========================================
                AUTHENTICATION EXPERIENCE
            ======================================== */}

            <AuthAccessExperience />

            {/* ========================================
                PAGE CONTENT
            ======================================== */}

            {children}

            {/* ========================================
                WEBSITE FOOTER
            ======================================== */}

            <ConditionalLayout>
              <div className="no-report-chrome">
                <SiteFooter />
              </div>
            </ConditionalLayout>

            {/* ========================================
                FLOATING ASSISTANCE TOOLS
            ======================================== */}

            <ConditionalLayout>
              <div className="no-report-chrome">
                <FloatingWhatsApp />

                <PWAInstallButton />

                <SmartTutorsAIChatbot />
              </div>
            </ConditionalLayout>
          </div>
        </ThemeProvider>

        {/* ============================================
            VERCEL ANALYTICS
        ============================================ */}

        <Analytics />

        {/* ============================================
            VERCEL SPEED INSIGHTS
        ============================================ */}

        <SpeedInsights />
      </body>
    </html>
  );
}
