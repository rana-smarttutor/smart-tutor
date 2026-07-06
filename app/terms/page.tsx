import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Smart Tutors",
  description: "Smart Tutors terms and conditions governing the use of our educational platform.",
  alternates: {
    canonical: "https://smarttutors.co.in/terms",
  },
};

export default function TermsPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarttutors.co.in" },
      { "@type": "ListItem", "position": 2, "name": "Terms & Conditions", "item": "https://smarttutors.co.in/terms" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the Smart Tutors platform, you agree to be bound by these Terms &amp; Conditions.
              If you do not agree, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. User Accounts</h2>
            <p className="mt-2">
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You must notify us immediately of any unauthorised use.
              Smart Tutors is not liable for any loss or damage arising from your failure to safeguard your password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p className="mt-2">
              You agree to use the platform only for lawful educational purposes. You may not:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Share your login credentials with others</li>
              <li>Access data belonging to other users without authorisation</li>
              <li>Upload malicious content or attempt to disrupt the platform</li>
              <li>Use the platform for commercial purposes outside the institute</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Accuracy</h2>
            <p className="mt-2">
              You are responsible for ensuring that the information you provide is accurate and up to date.
              Smart Tutors is not liable for any consequences resulting from inaccurate or outdated information
              provided by users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
            <p className="mt-2">
              Smart Tutors, its operators, and affiliates shall not be held liable for any direct, indirect,
              incidental, special, or consequential damages resulting from:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Use or inability to use the platform</li>
              <li>Unauthorised access to your data due to compromised credentials</li>
              <li>Actions or content posted by other users</li>
              <li>Technical failures, data loss, or service interruptions</li>
              <li>Disclosure of information by users to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Third-Party Links</h2>
            <p className="mt-2">
              The platform may contain links to third-party websites. Smart Tutors is not responsible for the
              content, privacy practices, or security of those websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Modifications</h2>
            <p className="mt-2">
              We reserve the right to modify these terms at any time. Users will be notified of material changes
              via the platform. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Governing Law</h2>
            <p className="mt-2">
              These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction
              of the courts in Navi Mumbai, Maharashtra.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
