import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ApplicationSubmittedPage() {
  const session = await getSessionUser();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 px-6 py-10">
        <section className="w-full max-w-md rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-2xl shadow-violet-900/10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            ⏳
          </div>

          <h1 className="text-3xl font-black text-violet-900">
            Application Submitted
          </h1>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            Your registration has been submitted successfully.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please wait for admin approval. You will be able to access your
            dashboard once your account is verified.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-violet-700 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-violet-600"
          >
            Back to Login
          </Link>
        </section>
      </main>
    );
  }

  if (session.status === "active") {
    redirect("/dashboard");
  }

  const roleLabel = session.role === "educator" ? "faculty" : "account";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 px-6 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-2xl shadow-violet-900/10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⏳
        </div>

        <h1 className="text-3xl font-black text-violet-900">
          Awaiting Confirmation
        </h1>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Your {roleLabel} is currently pending admin approval.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You will be able to access your full dashboard once your account is
          verified. Check back later.
        </p>

        <Link
          href="/api/auth/logout"
          className="mt-8 inline-flex rounded-full bg-violet-700 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-violet-600"
        >
          Log out
        </Link>
      </section>
    </main>
  );
}
