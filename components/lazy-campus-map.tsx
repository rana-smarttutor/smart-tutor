type CampusBranch = {
  name: string;
  address: string;
  mapQuery?: string;
};

type LazyCampusMapProps = {
  mapLink: string;
  address: string;
  branches?: CampusBranch[];
  compact?: boolean;
};

export function LazyCampusMap({
  mapLink,
  address,
  branches = [],
  compact = false,
}: LazyCampusMapProps) {
  return (
    <div
      className={
        compact
          ? "min-w-0"
          : "rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-lg sm:p-5"
      }
    >
      <style>{`
        @keyframes siq-campus-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes siq-campus-pulse {
          0% {
            transform: scale(0.65);
            opacity: 0.45;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes siq-campus-route {
          to {
            stroke-dashoffset: -36;
          }
        }

        @keyframes siq-campus-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .siq-campus-pin {
          animation: siq-campus-float 3s ease-in-out infinite;
        }

        .siq-campus-pulse {
          transform-origin: center;
          animation: siq-campus-pulse 3s ease-out infinite;
        }

        .siq-campus-route {
          animation: siq-campus-route 2s linear infinite;
        }

        .siq-campus-content {
          animation: siq-campus-enter 0.7s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .siq-campus-pin,
          .siq-campus-pulse,
          .siq-campus-route,
          .siq-campus-content {
            animation: none !important;
          }
        }
      `}</style>

      {!compact && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="section-label m-0">Campus Location</p>

          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
            Visit Us
          </span>
        </div>
      )}

      {/* ANIMATED CAMPUS MAP */}
      <div
        className={`relative isolate flex flex-col items-center justify-center overflow-hidden border border-blue-100 bg-gradient-to-br from-[#EAF3FF] via-[#F5F9FF] to-[#DCEEFF] text-center ${
          compact
            ? "min-h-[275px] rounded-[1.6rem] px-4 py-7"
            : "min-h-[370px] rounded-[26px] px-6 py-10 sm:min-h-[400px]"
        }`}
      >
        {/* MAP ILLUSTRATION */}
        <svg
          aria-hidden="true"
          viewBox="0 0 500 300"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
          fill="none"
        >
          {/* CITY BLOCKS */}
          <rect x="20" y="22" width="96" height="67" rx="14" fill="#C9DFF8" />

          <rect x="180" y="15" width="88" height="65" rx="14" fill="#D0E4FA" />

          <rect x="380" y="30" width="100" height="75" rx="14" fill="#C9DFF8" />

          <rect x="30" y="210" width="110" height="65" rx="14" fill="#CDE2FA" />

          <rect
            x="365"
            y="218"
            width="112"
            height="65"
            rx="14"
            fill="#CDE2FA"
          />

          {/* GREEN AREAS */}
          <rect x="30" y="115" width="80" height="65" rx="14" fill="#AEE6D4" />

          <rect x="390" y="135" width="92" height="70" rx="14" fill="#AEE6D4" />

          {/* ROAD OUTLINES */}
          <g
            stroke="#C8DAF0"
            strokeWidth="29"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-20 75 L130 108 L250 50 L380 100 L530 65" />
            <path d="M-20 235 L140 200 L255 245 L370 190 L530 245" />
            <path d="M155 -20 L175 100 L145 325" />
            <path d="M315 -20 L290 135 L355 325" />
          </g>

          {/* ROADS */}
          <g
            stroke="#FFFFFF"
            strokeWidth="21"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-20 75 L130 108 L250 50 L380 100 L530 65" />
            <path d="M-20 235 L140 200 L255 245 L370 190 L530 245" />
            <path d="M155 -20 L175 100 L145 325" />
            <path d="M315 -20 L290 135 L355 325" />
          </g>

          {/* MOVING ROUTE */}
          <path
            d="M70 235 Q140 170 190 185 T300 155 T420 95"
            stroke="#2563EB"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="7 11"
            className="siq-campus-route"
          />

          <circle
            cx="70"
            cy="235"
            r="10"
            fill="#FFFFFF"
            stroke="#2563EB"
            strokeWidth="4"
          />

          <circle
            cx="420"
            cy="95"
            r="11"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="4"
          />
        </svg>

        {/* MAIN CONTENT */}
        <div className="siq-campus-content relative z-10 flex w-full flex-col items-center">
          {/* FLOATING LOCATION PIN */}
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            <span className="siq-campus-pulse absolute h-14 w-14 rounded-full bg-blue-500/25" />

            <span
              className="siq-campus-pulse absolute h-14 w-14 rounded-full bg-blue-500/20"
              style={{ animationDelay: "1.5s" }}
            />

            <div className="siq-campus-pin relative z-10 flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)]">
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
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
          </div>

          <h3 className="text-base font-black leading-snug text-[#102143] sm:text-lg">
            SmartIQ Institute Campus
          </h3>

          <p className="mx-auto mt-3 max-w-xs text-xs font-medium leading-6 text-slate-600 sm:text-sm">
            Open our campus locations directly in Google Maps for directions.
          </p>

          {/* BRANCH BUTTONS */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <a
                  key={branch.name}
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    branch.mapQuery || branch.address,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {branch.name}

                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14m-6-6 6 6-6 6"
                    />
                  </svg>
                </a>
              ))
            ) : (
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-md transition hover:-translate-y-1 hover:bg-blue-700"
              >
                Open Campus Map
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ADDRESS — FULL-SIZE MODE ONLY */}
      {!compact && (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-[#102143]">
              Campus Address
            </p>

            <p className="mt-2 break-words text-xs font-medium leading-6 text-[var(--color-muted)]">
              {address}
            </p>
          </div>

          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white transition hover:bg-blue-700"
          >
            Get Directions
          </a>
        </div>
      )}
    </div>
  );
}
