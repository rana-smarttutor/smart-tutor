import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Smart Tutors",
  description: "Smart Tutors terms and conditions governing the use of our educational platform, including logging, monitoring, and analytics.",
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
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 31 July 2026</p>

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
            <h2 className="text-xl font-semibold">5. Identity Documents &amp; Verification Data</h2>
            <div className="mt-2 space-y-2">
              <p>
                Faculty accounts are required to submit identity verification documents during registration,
                including but not limited to a resume/CV and government-issued photo identification (such as
                Aadhar Card, PAN Card, Passport, Voter ID, or Driver&apos;s License) in front and back image form.
                By submitting these documents, you:
              </p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Represent and warrant that the documents are genuine, legally valid, and belong to you</li>
                <li>Acknowledge that these documents are collected solely for the purpose of identity verification and faculty onboarding</li>
                <li>Consent to Smart Tutors storing, reviewing, and processing these documents for verification purposes</li>
                <li>Acknowledge that submission of documents does not guarantee account approval or activation</li>
              </ul>
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                <p className="font-bold">No Liability for Document Handling:</p>
                <p className="mt-1">
                  Smart Tutors, its operators, and affiliates shall <strong>not be liable</strong> for any
                  loss, theft, misuse, unauthorised access, or disclosure of identity documents or resumes
                  uploaded to the platform. This includes, but is not limited to, breaches caused by
                  third-party service providers, force majeure events, user-side security failures, or
                  vulnerabilities in cloud storage infrastructure. You upload documents at your own risk
                  and accept full responsibility for the security of your own identity documents.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Monitoring, Logging &amp; Analytics</h2>
            <div className="mt-2 space-y-2">
              <p>
                As described in our Privacy Policy, the platform automatically records device and network
                information (including IP address, browser type and version, operating system, device type,
                referring URL, language preference, and approximate location), session activity, and audit
                logs of actions performed by you on the platform. These records are used for security,
                troubleshooting, and accountability purposes and may be reviewed by authorised administrators.
              </p>
              <p>
                We use analytics services (Vercel Analytics and Vercel Speed Insights) that process aggregate
                usage statistics and page performance data. Passwords, identity documents, and the contents
                of fee or payroll records are never written to audit logs.
              </p>
              <p>
                By using the platform, you consent to the collection, logging, and processing described in the
                Privacy Policy. If you do not consent, you should discontinue use of the platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Cookies &amp; Browser Storage</h2>
            <div className="mt-2 space-y-2">
              <p>
                We set a single session cookie (<code>smart_tutor_session</code>) when you sign in. It is
                <code> HttpOnly</code> and <code>SameSite=Lax</code>, contains only a signed user identifier,
                and expires automatically after 8 hours or when you sign out.
              </p>
              <p>
                We may also store non-essential preferences in your browser&apos;s localStorage, including
                theme selection, promotional popup acknowledgement, chat read timestamps, and PWA install
                prompt dismissal.
              </p>
              <p>
                You may clear cookies and browser storage through your browser settings. Disabling essential
                cookies may prevent you from signing in or using authenticated features.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
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
              <li>Loss, misuse, or unauthorised disclosure of uploaded identity documents or resumes</li>
              <li>Rejection, delay, or failure of the account verification process</li>
              <li>Any decision made or action taken based on information provided through the platform</li>
            </ul>
            <p className="mt-2">
              In no event shall Smart Tutors&apos; total aggregate liability exceed the amount paid by you
              to Smart Tutors during the twelve (12) months preceding the claim, or INR 1,000, whichever is
              greater. You agree to indemnify and hold harmless Smart Tutors from any claims arising from your
              use of the platform or your submission of documents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Third-Party Links</h2>
            <p className="mt-2">
              The platform may contain links to third-party websites. Smart Tutors is not responsible for the
              content, privacy practices, or security of those websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Modifications</h2>
            <p className="mt-2">
              We reserve the right to modify these terms at any time. Users will be notified of material changes
              via the platform. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Governing Law</h2>
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
