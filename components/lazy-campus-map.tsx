type LazyCampusMapProps = {
  mapLink: string;
  address: string;
};

export function LazyCampusMap({
  mapLink,
  address,
}: LazyCampusMapProps) {
  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-lg ">
      <div className="mb-4 flex items-center justify-between">
        <p className="section-label m-0">Campus Location</p>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700  ">
          Visit Us
        </span>
      </div>

      <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 px-8 text-center shadow-inner   sm:h-[360px]">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <p className="mb-2 text-lg font-black text-[var(--color-heading)]">
          Smart Tutors Campus
        </p>

        <p className="mb-6 max-w-xs text-sm font-medium leading-relaxed text-[var(--color-muted)]">
          Visit our campus location directly through Google Maps.
        </p>

        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-md hover:bg-blue-700"
        >
          Open Campus Map
        </a>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex-1 text-xs font-bold leading-relaxed text-[var(--color-muted)]">
          {address}
        </p>

        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="w-full whitespace-nowrap rounded-xl bg-blue-600 px-5 py-3 text-center text-xs font-black text-white shadow-md hover:bg-blue-700 sm:w-auto sm:py-2.5"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
}