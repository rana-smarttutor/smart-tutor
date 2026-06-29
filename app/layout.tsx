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
    "description": "SMART TUTORS \u2013 India\u2019s No.1 Trusted Smart Learning Platform. Find the best Personal Home Tutors & Online Tutors for School, College, Government & Competitive Exams.",
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "Sector 17, Vashi",
        "addressLocality": "Navi Mumbai",
        "addressRegion": "Maharashtra",
        "postalCode": "400703",
        "addressCountry": "IN"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8850447887",
      "contactType": "admissions",
      "email": "info@smarttutors.co.in",
      "availableLanguage": ["English", "Hindi", "Marathi"]
    },
    "sameAs": [
      "https://www.instagram.com/smarttutors_academy/",
      "https://wa.me/918850447887"
    ],
    "foundingDate": "2018",
    "numberOfEmployees": { "@type": "QuantitativeValue", "value": "50" },
    "areaServed": "India",
    "knowsAbout": [
      "School Education",
      "Competitive Exams",
      "JEE",
      "NEET",
      "UPSC",
      "Digital Skills",
      "Career Development"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Smart Tutors",
    "url": "https://smarttutors.co.in",
    "description": "India\u2019s No.1 Trusted Smart Learning Platform for school, college, competitive exams, and skill development.",
    "inLanguage": "en-IN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://smarttutors.co.in/courses?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Courses", "item": "https://smarttutors.co.in/courses" },
      { "@type": "ListItem", "position": 3, "name": "Placements", "item": "https://smarttutors.co.in/placements" },
      { "@type": "ListItem", "position": 4, "name": "Mock Tests", "item": "https://smarttutors.co.in/mock-test" },
      { "@type": "ListItem", "position": 5, "name": "Contact", "item": "https://smarttutors.co.in/contact" },
      { "@type": "ListItem", "position": 6, "name": "Digital Library", "item": "https://smarttutors.co.in/digital-library" },
      { "@type": "ListItem", "position": 7, "name": "Quiz Arena", "item": "https://smarttutors.co.in/quiz-arena" }
    ]
  };

  const courseItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Courses Offered at Smart Tutors",
    "description": "Complete range of academic and competitive exam programs available at Smart Tutors Academy.",
    "url": "https://smarttutors.co.in/courses",
    "numberOfItems": 10,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Course",
          "name": "School Foundation (Class 6th - 8th)",
          "description": "Build strong fundamentals in Mathematics, Science, English, and Social Studies.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "School Readiness"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Course",
          "name": "Board Prep (Class 9th - 10th)",
          "description": "Comprehensive preparation for CBSE, ICSE, and SSC board examinations.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Secondary School Certificate"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Course",
          "name": "Science (Class 11th - 12th PCM/PCB)",
          "description": "In-depth coaching for Physics, Chemistry, Mathematics, and Biology with JEE/NEET preparation.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Higher Secondary Certificate"
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "item": {
          "@type": "Course",
          "name": "Commerce (Class 11th - 12th)",
          "description": "Expert guidance in Accountancy, Economics, Business Studies, and Mathematics.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Higher Secondary Certificate"
        }
      },
      {
        "@type": "ListItem",
        "position": 5,
        "item": {
          "@type": "Course",
          "name": "Arts / Humanities (Class 11th - 12th)",
          "description": "Deep learning in History, Political Science, Geography, Psychology, and Sociology.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Higher Secondary Certificate"
        }
      },
      {
        "@type": "ListItem",
        "position": 6,
        "item": {
          "@type": "Course",
          "name": "Graduation (UG Degree)",
          "description": "University-level coaching for B.Sc, B.Com, BA, BBA, BCA, and other undergraduate programs.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Bachelor\u2019s Degree"
        }
      },
      {
        "@type": "ListItem",
        "position": 7,
        "item": {
          "@type": "Course",
          "name": "Post Graduation (PG)",
          "description": "Advanced coaching for M.Sc, M.Com, MA, MBA, and other postgraduate programs.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Master\u2019s Degree"
        }
      },
      {
        "@type": "ListItem",
        "position": 8,
        "item": {
          "@type": "Course",
          "name": "Competitive / Govt Exams",
          "description": "Targeted preparation for UPSC, MPSC, Banking, SSC CGL, Railway, and other government exams.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Government Job Qualification"
        }
      },
      {
        "@type": "ListItem",
        "position": 9,
        "item": {
          "@type": "Course",
          "name": "Skill Development",
          "description": "Career-focused training in digital marketing, programming, data science, and communication skills.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Certificate of Completion"
        }
      },
      {
        "@type": "ListItem",
        "position": 10,
        "item": {
          "@type": "Course",
          "name": "Diploma / Polytechnic",
          "description": "Practical training and theoretical knowledge for diploma and polytechnic programs.",
          "provider": { "@type": "School", "name": "Smart Tutors Academy" },
          "educationalCredentialAwarded": "Diploma Certificate"
        }
      }
    ]
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
          "text": "Smart Tutors is India's No.1 trusted smart learning platform providing personal home tutors and online tutors for school boards (CBSE, ICSE, SSC), competitive exams (JEE, NEET, UPSC, MPSC, Banking, SSC CGL), and digital skill development programs. We combine one-to-one mentorship, interactive whiteboard learning, weekly testing, performance analytics, and 100% job placement support."
        }
      },
      {
        "@type": "Question",
        "name": "Where is Smart Tutors located?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Smart Tutors has its main offline campus in Sector 17, Vashi, Navi Mumbai, Maharashtra 400703. We also offer fully online programs accessible from anywhere in India."
        }
      },
      {
        "@type": "Question",
        "name": "What courses does Smart Tutors offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer School Foundation (1st-10th), Board Prep (9th-10th CBSE/ICSE/SSC), Science (11th-12th PCM/PCB), Commerce (11th-12th), Arts (11th-12th), Graduation (UG), Post Graduation (PG), Diploma/Polytechnic, Competitive/Govt Exams (UPSC, MPSC, Banking, SSC CGL, Railway), and Digital Skill Development programs."
        }
      },
      {
        "@type": "Question",
        "name": "Does Smart Tutors provide JEE and NEET coaching?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Smart Tutors offers dedicated JEE (Main + Advanced) and NEET coaching as part of our Class 11th-12th Science (PCM/PCB) program. Students receive expert faculty guidance, weekly mock tests, doubt-solving sessions, and personalized performance tracking."
        }
      },
      {
        "@type": "Question",
        "name": "What is the teaching methodology at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our methodology combines one-to-one personal mentorship, 24x7 doubt support, interactive whiteboard learning, weekly test systems, detailed student performance reports, digital learning resources, 100+ mock tests, and interview training for personality development."
        }
      },
      {
        "@type": "Question",
        "name": "Does Smart Tutors offer online classes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Smart Tutors provides both online and offline (on-campus) learning options. Online classes include live interactive sessions, recorded lectures, digital study materials, and 24x7 doubt support through our platform."
        }
      },
      {
        "@type": "Question",
        "name": "What is the 7 Days Replacement Guarantee at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "If a student is not satisfied with the teaching method or assigned mentor within the first 7 days, we provide a full replacement of the tutor or a suitable alternative at no extra cost."
        }
      },
      {
        "@type": "Question",
        "name": "Does Smart Tutors provide job placement support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Smart Tutors offers 100% job placement support. We provide interview training, resume building, personality development sessions, and connect students with hiring partners across various industries."
        }
      },
      {
        "@type": "Question",
        "name": "How can I enroll at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can enroll by visiting our website at smarttutors.co.in/signup, filling out the registration form, and submitting the required details. Our team will review your application and activate your account upon approval."
        }
      },
      {
        "@type": "Question",
        "name": "What is the fee structure at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our fee structure varies by program, duration, and learning mode (online or on-campus). Please contact us at info@smarttutors.co.in or call +91-8850447887 for detailed fee information specific to your course of interest."
        }
      },
      {
        "@type": "Question",
        "name": "Does Smart Tutors have mock tests for competitive exams?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer 100+ mock tests designed to simulate real exam environments for JEE, NEET, UPSC, MPSC, Banking, SSC CGL, and other competitive exams. Each test comes with detailed performance analytics and improvement suggestions."
        }
      },
      {
        "@type": "Question",
        "name": "Can parents track student progress at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We provide detailed student performance reports that are shared with both students and parents. Parents receive regular updates on attendance, test scores, homework completion, and overall academic progress."
        }
      },
      {
        "@type": "Question",
        "name": "What is the qualification of teachers at Smart Tutors?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our educators are highly qualified professionals with subject-matter expertise, teaching experience, and a passion for mentoring. Each faculty member undergoes a rigorous selection process and continuous training to maintain high teaching standards."
        }
      },
      {
        "@type": "Question",
        "name": "Does Smart Tutors offer a digital library?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, students get access to a comprehensive digital library with e-books, study notes, worksheets, recorded lectures, and reference materials available anytime through our online platform."
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseItemListJsonLd) }}
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
