"use client";

import { useState } from "react";

type ModalType = "terms" | "privacy" | null;

export function LegalModals() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div className="flex gap-4">
        <button
          onClick={() => setActiveModal("terms")}
          className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          Terms and Conditions
        </button>
        <button
          onClick={() => setActiveModal("privacy")}
          className="hover:text-[var(--color-primary)] transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col border border-[var(--color-border)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background-strong)]">
              <h2 className="text-xl font-black tracking-tight text-[var(--color-heading)] uppercase">
                {activeModal === "terms" ? "Terms of Service" : "Privacy Policy"}
              </h2>
              <button 
                onClick={closeModal}
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors border border-[var(--color-border)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 text-sm leading-relaxed text-[var(--color-muted)] font-medium">
              {activeModal === "terms" ? (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">1. Agreement to Terms</h3>
                    <p>
                      By accessing and using the Smart Tutors workspace, you agree to be bound by these Terms and Conditions. If you do not agree, you must immediately cease all usage of the platform.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">2. Nature of Service</h3>
                    <p>
                      Smart Tutors is an educational assistance platform providing coaching, resources, and administrative tools. While we strive for accuracy, features and educational results may differ between users based on effort and prior knowledge.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">3. Promotional Claims</h3>
                    <p>
                      Users acknowledge that certain promotional claims, testimonials, or feature descriptions on the public site may be stylized or slightly exaggerated for marketing and illustrative purposes. They do not constitute a legal guarantee of specific individual results.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">4. User Conduct</h3>
                    <p>
                      Unauthorized attempts to scrape data, bypass authentication, or interfere with the system's integrity are strictly prohibited and may result in permanent account termination.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">5. Limitation of Liability</h3>
                    <p>
                      Smart Tutors and its directors shall not be liable for any academic failures, data loss, or indirect damages resulting from the use or inability to use the platform. All materials are provided "as-is" without express warranties.
                    </p>
                  </section>
                </div>
              ) : (
                <div className="space-y-6">
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">1. Information We Collect</h3>
                    <p>
                      We collect basic identity data (name, email) and academic progress information to provide a personalized learning experience. We also log diagnostic data to maintain system stability.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">2. How We Use Data</h3>
                    <p>
                      Your data is used to coordinate batches, deliver assessments, and facilitate communication between students and educators. We do not sell or rent your personal information to third-party marketers.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">3. Third-Party Integrations</h3>
                    <p>
                      We utilize secure third-party services like MongoDB Atlas for data storage and Mega.nz for digital library hosting. Usage of these features implies acceptance of their respective privacy standards.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">4. Data Security</h3>
                    <p>
                      We implement industry-standard encryption and security protocols to protect your workspace. However, no digital system is 100% secure, and users are responsible for maintaining their own login credential security.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-base font-black text-[var(--color-heading)] mb-2">5. Updates to Policy</h3>
                    <p>
                      This policy may be updated periodically to reflect changes in our services or legal requirements. Continued use of the platform after updates constitutes acceptance of the new terms.
                    </p>
                  </section>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-background-strong)] flex justify-end">
              <button 
                onClick={closeModal}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
