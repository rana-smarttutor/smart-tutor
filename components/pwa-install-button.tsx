"use client";

import { useEffect, useState } from "react";
import { Download, X } from "@/components/ui-icons";

const STORAGE_KEY = "smarttutors_pwa_dismissed";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsVisible(false);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!isVisible) return null;

  return (
    <div className="fixed left-0 right-0 top-16 z-[99999] mx-auto flex max-w-md animate-in fade-in slide-in-from-top-4 duration-500 px-4">
      <div className="flex w-full items-center gap-3 rounded-2xl border border-blue-200 bg-white px-5 py-4 shadow-2xl shadow-blue-500/10  ">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600  ">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 ">
            Install SmartIQ Institute
          </p>
          <p className="text-xs text-slate-500 ">
            Add to home screen for the best experience.
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600  "
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
