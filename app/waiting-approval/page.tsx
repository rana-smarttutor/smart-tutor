import Link from "next/link";

export default function WaitingApprovalPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-red-100 px-6 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-2xl shadow-red-900/10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⏳
        </div>

        <h1 className="text-3xl font-black text-red-900">
          Waiting for Approval
        </h1>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Your faculty account request has been submitted successfully.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You can access the educator dashboard only after the admin approves
          your account.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-red-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-red-800"
        >
          Back to Login
        </Link>
      </section>
    </main>
  );
}