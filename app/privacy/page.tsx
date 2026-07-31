import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Smart Tutors",
  description:
    "Smart Tutors privacy policy — how we collect, use, store, log, and protect your personal data.",
  alternates: {
    canonical: "https://smarttutors.co.in/privacy",
  },
};

const sections = [
  {
    title: "1. Information We Collect",
    content: (
      <div className="space-y-2">
        <p>
          Smart Tutors collects personal information that you voluntarily provide
          when you register on our platform, including your name, email address,
          phone number, academic records, attendance data, test scores, fee
          payment history, and learning activity logs. We also collect resume and
          qualification data submitted for placement and career services.
        </p>
        <p>
          <strong>Content you create:</strong> messages, homework and doubt
          submissions, test and quiz answers, mock test attempts, complaints,
          feedback, daily routine records, and placement applications submitted
          through the platform.
        </p>
        <p>
          <strong>Device and network information:</strong> when you use the
          platform we automatically collect your IP address, browser type and
          version, operating system, device type, referring URL, language
          preference, and an approximate location (city, region, country)
          derived from your IP address.
        </p>
        <p>
          <strong>Activity and audit logs:</strong> we maintain audit records of
          actions performed on the platform (such as login and logout, creating
          or updating records, approvals, imports and exports) together with the
          technical metadata described above. See "Audit &amp; Activity
          Logging" below.
        </p>
        <p>
          <strong>Payment and financial data:</strong> fee invoices, installment
          plans, and fee transaction records for students, and payroll, payout,
          advance, increment, and transfer records for faculty and staff. Staff
          biometric punch logs may be collected through the institute&apos;s
          attendance system.
        </p>
        <p>
          <strong>Browser storage:</strong> we use a small amount of browser
          storage (localStorage) to remember preferences such as theme
          selection, promotional popup acknowledgements, chat read timestamps,
          and PWA install prompt dismissals. This data stays on your device and
          never leaves it unless transmitted for an intended purpose.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">Identity Verification Documents (Faculty Only):</p>
          <p className="mt-1">
            Faculty accounts are required to submit the following identity
            verification documents during registration:
          </p>
          <ul className="mt-2 ml-6 list-disc space-y-1">
            <li><strong>Resume / CV</strong> — in PDF, DOC, or DOCX format</li>
            <li><strong>Photo ID — Front image</strong> — government-issued photo identification such as Aadhar Card, PAN Card, Passport, Voter ID, or Driver&apos;s License</li>
            <li><strong>Photo ID — Back image</strong> — back side of the same government-issued photo identification</li>
          </ul>
          <p className="mt-2">
            These documents are collected solely for the purpose of identity
            verification and faculty onboarding. By submitting these documents,
            you acknowledge and consent to their collection, storage, and
            processing as described in this policy.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "2. How We Use Your Data",
    content: (
      <div className="space-y-2">
        <p>
          We use your data solely for educational administration: managing
          courses, tracking attendance and academic performance, issuing test
          results, processing fee records, facilitating communication between
          students and faculty, providing placement assistance, and improving
          our teaching platform.
        </p>
        <p>
          We also use technical data and audit logs for platform security,
          fraud prevention, troubleshooting, and accountability — for example,
          to detect unauthorised access, investigate incidents, and verify that
          privileged actions (such as fee changes, approvals, or data exports)
          were performed by authorised staff. Aggregated, anonymised analytics
          help us understand how the platform is used so we can improve it.
        </p>
        <p>
          Messages you send to our AI assistant may be processed by third-party
          AI services (Google Gemini, OpenAI) to generate responses. Please do
          not share sensitive personal information with the AI assistant.
        </p>
        <p>
          We do <strong>not</strong> use your data for automated profiling,
          behavioural advertising, or any purpose not explicitly described in
          this policy.
        </p>
      </div>
    ),
  },
  {
    title: "3. Data Sharing & Third Parties",
    content: (
      <div className="space-y-2">
        <p>
          Smart Tutors does <strong>not</strong> sell, rent, or share your
          personal data with third parties for marketing or advertising
          purposes. Your data is accessible only to authorised institute staff
          — faculty, counsellors, and administrators — as required for their
          educational roles.
        </p>
        <p>
          We share limited data with the following categories of service
          providers strictly to operate the platform: cloud hosting and
          serverless infrastructure (Vercel), database hosting (MongoDB Atlas),
          file and document storage (Vercel Blob, Mega.nz), payment processing
          (Razorpay), AI services (Google Gemini, OpenAI), geographic lookup
          (ipapi.co), maps (Google Maps), and analytics (Vercel Analytics,
          Vercel Speed Insights). Where applicable, such providers receive only
          the data necessary to perform their function and may process it under
          their own terms.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">Limitation of Responsibility:</p>
          <p className="mt-1">
            Smart Tutors uses third-party service providers for cloud hosting
            (Vercel, MongoDB Atlas), file storage (Vercel Blob, Mega.nz),
            payment processing (Razorpay), and AI services (Google Gemini,
            OpenAI). While we select reputable providers, we are{" "}
            <strong>not liable</strong> for data breaches, service outages, or
            data handling practices of these third parties. Users acknowledge
            that data transmitted over the internet passes through third-party
            networks over which Smart Tutors has no control.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "4. Data Retention",
    content: (
      <div className="space-y-2">
        <p>
          We retain your personal data for as long as your account is active or
          as needed to provide educational services. After account closure, data
          may be retained for legal, audit, and compliance purposes for the
          period required by applicable Indian law.
        </p>
        <p>
          Audit and activity logs are retained for security and accountability
          purposes, typically for at least 12 months, and may be retained longer
          where required by law or an ongoing investigation. Payment, fee,
          payroll, and tax-related records are retained for the period required
          by applicable Indian law.
        </p>
        <p>
          Anonymised or aggregated data may be retained indefinitely for
          analytical purposes.
        </p>
      </div>
    ),
  },
  {
    title: "5. Identity Document Handling &amp; Consent",
    content: (
      <div className="space-y-2">
        <p>
          Faculty members who submit identity verification documents (resume/CV
          and photo ID front/back images) during registration explicitly
          consent to the collection, storage, and processing of these documents
          by Smart Tutors for the sole purpose of identity verification and
          faculty onboarding.
        </p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">No Liability for Document Security:</p>
          <p className="mt-1">
            While we implement reasonable security measures, Smart Tutors{" "}
            <strong>does not and cannot guarantee</strong> the absolute security
            of uploaded identity documents. Smart Tutors, its operators,
            employees, affiliates, and service providers shall{" "}
            <strong>not be held liable</strong> for any loss, theft, misuse,
            unauthorised access, disclosure, or corruption of identity documents
            or resumes uploaded to the platform, whether caused by third-party
            service provider failures, force majeure events, cyberattacks,
            user-side security failures, or any other reason beyond our
            reasonable control. You acknowledge that uploading identity
            documents is done entirely at your own risk.
          </p>
        </div>
        <p>
          Identity documents are accessible only to authorised administrators
          and verification staff for the purpose of reviewing and approving
          faculty accounts. These documents are not shared with third parties
          for marketing or any unrelated purpose. Documents may be retained
          for the duration of your account and for any period required by
          applicable Indian law after account closure or deletion.
        </p>
      </div>
    ),
  },
  {
    title: "6. Data Security",
    content: (
      <div className="space-y-2">
        <p>
          We implement reasonable technical and organisational measures —
          including encryption in transit (TLS), access controls, and regular
          security reviews — to protect your data against unauthorised access,
          alteration, disclosure, or destruction.
        </p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">No Guarantee of Absolute Security:</p>
          <p className="mt-1">
            No method of transmission over the Internet or electronic storage
            is 100% secure. Smart Tutors{" "}
            <strong>does not and cannot guarantee</strong> absolute security
            against all threats, including but not limited to zero-day
            vulnerabilities, advanced persistent threats, insider attacks, or
            user-side compromises (such as malware on your device or
            interception on unsecured networks). You use the platform at your
            own risk.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "7. Cookies, Sessions & Analytics",
    content: (
      <div className="space-y-2">
        <p>
          <strong>Session cookie.</strong> When you sign in, we set a single
          session cookie named <code>smart_tutor_session</code>. It contains
          only an HMAC-signed user identifier — no password or other personal
          information is stored in it. The cookie is{" "}
          <code>HttpOnly</code> and <code>SameSite=Lax</code>, is marked{" "}
          <code>Secure</code> in production, and expires automatically after 8
          hours or when you sign out.
        </p>
        <p>
          <strong>Browser storage.</strong> We may store non-essential
          preferences in your browser&apos;s localStorage, including theme
          selection, promotional popup acknowledgement, chat read timestamps,
          and PWA install prompt dismissal. This data never leaves your device
          unless transmitted for an intended purpose.
        </p>
        <p>
          <strong>Analytics.</strong> We use Vercel Analytics and Vercel Speed
          Insights to understand aggregate traffic patterns and page performance
          (Core Web Vitals). These services process anonymised or aggregated
          usage statistics. We do <strong>not</strong> use advertising cookies,
          cross-site tracking, or third-party behavioural advertising.
        </p>
        <p>
          You can clear cookies and browser storage at any time through your
          browser settings. Clearing the session cookie will sign you out of
          your account.
        </p>
      </div>
    ),
  },
  {
    title: "8. Audit & Activity Logging",
    content: (
      <div className="space-y-2">
        <p>
          To keep the platform secure and accountable, we automatically record
          auditable actions including login and logout attempts, account and
          record creation, updates and deletions, approvals and rejections,
          imports and exports, and administrative operations across modules such
          as users, courses, tests, fees, payroll, attendance, placements, and
          messaging.
        </p>
        <p>
          Each audit entry may include: the user&apos;s name, email and role
          (when signed in), the action and module, a description, the request
          path and method, response status and duration, timestamp, IP address,
          browser, operating system, device type, referring URL, language
          preference, country, and approximate city/region derived from the IP
          address via a third-party geo-IP service (ipapi.co).
        </p>
        <p>
          Passwords, identity documents, and the contents of fee or payroll
          records are <strong>never</strong> written into audit logs. Audit
          logs are used only for security, troubleshooting, and accountability
          purposes and are accessible to authorised administrators.
        </p>
      </div>
    ),
  },
  {
    title: "9. Your Rights & Choices",
    content: (
      <p>
        You have the right to access, correct, or request deletion of your
        personal data held by Smart Tutors. To exercise these rights, contact
        your institute administrator or write to us at info@smarttutors.co.in.
        We will respond to your request within the timeframe required by
        applicable law. Note that certain data may be retained where required
        by law or for legitimate operational purposes.
      </p>
    ),
  },
  {
    title: "10. Password Reset Policy",
    content: (
      <div className="space-y-2">
        <p>
          Password reset assistance is available to all users. The first
          password reset request via our platform is{" "}
          <strong>free of charge</strong>. However, repeated or frequent
          password reset requests may incur a nominal administrative fee at
          the institute's discretion. Users are encouraged to safeguard their
          passwords to avoid unnecessary resets.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">Important:</p>
          <p className="mt-1">
            Smart Tutors reserves the right to charge for password reset
            services for excessive requests (more than 3 within a 6-month
            period) or for resets requested outside normal business hours.
            The institute will communicate any applicable fees before
            processing the reset.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "11. Limitation of Liability",
    content: (
      <div className="space-y-2">
        <p>
          To the maximum extent permitted by applicable law, Smart Tutors, its
          operators, employees, affiliates, and service providers shall{" "}
          <strong>not be liable</strong> for any direct, indirect, incidental,
          special, consequential, or punitive damages arising from or related
          to:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Use of, or inability to use, the platform or any content therein
          </li>
          <li>
            Unauthorised access to or alteration of your data resulting from
            compromised, weak, or shared login credentials
          </li>
          <li>
            Data loss, corruption, or breach resulting from user-side factors
            including but not limited to malware, unsecured networks, or
            failure to log out
          </li>
          <li>
            Actions, content, or conduct of other users on the platform
          </li>
          <li>
            Technical failures, service interruptions, downtime, or bugs in
            third-party infrastructure
          </li>
          <li>
            Disclosure of information voluntarily shared by users with third
            parties through or outside the platform
          </li>
          <li>
            Inaccurate, incomplete, or outdated information provided by users
          </li>
          <li>
            Any damages arising from force majeure events, including natural
            disasters, cyberattacks, governmental actions, or network
            failures beyond our reasonable control
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "12. Mobile Application",
    content: (
      <p>
        If you access Smart Tutors via a mobile application, additional device
        permissions may be requested (such as storage access for downloading
        materials or camera access for profile photos). These permissions are
        used only for the stated purpose and are never accessed without your
        explicit action. Smart Tutors is not responsible for any data leakage
        or unauthorised access resulting from jailbroken, rooted, or otherwise
        compromised devices.
      </p>
    ),
  },
  {
    title: "13. Contact Us",
    content: (
      <div>
        <p>For privacy-related inquiries, contact:</p>
        <div className="mt-2 space-y-1">
          <p>
            <strong>Email:</strong> info@smarttutors.co.in
          </p>
          <p>
            <strong>Phone:</strong> +91 88504 47887
          </p>
          <p>
            <strong>Address:</strong> Smart Tutors, Vashi, Navi Mumbai,
            Maharashtra, India
          </p>
        </div>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://smarttutors.co.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Privacy Policy",
        item: "https://smarttutors.co.in/privacy",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last updated: 31 July 2026
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section
              key={section.title}
              className="scroll-mt-20 rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-slate-900">
                {section.title}
              </h2>
              <div className="mt-3 text-sm leading-7 text-slate-700">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
