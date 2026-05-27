import Link from "next/link";
import { redirect } from "next/navigation";

import { LiveClock } from "@/components/live-clock";
import { MockLoginForm } from "@/components/mock-login-form";
import { RealLoginForm } from "@/components/real-login-form";
import { getSessionUser } from "@/lib/auth";
import { getDemoCredentials } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [session] = await Promise.all([getSessionUser()]);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="section-shell flex min-h-[calc(100dvh-8rem)] items-center pb-6 pt-4 sm:pt-6">
      <div className="grid w-full gap-6 xl:grid-cols-2 xl:items-stretch">
        <section className="surface order-1 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-2">
          <div className="mx-auto w-full max-w-md">
            <RealLoginForm />
          </div>
        </section>

        <section className="dashboard-sidebar order-2 flex h-full flex-col justify-center rounded-[2rem] p-8 sm:p-10 xl:order-1">
          <div className="mx-auto w-full max-w-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="text-3xl font-semibold tracking-[-0.06em] text-[var(--color-heading)]">
                Smart Tutors
              </Link>
              <Link
                href="/courses"
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)]"
              >
                View Courses
              </Link>
            </div>

            <div className="mt-10 space-y-4">
              <p className="text-sm font-semibold tracking-[0.04em] text-[var(--color-accent)]">
                Smart Tutors Access
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-heading)] sm:text-5xl">
                Secure access to your academy workspace.
              </h1>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Sign in with your registered email and password to access your personalized learning or teaching dashboard.
              </p>
              
              <div className="pt-8 mt-8 border-t border-[var(--color-border)]">
                 <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-3xl bg-blue-50/40 border border-blue-100/50 backdrop-blur-sm">
                    <div className="shrink-0 relative group/qr-parent flex items-center justify-center">
                      <div className="p-2.5 bg-white rounded-2xl shadow-lg border border-blue-100 cursor-zoom-in transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/qr-parent:scale-[2.8] group-hover/qr-parent:translate-x-14 group-hover/qr-parent:shadow-2xl relative z-20">
                        <img src="/android app.png" alt="App QR" className="w-16 h-16 rounded-lg" />
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover/qr-parent:opacity-100 transition-opacity rounded-2xl" />
                      </div>
                      <div className="w-20 h-20" aria-hidden="true" />
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Mobile Access</p>
                       <h3 className="text-base font-black text-slate-900 leading-tight">Smart Tutors Android App</h3>
                       
                       <div className="flex items-center gap-3 mt-2">
                         <a 
                          href="https://s4hwk9dbjuligkqz.public.blob.vercel-storage.com/smart%20tutors.apk"
                          download
                          className="inline-flex items-center gap-2 text-xs font-black text-white bg-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                         >
                           Download APK
                         </a>
                         <span className="hidden lg:inline-block text-[10px] font-bold text-slate-400 animate-pulse">← Hover to Scan</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <p className="text-sm font-semibold text-[var(--color-heading)]">
                  Don't have an account? 
                </p>
                <Link href="/contact" className="text-sm font-bold text-blue-600 hover:underline">
                  Contact Admissions to Register
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
