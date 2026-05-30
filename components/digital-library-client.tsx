"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Book = {
  _id?: string;
  id?: string;
  title: string;
  price?: string;
  fileName?: string;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  pathname?: string;
  uploadedAt?: string;
};

type DigitalLibraryClientProps = {
  initialBooks?: Book[];
  canManage?: boolean;
  isLoggedIn?: boolean;
};


function displayPrice(value?: string) {
  if (!value || value.toLowerCase() === "free") {
    return "Free";
  }

  const digits = value.replace(/[^\d]/g, "");

  if (!digits || Number(digits) <= 0) {
    return "Free";
  }

  return `₹${Number(digits).toLocaleString("en-IN")}`;
}

function editPriceValue(value?: string) {
  if (displayPrice(value) === "Free") {
    return "0";
  }

  return String(value).replace(/[^\d]/g, "") || "0";
}

function detectBackgroundDarkMode(element: HTMLElement | null) {
  if (typeof window === "undefined") return false;

  let currentElement: HTMLElement | null = element?.parentElement || null;

  while (currentElement) {
    const background = window.getComputedStyle(currentElement).backgroundColor;

    const match = background.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/
    );

    if (match) {
      const red = Number(match[1]);
      const green = Number(match[2]);
      const blue = Number(match[3]);
      const alpha = match[4] === undefined ? 1 : Number(match[4]);

      if (alpha > 0.05) {
        const brightness = red * 0.299 + green * 0.587 + blue * 0.114;

        return brightness < 150;
      }
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

function readDarkMode(element: HTMLElement | null) {
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

  const classTheme = `${root.className} ${body.className}`.toLowerCase();
  const explicitTheme = `${storedTheme} ${dataTheme}`.toLowerCase();

  if (explicitTheme.includes("dark") || classTheme.includes("dark")) {
    return true;
  }

  if (explicitTheme.includes("light") || classTheme.includes("light")) {
    return false;
  }

  if (detectBackgroundDarkMode(element)) {
    return true;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function BookThumbnail({ book }: { book: Book }) {
  if (book.thumbnailUrl) {
    return (
      <img
        src={book.thumbnailUrl}
        alt={`${book.title} thumbnail`}
        className="h-full w-full object-cover"
      />
    );
  }

  if (book.url) {
    return (
      <iframe
        src={`${book.url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title={`${book.title} preview`}
        className="pointer-events-none h-full w-full border-0 bg-white"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0b2f5f] via-[#143d73] to-[#0a284d]">
      <div className="text-center text-white">
        <p className="text-4xl">📘</p>
        <p className="mt-2 text-xl font-black">PDF</p>
      </div>
    </div>
  );
}

export function DigitalLibraryClient({
  initialBooks = [],
  canManage = false,
  isLoggedIn = false,
}: DigitalLibraryClientProps) {
  const libraryPageRef = useRef<HTMLElement | null>(null);

  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [allowedToManage, setAllowedToManage] = useState(canManage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookName, setBookName] = useState("");
  const [price, setPrice] = useState("0");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(readDarkMode(libraryPageRef.current));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode", "style"],
    });

    if (libraryPageRef.current?.parentElement) {
      observer.observe(libraryPageRef.current.parentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "data-mode", "style"],
      });
    }

    window.addEventListener("storage", syncTheme);
    window.addEventListener("resize", syncTheme);

    const interval = window.setInterval(syncTheme, 300);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("resize", syncTheme);
      window.clearInterval(interval);
    };
  }, []);

  const theme = {
    text: isDark ? "text-white" : "text-slate-950",

    subtext: isDark ? "text-slate-300" : "text-slate-600",

    eyebrow: isDark ? "text-blue-400" : "text-blue-600",

    pill: isDark
      ? "border-sky-400 bg-white/10 text-sky-300"
      : "border-sky-400 bg-white/70 text-sky-600",

    heroBox: isDark
      ? "border-white/10 bg-[#101a2e]"
      : "border-slate-200 bg-white",

    contentBox: isDark
      ? "border-white/10 bg-[#101a2e]"
      : "border-slate-200 bg-white",

    statCard: isDark
      ? "border-white/10 bg-[#071124]"
      : "border-slate-100 bg-white",

    card: isDark
      ? "border-white/10 bg-[#101a2e]"
      : "border-slate-200 bg-white",

    input: isDark
      ? "border-white/10 bg-[#111c31] text-white placeholder:text-slate-500"
      : "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400",

    outline: isDark
      ? "border-white/15 bg-transparent text-white hover:bg-white/5"
      : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50",

    divider: isDark ? "border-white/10" : "border-slate-100",

    empty: isDark
      ? "border-white/10 bg-[#111c31] text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-500",

    modal: isDark
      ? "border-white/10 bg-[#101a2e]"
      : "border-slate-200 bg-white",
  };

  const filteredBooks = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return books;

    return books.filter((book) =>
      `${book.title} ${book.fileName || ""} ${book.price || ""}`
        .toLowerCase()
        .includes(value)
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

  useEffect(() => {
    void loadBooks();
  }, []);

  function openUpload() {
    setEditingBook(null);
    setBookName("");
    setPrice("0");
    setPdfFile(null);
    setThumbnailFile(null);
    setIsModalOpen(true);
  }

  function openEdit(book: Book) {
    setEditingBook(book);
    setBookName(book.title);
    setPrice(editPriceValue(book.price));
    setPdfFile(null);
    setThumbnailFile(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingBook(null);
    setBookName("");
    setPrice("0");
    setPdfFile(null);
    setThumbnailFile(null);
  }

  async function submitMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowedToManage) {
      alert("Only admins and educators can upload or edit materials.");
      return;
    }

    if (!bookName.trim()) {
      alert("Please enter the name of the book.");
      return;
    }

    if (!editingBook && !pdfFile) {
      alert("Please select a PDF file.");
      return;
    }

    if (
      pdfFile &&
      pdfFile.type !== "application/pdf" &&
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Book upload must be a PDF file.");
      return;
    }

    if (!editingBook && !thumbnailFile) {
      alert("Please select a thumbnail image.");
      return;
    }

    if (
      thumbnailFile &&
      !/\.(png|jpg|jpeg|webp)$/i.test(thumbnailFile.name)
    ) {
      alert("Thumbnail must be PNG, JPG or WEBP.");
      return;
    }

    setIsSaving(true);

    try {
      const data = new FormData();

      data.append("title", bookName.trim());
      data.append("price", price);

      if (pdfFile) {
        data.append("file", pdfFile);
      }

      if (thumbnailFile) {
        data.append("thumbnail", thumbnailFile);
      }

      const id =
        editingBook?.id ||
        (editingBook?.pathname
          ? encodeURIComponent(editingBook.pathname)
          : "");

      const url = editingBook
        ? `/api/digital-library/${id}`
        : "/api/digital-library/upload";

      const response = await fetch(url, {
        method: editingBook ? "PATCH" : "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save material.");
      }

      closeModal();
      await loadBooks();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error ? error.message : "Unable to save material."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBook(book: Book) {
    if (!allowedToManage) return;

    const confirmed = window.confirm(`Delete ${book.title}?`);

    if (!confirmed) return;

    const id = book.id || encodeURIComponent(book.pathname || "");

    if (!id) {
      alert("Unable to delete this material.");
      return;
    }

    try {
      const response = await fetch(`/api/digital-library/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed.");
      }

      await loadBooks();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  function downloadBook(book: Book) {
    if (!loggedIn && !allowedToManage) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        "/library"
      )}`;
      return;
    }

    const url = book.downloadUrl || book.url;

    if (!url) {
      alert("Download is not available for this material.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function previewBook(book: Book) {
    const url = book.thumbnailUrl || book.url;

    if (!url) {
      alert("Preview is not available for this material.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main
      ref={libraryPageRef}
      className={`w-full min-w-0 overflow-x-hidden bg-transparent px-3 py-6 transition-colors duration-300 sm:px-4 sm:py-10 ${theme.text}`}
    >
      <section className="mx-auto w-full min-w-0 max-w-7xl">
        <section className="grid min-w-0 items-center gap-8 py-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-black ${theme.pill}`}
            >
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              Smart Tutors Library
            </span>

            <p
              className={`mt-8 text-xs font-black uppercase tracking-[0.3em] sm:mt-10 sm:text-sm sm:tracking-[0.45em] ${theme.eyebrow}`}
            >
              India’s Trusted Smart Learning Platform
            </p>

            <h1
              className={`mt-6 max-w-full break-words text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl ${theme.text}`}
            >
              Digital Library.
              <br />
              Smarter Study Access.
            </h1>

            <p
              className={`mt-6 max-w-3xl break-words text-base font-semibold leading-7 sm:text-lg sm:leading-8 ${theme.subtext}`}
            >
              Explore PDF notes and learning materials with clear prices,
              attractive previews and secure download access.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#library-files"
                className="rounded-full bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 hover:bg-blue-500 sm:px-8 sm:py-4 sm:text-base"
              >
                View Library
              </a>

              {allowedToManage ? (
                <button
                  type="button"
                  onClick={openUpload}
                  className="rounded-full bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 hover:bg-blue-500 sm:px-8 sm:py-4 sm:text-base"
                >
                  Upload Material
                </button>
              ) : null}
            </div>
          </div>

          <div
            className={`min-w-0 overflow-hidden rounded-[2rem] border p-5 shadow-xl sm:p-8 ${theme.heroBox}`}
          >
            <p
              className={`text-xs font-black uppercase tracking-[0.28em] sm:text-sm sm:tracking-[0.35em] ${theme.eyebrow}`}
            >
              Library Highlights
            </p>

            <h2
              className={`mt-4 text-3xl font-black leading-tight sm:text-4xl ${theme.text}`}
            >
              PDF materials,
              <br />
              clear pricing
            </h2>

            <div className="mt-8">
              <div
                className={`rounded-3xl border p-5 shadow-lg ${theme.statCard}`}
              >
                <p className={`text-sm font-black ${theme.subtext}`}>
                  Total PDFs
                </p>

                <strong className="mt-2 block text-4xl font-black text-blue-600">
                  {books.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section
          id="library-files"
          className={`mt-8 min-w-0 overflow-hidden rounded-[2rem] border p-4 shadow-xl sm:p-6 ${theme.contentBox}`}
        >
          <div
            className={`flex min-w-0 flex-col gap-5 border-b pb-6 md:flex-row md:items-center md:justify-between ${theme.divider}`}
          >
            <div className="min-w-0">
              <p
                className={`text-xs font-black uppercase tracking-[0.2em] sm:text-sm sm:tracking-[0.25em] ${theme.eyebrow}`}
              >
                Library Collection
              </p>

              <h2
                className={`mt-2 break-words text-2xl font-black sm:text-3xl ${theme.text}`}
              >
                PDF Study Materials
              </h2>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDFs..."
              className={`w-full min-w-0 rounded-2xl border px-5 py-4 font-bold outline-none focus:border-blue-500 md:max-w-sm ${theme.input}`}
            />
          </div>

          {isLoading ? (
            <p
              className={`mt-8 rounded-3xl border p-8 text-center font-bold ${theme.empty}`}
            >
              Loading library...
            </p>
          ) : filteredBooks.length === 0 ? (
            <p
              className={`mt-8 rounded-3xl border p-8 text-center font-bold ${theme.empty}`}
            >
              No PDFs found.
            </p>
          ) : (
            <div className="mt-8 grid min-w-0 gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr))]">
              {filteredBooks.map((book) => {
                const priceText = displayPrice(book.price);
                const isFree = priceText === "Free";

                return (
                  <article
                    key={book.pathname || book.id || book._id || book.title}
                    className={`mx-auto w-full min-w-0 max-w-[350px] overflow-hidden rounded-[24px] border p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${theme.card}`}
                  >
                    <div className="h-[180px] overflow-hidden rounded-[18px] bg-slate-100">
                      <BookThumbnail book={book} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white">
                        PDF
                      </span>

                      <span className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-slate-950">
                        Study Material
                      </span>

                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold text-white ${
                          isFree ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                      >
                        {priceText}
                      </span>
                    </div>

                    <h3
                      title={book.title}
                      className={`mt-5 line-clamp-2 min-h-[50px] break-words text-lg font-extrabold leading-[1.35] ${theme.text}`}
                    >
                      {book.title}
                    </h3>

                   

                    

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => downloadBook(book)}
                        className="w-full rounded-[14px] bg-blue-600 px-2 py-3 text-xs font-extrabold text-white transition hover:bg-blue-500 sm:text-sm"
                      >
                        {isFree ? "Download ↓" : "Buy & Download"}
                      </button>

                      <button
                        type="button"
                        onClick={() => previewBook(book)}
                        className={`w-full rounded-[14px] border px-2 py-3 text-xs font-extrabold transition sm:text-sm ${theme.outline}`}
                      >
                        Preview 👁
                      </button>
                    </div>

                    {allowedToManage ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(book)}
                          className="w-full rounded-[14px] border border-blue-400 px-2 py-2.5 text-xs font-extrabold text-blue-500 transition hover:bg-blue-50 dark:border-blue-400/40 dark:text-blue-300 dark:hover:bg-blue-500/10 sm:text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteBook(book)}
                          className="w-full rounded-[14px] border border-red-300 px-2 py-2.5 text-xs font-extrabold text-red-500 transition hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10 sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {allowedToManage && isModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <form
            onSubmit={submitMaterial}
            onMouseDown={(event) => event.stopPropagation()}
            className={`max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border p-6 shadow-2xl sm:p-7 ${theme.modal}`}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-[0.28em] ${theme.eyebrow}`}
                >
                  {editingBook ? "Edit Center" : "Upload Center"}
                </p>

                <h2 className={`mt-2 text-2xl font-black ${theme.text}`}>
                  {editingBook ? "Edit Material" : "Upload New Material"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className={`rounded-full border px-3 py-2 text-sm font-black ${theme.outline}`}
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className={`text-sm font-bold ${theme.subtext}`}>
                  Name of the book
                </span>

                <input
                  required
                  value={bookName}
                  onChange={(event) => setBookName(event.target.value)}
                  placeholder="Enter book name"
                  className={`rounded-2xl border px-5 py-4 font-bold outline-none focus:border-blue-500 ${theme.input}`}
                />
              </label>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${theme.subtext}`}>
                  Book upload (PDF only)
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] || null)
                  }
                  className={`rounded-2xl border px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white ${theme.input}`}
                />

                {editingBook ? (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current PDF.
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${theme.subtext}`}>
                  Thumbnail upload
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(event) =>
                    setThumbnailFile(event.target.files?.[0] || null)
                  }
                  className={`rounded-2xl border px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white ${theme.input}`}
                />

                {editingBook ? (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current thumbnail.
                  </span>
                ) : null}
              </label>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${theme.subtext}`}>
                  Price in INR
                </span>

                <input
                  required
                  min="0"
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="Enter 0 for Free"
                  className={`rounded-2xl border px-5 py-4 font-bold outline-none focus:border-blue-500 ${theme.input}`}
                />

                <span className="text-xs font-bold text-slate-500">
                  Display price: {displayPrice(price)}
                </span>
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className={`rounded-xl border px-5 py-3 text-sm font-black ${theme.outline}`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? editingBook
                    ? "Saving..."
                    : "Uploading..."
                  : editingBook
                  ? "Save Changes"
                  : "Upload Material"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

export default DigitalLibraryClient;