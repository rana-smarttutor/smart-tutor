import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Smart Tutors",
  description:
    "Smart Tutors privacy policy — how we collect, use, and protect your personal data.",
  alternates: {
    canonical: "https://smarttutors.co.in/privacy",
  },
};

const sections = [
  {
    title: "1. Information We Collect",
    content: (
      <p>
        Smart Tutors collects personal information that you voluntarily provide
        when you register on our platform, including your name, email address,
        phone number, academic records, attendance data, test scores, fee
        payment history, and learning activity logs. We also collect resume and
        qualification data submitted for placement and career services. Device
        information such as browser type, operating system, IP address, and
        usage patterns may be collected automatically for analytics and security
        purposes.
      </p>
    ),
  },
  {
    title: "2. How We Use Your Data",
    content: (
      <p>
        We use your data solely for educational administration: managing
        courses, tracking attendance and academic performance, issuing test
        results, processing fee records, facilitating communication between
        students and faculty, providing placement assistance, improving our
        teaching platform, and enforcing platform security. We do{" "}
        <strong>not</strong> use your data for automated profiling,
        behavioural advertising, or any purpose not explicitly described in this
        policy.
      </p>
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">Limitation of Responsibility:</p>
          <p className="mt-1">
            Smart Tutors uses third-party service providers for cloud hosting
            (Vercel, MongoDB Atlas), file storage (Vercel Blob, Mega.nz),
            payment processing (Razorpay), and AI services (Google Gemini).
            While we select reputable providers, we are{" "}
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
      <p>
        We retain your personal data for as long as your account is active or
        as needed to provide educational services. After account closure, data
        may be retained for legal, audit, and compliance purposes for the
        period required by applicable Indian law. Anonymised or aggregated data
        may be retained indefinitely for analytical purposes.
      </p>
    ),
  },
  {
    title: "5. Data Security",
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
    title: "6. Your Rights & Choices",
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
    title: "7. Password Reset Policy",
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
    title: "8. Limitation of Liability",
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
    title: "9. Mobile Application",
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
    title: "10. Contact Us",
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
            Last updated: July 2026
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
