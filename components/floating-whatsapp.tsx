import { getPublicInstituteData } from "@/lib/data-store";

export async function FloatingWhatsApp() {
  const data = await getPublicInstituteData();

  return (
    <a
      href={data.whatsappHref}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Smart Tutors on WhatsApp"
      className="fixed bottom-[24px] right-[24px] z-[99999] flex h-[60px] w-[60px] items-center justify-center rounded-full border border-white/20 bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.28)] transition-transform hover:scale-110 active:scale-95"
      title="Chat on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </a>
  );
}
