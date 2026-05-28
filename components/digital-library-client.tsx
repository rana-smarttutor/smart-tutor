"use client";

import { useEffect, useMemo, useState } from "react";

type Book = {
  _id?: string;
  id?: string;
  title: string;
  price?: string;
  fileName?: string;
  url?: string;
  downloadUrl?: string;
  pathname?: string;
  size?: number;
  uploadedAt?: string;
};

type DigitalLibraryClientProps = {
  initialBooks?: Book[];
  canManage?: boolean;
  isLoggedIn?: boolean;
};

function formatDate(value?: string) {
  if (!value) return "Unknown date";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Unknown date";
  }
}

function isPdfFile(fileName?: string) {
  return fileName?.toLowerCase().endsWith(".pdf") || false;
}

function MaterialThumbnail({
  fileName,
  url,
}: {
  fileName: string;
  url?: string;
}) {
  if (url && url !== "#" && isPdfFile(fileName)) {
    return (
      <iframe
        src={`${url}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
        title={fileName}
        className="h-[210px] w-full origin-top scale-[0.72] border-0 bg-white"
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#2563eb]">
      <div className="absolute left-4 top-4 grid grid-cols-6 gap-1 opacity-70">
        {Array.from({ length: 24 }).map((_, dotIndex) => (
          <span key={dotIndex} className="h-1 w-1 rounded-full bg-white" />
        ))}
      </div>

      <div className="relative text-center">
        <p className="text-4xl">📘</p>
        <p className="mt-2 text-2xl font-black text-white">PDF</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
          Smart Tutors
        </p>
      </div>
    </div>
  );
}

function readThemeFromBrowser() {
  if (typeof window === "undefined") return false;

  const root = document.documentElement;
  const body = document.body;

  const storedTheme =
    localStorage.getItem("theme") ||
    localStorage.getItem("smart-tutors-theme") ||
    localStorage.getItem("color-theme") ||
    localStorage.getItem("mode") ||
    "";

  const dataTheme =
    root.getAttribute("data-theme") ||
    body.getAttribute("data-theme") ||
    root.getAttribute("data-mode") ||
    body.getAttribute("data-mode") ||
    "";

  const explicitTheme = `${storedTheme} ${dataTheme}`.toLowerCase();

  if (explicitTheme.includes("light")) return false;
  if (explicitTheme.includes("dark")) return true;

  const classTheme = `${root.className} ${body.className}`.toLowerCase();

  if (classTheme.includes("light")) return false;
  if (classTheme.includes("dark")) return true;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
}

function normalizePriceInput(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits || Number(digits) <= 0) return "Free";
  return `₹${Number(digits).toLocaleString("en-IN")}`;
}

export function DigitalLibraryClient({
  initialBooks = [],
  canManage = false,
  isLoggedIn = false,
}: DigitalLibraryClientProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [allowedToManage, setAllowedToManage] = useState(canManage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => setIsDark(readThemeFromBrowser());

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"],
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "data-mode"],
      });
    }

    window.addEventListener("storage", syncTheme);

    const interval = window.setInterval(syncTheme, 300);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.clearInterval(interval);
    };
  }, []);

  const theme = {
    page: isDark ? "bg-transparent text-white" : "bg-transparent text-[#0f172a]",
    pill: isDark
      ? "border-sky-400 bg-white/10 text-sky-300"
      : "border-sky-400 bg-white/70 text-sky-600",
    eyebrow: isDark ? "text-blue-400" : "text-blue-600",
    heading: isDark ? "text-white" : "text-slate-950",
    paragraph: isDark ? "text-slate-300" : "text-slate-600",
    panel: isDark
      ? "border-white/10 bg-white/[0.03] shadow-black/20"
      : "border-slate-200 bg-white/70 shadow-slate-300/30",
    innerPanel: isDark
      ? "border-white/10 bg-white/[0.03]"
      : "border-slate-100 bg-gradient-to-br from-white to-blue-50",
    statCard: isDark ? "bg-[#071124]" : "bg-white",
    sectionCard: isDark
      ? "border-white/10 bg-[#0f1a2e]"
      : "border-slate-200 bg-white",
    input: isDark
      ? "border-white/10 bg-[#111c31] text-white placeholder:text-slate-500 focus:bg-[#111c31]"
      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white",
    divider: isDark ? "border-white/10" : "border-slate-100",
    emptyBox: isDark
      ? "border-white/10 bg-[#111c31] text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-500",
    materialCard: isDark ? "bg-[#111c31]" : "bg-white",
    secondaryButton: isDark
      ? "border-white/10 bg-white/10 text-white"
      : "border-slate-200 bg-white text-slate-900",
    downloadButton: isDark
      ? "bg-white/10 text-white hover:bg-white/15"
      : "bg-slate-100 text-slate-900 hover:bg-slate-200",
  };

  const filteredBooks = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return books;

    return books.filter((book) =>
      `${book.title} ${book.fileName || ""} ${book.pathname || ""} ${
        book.price || ""
      }`
        .toLowerCase()
        .includes(search)
    );
  }, [books, query]);

  async function loadBooks() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/digital-library", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load library.");
      }

      setBooks(data.books || []);

      if (typeof data.canManage === "boolean") {
        setAllowedToManage(data.canManage);
      }

      if (typeof data.isLoggedIn === "boolean") {
        setLoggedIn(data.isLoggedIn);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load digital library.");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowedToManage) {
      alert("Only admins and educators can upload materials.");
      return;
    }

    if (!file) {
      alert("Please choose a PDF file.");
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Only PDF files are allowed in the library.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("price", price);

      const response = await fetch("/api/digital-library/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed.");
      }

      setTitle("");
      setPrice("");
      setFile(null);

      const fileInput = document.getElementById(
        "digital-library-file"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      await loadBooks();
    } catch (error) {
      console.error(error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteBook(book: Book) {
    if (!allowedToManage) {
      alert("Only admins and educators can delete materials.");
      return;
    }

    const confirmed = window.confirm(`Delete ${book.title}?`);
    if (!confirmed) return;

    const bookId = book.id || encodeURIComponent(book.pathname || "");

    if (!bookId) {
      alert("This file cannot be deleted because it has no Blob pathname.");
      return;
    }

    try {
      const response = await fetch(`/api/digital-library/${bookId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delete failed.");
      }

      await loadBooks();
    } catch (error) {
      console.error(error);
      alert("Failed to delete file.");
    }
  }

  function handleStudentDownload(downloadUrl: string) {
    if (!loggedIn) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        "/library"
      )}`;
      return;
    }

    if (!downloadUrl || downloadUrl === "#") {
      alert("Download is not available for this material.");
      return;
    }

    window.open(downloadUrl, "_blank");
  }

  useEffect(() => {
    if (initialBooks.length === 0) {
      loadBooks();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className={`w-full px-4 py-10 transition-colors duration-300 ${theme.page}`}>
      <section className="mx-auto max-w-7xl">
        <section className="grid items-center gap-10 py-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-black transition-colors duration-300 ${theme.pill}`}
              >
                <span className="h-3 w-3 rounded-full bg-sky-400" />
                Smart Tutors Library
              </span>
            </div>

            <p className={`mt-10 text-sm font-black uppercase tracking-[0.45em] ${theme.eyebrow}`}>
              India’s Trusted Smart Learning Platform
            </p>

            <h1 className={`mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl ${theme.heading}`}>
              Digital Library.
              <br />
              Smarter Study Access.
            </h1>

            <p className={`mt-7 max-w-3xl text-xl font-semibold leading-9 ${theme.paragraph}`}>
              Access PDF notes, worksheets and learning files in one clean
              Smart Tutors system. Search, check prices and download after login.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#library-files"
                className="rounded-full bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 hover:bg-blue-500"
              >
                View Library
              </a>

              {allowedToManage ? (
                <a
                  href="#upload-material"
                  className={`rounded-full border px-8 py-4 text-base font-black shadow-xl transition hover:-translate-y-1 ${theme.secondaryButton}`}
                >
                  Upload PDF
                </a>
              ) : null}
            </div>
          </div>

          <div className={`rounded-[2rem] border p-8 shadow-2xl transition-colors duration-300 ${theme.panel}`}>
            <div className={`rounded-[2rem] border p-8 transition-colors duration-300 ${theme.innerPanel}`}>
              <p className={`text-sm font-black uppercase tracking-[0.35em] ${theme.eyebrow}`}>
                Library Highlights
              </p>

              <h2 className={`mt-4 text-4xl font-black leading-tight ${theme.heading}`}>
                PDF materials,
                <br />
                clear pricing
              </h2>

              <div className="mt-8 grid gap-4">
                <div className={`rounded-3xl p-5 shadow-lg transition-colors duration-300 ${theme.statCard}`}>
                  <p className="text-sm font-black text-slate-500">
                    Total PDFs
                  </p>
                  <strong className="mt-2 block text-4xl font-black text-blue-600">
                    {books.length}
                  </strong>
                </div>

                <div className={`rounded-3xl p-5 shadow-lg transition-colors duration-300 ${theme.statCard}`}>
                  <p className="text-sm font-black text-slate-500">
                    Search Result
                  </p>
                  <strong className="mt-2 block text-4xl font-black text-emerald-600">
                    {filteredBooks.length}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {allowedToManage ? (
          <form
            id="upload-material"
            onSubmit={uploadBook}
            className={`rounded-[2rem] border p-6 shadow-xl transition-colors duration-300 ${theme.sectionCard}`}
          >
            <div className="mb-5">
              <p className={`text-sm font-black uppercase tracking-[0.25em] ${theme.eyebrow}`}>
                Upload Center
              </p>
              <h2 className={`mt-2 text-3xl font-black ${theme.heading}`}>
                Add New PDF Material
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr_auto]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="PDF title or material name"
                className={`rounded-2xl border px-5 py-4 font-bold outline-none transition-colors duration-300 focus:border-blue-500 ${theme.input}`}
              />

              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Price in INR, e.g. 249 or 0"
                inputMode="numeric"
                className={`rounded-2xl border px-5 py-4 font-bold outline-none transition-colors duration-300 focus:border-blue-500 ${theme.input}`}
              />

              <input
                id="digital-library-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className={`rounded-2xl border px-5 py-4 font-bold outline-none transition-colors duration-300 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white focus:border-blue-500 ${theme.input}`}
              />

              <button
                type="submit"
                disabled={isUploading}
                className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            <p className="mt-3 text-sm font-bold text-slate-500">
              Price preview: {normalizePriceInput(price)} · PDF files only
            </p>
          </form>
        ) : null}

        <section
          id="library-files"
          className={`mt-10 rounded-[2rem] border p-6 shadow-xl transition-colors duration-300 ${theme.sectionCard}`}
        >
          <div className={`flex flex-col gap-5 border-b pb-6 transition-colors duration-300 md:flex-row md:items-center md:justify-between ${theme.divider}`}>
            <div>
              <p className={`text-sm font-black uppercase tracking-[0.25em] ${theme.eyebrow}`}>
                Library Collection
              </p>
              <h2 className={`mt-2 text-3xl font-black ${theme.heading}`}>
                PDF Study Materials
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {allowedToManage
                  ? "Admin/Educator mode: upload, open, download and manage PDFs."
                  : "Student mode: check PDF materials and download after login."}
              </p>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDFs..."
              className={`w-full rounded-2xl border px-5 py-4 font-bold outline-none transition-colors duration-300 focus:border-blue-500 md:w-96 ${theme.input}`}
            />
          </div>

          {isLoading ? (
            <p className={`mt-8 rounded-3xl border p-8 text-center font-bold transition-colors duration-300 ${theme.emptyBox}`}>
              Loading library...
            </p>
          ) : filteredBooks.length === 0 ? (
            <p className={`mt-8 rounded-3xl border p-8 text-center font-bold transition-colors duration-300 ${theme.emptyBox}`}>
              No PDFs found.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBooks.map((book, index) => {
                const fileName = book.fileName || book.title;
                const openUrl = book.url || "#";
                const downloadUrl = book.downloadUrl || book.url || "#";
                const displayPrice = book.price || "Free";

                return (
                  <article
                    key={book.pathname || book.id || book._id || book.title}
                    className={`group overflow-hidden rounded-3xl border shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${
                      theme.materialCard
                    } ${
                      index === 0
                        ? "border-red-300"
                        : isDark
                        ? "border-white/10 hover:border-blue-400"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="relative m-4 mb-0 h-36 overflow-hidden rounded-2xl bg-slate-100">
                      <MaterialThumbnail fileName={fileName} url={openUrl} />
                    </div>

                    <div className="p-5 text-center">
                      <h3 className={`line-clamp-2 text-base font-black leading-snug ${theme.heading}`}>
                        {book.title}
                      </h3>

                      <div className="mt-3 flex items-center justify-center gap-3">
                        <span className="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-black text-slate-950">
                          PDF
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-center">
                        <span className={isDark ? "text-2xl font-black text-white" : "text-2xl font-black text-slate-950"}>
                          {displayPrice}
                        </span>
                      </div>

                      <p className="mt-2 break-all text-[11px] font-bold text-slate-400">
                        Uploaded: {formatDate(book.uploadedAt)}
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {allowedToManage ? (
                          <>
                            <a
                              href={openUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500"
                            >
                              Open
                            </a>

                            <a
                              href={downloadUrl}
                              download={fileName}
                              className={`rounded-full px-4 py-2 text-xs font-black transition ${theme.downloadButton}`}
                            >
                              Download
                            </a>

                            <button
                              type="button"
                              onClick={() => deleteBook(book)}
                              className="rounded-full border border-red-300 px-4 py-2 text-xs font-black text-red-600 transition hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStudentDownload(downloadUrl)}
                            className="rounded-full bg-blue-600 px-5 py-2 text-xs font-black text-white transition hover:bg-blue-500"
                          >
                            {displayPrice === "Free"
                              ? "Download Free"
                              : "Buy & Download"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default DigitalLibraryClient;
