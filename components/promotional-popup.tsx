"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function PromotionalPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the popup
    const hasSeenPopup = localStorage.getItem("hasSeenPromoPopup");
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 15000); // 15 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = () => {
    setIsOpen(false);
    // Persist that the user has seen the popup
    localStorage.setItem("hasSeenPromoPopup", "true");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-lg surface rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-500"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
      >
        <button
          onClick={closePopup}
          className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)] hover:bg-[var(--color-background-strong)] transition-all hover:rotate-90 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/image2.png"
              alt="Smart Tutors Logo"
              width={160}
              height={42}
              className="h-10 w-auto object-contain"
            />
          </div>
          
          <div className="surface-soft rounded-3xl p-6 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 w-full">
            <div className="flex justify-center mb-4">
              <span className="pill bg-blue-600 text-white border-blue-600 text-xs py-1 px-3">Limited Time Offer</span>
            </div>
            <h2 id="promo-title" className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">Get 30% OFF</h2>
            <p className="text-blue-700/80 dark:text-blue-300 mb-4 text-sm">
              On all Premium Mock Test Series and Course Enrollments this week!
            </p>
            <div className="text-sm font-mono bg-white/50 dark:bg-black/20 py-2 px-4 rounded-lg inline-block border border-blue-200 dark:border-blue-700">
              Use Code: <span className="font-bold text-blue-600 dark:text-blue-400">SMART30</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <Link 
              href="/courses" 
              onClick={closePopup}
              className="btn-action btn-lg w-full flex items-center justify-center"
            >
              Claim Now
            </Link>
            <button 
              onClick={closePopup}
              className="btn-surface btn-lg w-full"
            >
              Maybe Later
            </button>
          </div>
          
          <p className="mt-6 text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-bold">
            *Valid for first 100 students only. T&C Apply.
          </p>
        </div>
      </div>
    </div>
  );
}
