import Link from "next/link";

export default function StudentPerformancePage() {
  return (
    <main className="min-h-screen bg-[#071124] px-4 py-10 text-white">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-white/15 bg-[#0f1a2e] p-8 shadow-2xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-blue-400">
          Analytics Hub
        </p>

        <h1 className="text-4xl font-black tracking-tight">
          Student Performance Reports
        </h1>

        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Create, save, view, download and share detailed student performance
          reports. Reports are saved in MongoDB and can be opened again anytime.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/student-performance/create"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-blue-400"
          >
            Create New Report
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}