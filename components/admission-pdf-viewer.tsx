"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";

type Props = {
  applicationId: string;
};

export default function AdmissionPdfViewer({ applicationId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const pdfUrl = `/api/admission/pdf?applicationId=${encodeURIComponent(
    applicationId,
  )}`;

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof import("pdfjs-dist").getDocument> | null = null;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const pdfjs = await import("pdfjs-dist");

        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        task = pdfjs.getDocument({
          url: pdfUrl,
          withCredentials: true,
        });

        const document = await task.promise;

        if (cancelled) {
          await document.cleanup();
          return;
        }

        setPdf(document);
        setPageNumber(1);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load admission PDF.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (task) {
        void task.destroy();
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: ReturnType<
      Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]
    > | null = null;

    async function render() {
      try {
        setRendering(true);

        const page = await pdf!.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale });

        const ratio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas is unavailable.");
        }

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
        });

        await renderTask.promise;
      } catch (cause) {
        if (
          !cancelled &&
          !(
            cause instanceof Error &&
            cause.name === "RenderingCancelledException"
          )
        ) {
          setError("Unable to display this PDF page.");
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    void render();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale]);

  async function downloadPdf() {
    try {
      setDownloading(true);
      setError("");

      const response = await fetch(pdfUrl, {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to download the admission form.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `SmartIQ-Admission-${applicationId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#EDF2F9]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.close()}
              title="Close viewer tab"
              aria-label="Close viewer tab"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <FileText size={23} className="text-blue-700" />
              <div>
                <h1 className="text-sm font-black text-[#0A193A] sm:text-base">
                  SmartIQ Institute
                </h1>
                <p className="text-xs text-slate-500">
                  Official Admission Form · {applicationId}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={downloading || !pdf}
            onClick={() => void downloadPdf()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A54B7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#084899] disabled:opacity-50"
          >
            <Download size={17} />
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </header>

      {pdf && (
        <div className="sticky top-[65px] z-10 flex flex-wrap items-center justify-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-sm font-bold text-slate-700">
            {pageNumber} / {pdf.numPages}
          </span>

          <button
            type="button"
            disabled={pageNumber >= pdf.numPages}
            onClick={() => setPageNumber((p) => p + 1)}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>

          <div className="mx-2 h-6 w-px bg-slate-200" />

          <button
            type="button"
            disabled={scale <= 0.6}
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <Minus size={17} />
          </button>

          <span className="min-w-14 text-center text-sm font-bold text-slate-700">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            disabled={scale >= 2}
            onClick={() => setScale((s) => Math.min(2, s + 0.2))}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
          >
            <Plus size={17} />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-slate-600">
          <Loader2 className="animate-spin" size={22} />
          Loading admission form...
        </div>
      )}

      {error && (
        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {pdf && (
        <div className="overflow-x-auto px-4 py-7">
          <div className="flex min-w-max justify-center">
            <div className="relative bg-white shadow-xl">
              {rendering && (
                <div className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-2">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
