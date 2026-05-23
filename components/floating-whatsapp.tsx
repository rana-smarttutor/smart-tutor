"use client";

const WHATSAPP_NUMBER = "918850447887";

export function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-6 right-6 z-[99998]">
      <div className="absolute right-20 top-1 flex h-8 w-[145px] items-center justify-center overflow-hidden rounded-full bg-white px-3 text-[10px] font-extrabold text-green-700 shadow-xl">
        <span className="whatsapp-popup-text">Chat on WhatsApp</span>
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-[3px] border-white bg-[#25D366] shadow-2xl transition-transform duration-300 hover:scale-105"
      >
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.33 4.95L2 22l5.28-1.38a9.86 9.86 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.04 2Zm0 18.14h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 1 1 6.98 3.87Zm4.5-6.14c-.25-.12-1.47-.73-1.7-.81-.23-.09-.4-.12-.57.12-.17.25-.65.81-.8.98-.15.17-.3.19-.55.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.51.11-.11.25-.3.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.43 1.03 2.6c.12.17 1.76 2.69 4.27 3.77.6.26 1.07.41 1.43.52.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
        </svg>
      </a>

      <style>{`
  .whatsapp-popup-text {
    animation: whatsapp-popup 2.8s ease-in-out infinite;
    white-space: nowrap;
  }

  @keyframes whatsapp-popup {
    0%,
    100% {
      opacity: 1;
      transform: translateY(0);
    }

    50% {
      opacity: 0.75;
      transform: translateY(-2px);
    }
  }
`}</style>
    </div>
  );
}