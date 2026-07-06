import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "End User License Agreement | Smart Tutors",
  description:
    "Smart Tutors end user license agreement — terms governing the use of our software platform.",
  alternates: {
    canonical: "https://smarttutors.co.in/eula",
  },
};

const sections = [
  {
    title: "1. License Grant",
    content: (
      <p>
        Smart Tutors grants you a limited, non-exclusive, non-transferable,
        revocable license to use our educational platform for personal,
        non-commercial purposes strictly within the scope of your enrolment at
        Smart Tutors institute or as an authorised faculty, staff, or parent
        associated with the institute. This license does not grant you any
        ownership rights to the platform or its content.
      </p>
    ),
  },
  {
    title: "2. Restrictions",
    content: (
      <div className="space-y-2">
        <p>You may not:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Copy, modify, distribute, sell, lease, or sublicense any part of
            the platform
          </li>
          <li>
            Reverse engineer, decompile, disassemble, or attempt to extract
            the source code
          </li>
          <li>Use the platform to build a competing product or service</li>
          <li>
            Circumvent, disable, or tamper with any security measures, access
            controls, or usage limits
          </li>
          <li>
            Share login credentials or allow unauthorised individuals to
            access the platform through your account
          </li>
          <li>
            Use automated tools, bots, or scrapers to extract data from the
            platform
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "3. Intellectual Property",
    content: (
      <p>
        All content, features, and functionality of the platform — including
        software, design, text, graphics, logos, course materials, test banks,
        and video content — are owned by Smart Tutors or its licensors and are
        protected by applicable Indian and international intellectual property
        laws. Unauthorised use of any proprietary material may result in legal
        action.
      </p>
    ),
  },
  {
    title: "4. User-Generated Content",
    content: (
      <div className="space-y-2">
        <p>
          By submitting content (including test answers, feedback, messages,
          profile information, and uploaded files), you grant Smart Tutors a
          non-exclusive, royalty-free, worldwide license to use, store,
          reproduce, modify, and display such content for educational and
          operational purposes within the platform.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">User Responsibility:</p>
          <p className="mt-1">
            You are solely responsible for the content you submit. Smart Tutors
            does not pre-screen user-generated content and is{" "}
            <strong>not liable</strong> for any content that violates
            applicable law, infringes third-party rights, or contains
            defamatory, obscene, or harmful material. Smart Tutors reserves
            the right to remove any content at its sole discretion without
            prior notice.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "5. Disclaimer of Warranties",
    content: (
      <div className="space-y-2">
        <p>
          The platform is provided &quot;as is&quot; and &quot;as
          available&quot; without warranties of any kind, either express or
          implied, including but not limited to warranties of merchantability,
          fitness for a particular purpose, title, and non-infringement.
        </p>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-bold">No Guarantee of Availability:</p>
          <p className="mt-1">
            Smart Tutors does not warrant that: (a) the platform will meet your
            specific requirements; (b) access will be uninterrupted, timely,
            secure, or error-free; (c) defects will be corrected; (d) data
            will not be lost or corrupted; or (e) the platform is free of
            viruses, malware, or other harmful components. You assume all risk
            for any damage to your device or data resulting from use of the
            platform.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "6. Limitation of Liability",
    content: (
      <div className="space-y-2">
        <p>
          To the maximum extent permitted by applicable law, Smart Tutors, its
          operators, directors, employees, affiliates, agents, and licensors
          shall <strong>not be liable</strong> for any:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Indirect, incidental, special, consequential, or punitive damages
          </li>
          <li>Loss of data, profits, goodwill, or business opportunity</li>
          <li>
            Unauthorised access resulting from compromised, weak, or shared
            passwords
          </li>
          <li>
            Damages arising from your failure to maintain the confidentiality
            of your account credentials
          </li>
          <li>
            Data breaches, hacks, or security incidents originating from
            third-party services integrated with the platform
          </li>
          <li>
            Actions, omissions, or content of other users, including faculty
            and students
          </li>
          <li>
            Downtime, service interruptions, or data loss caused by force
            majeure, natural disasters, cyberattacks, internet outages,
            government actions, or events beyond our reasonable control
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "7. Termination",
    content: (
      <div className="space-y-2">
        <p>
          This license terminates automatically without notice if you violate
          any of its terms. Smart Tutors reserves the right to suspend or
          terminate your access to the platform at any time, with or without
          cause, and without prior notice.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-bold">Upon Termination:</p>
          <p className="mt-1">
            Your license to use the platform ceases immediately. Smart Tutors
            may, at its sole discretion, delete or retain your data as outlined
            in the Privacy Policy. Sections relating to intellectual property,
            limitation of liability, disclaimer of warranties, and governing
            law shall survive termination.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "8. Mobile Application",
    content: (
      <p>
        If the platform is accessed via a mobile application, the app is
        licensed, not sold, to you. The terms of this EULA apply equally to
        the mobile app. App store providers (such as Google Play or Apple App
        Store) have no responsibility for the app, its content, or its
        maintenance. You acknowledge that Smart Tutors may remotely disable
        or update the app at any time without notice.
      </p>
    ),
  },
  {
    title: "9. Governing Law & Dispute Resolution",
    content: (
      <div className="space-y-2">
        <p>
          This EULA is governed by the laws of India. Any disputes arising out
          of or relating to this agreement shall be subject to the exclusive
          jurisdiction of the courts in Navi Mumbai, Maharashtra.
        </p>
        <p>
          Before initiating legal proceedings, you agree to attempt to resolve
          the dispute through informal negotiation for a period of 30 days.
          If the dispute cannot be resolved, it shall be referred to
          arbitration in accordance with the Arbitration and Conciliation Act,
          1996, by a sole arbitrator appointed by Smart Tutors. The arbitration
          shall be conducted in English in Navi Mumbai.
        </p>
      </div>
    ),
  },
  {
    title: "10. Contact",
    content: (
      <div>
        <p>For questions about this agreement:</p>
        <div className="mt-2 space-y-1">
          <p>
            <strong>Email:</strong> info@smarttutors.co.in
          </p>
          <p>
            <strong>Phone:</strong> +91 88504 47887
          </p>
        </div>
      </div>
    ),
  },
];

export default function EulaPage() {
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
        name: "EULA",
        item: "https://smarttutors.co.in/eula",
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
            End User License Agreement
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
