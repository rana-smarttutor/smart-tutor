"use client";

import { upload } from "@vercel/blob/client";
import { useMemo, useState } from "react";

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
};

type UploadedBlobInfo = {
  pathname: string;
  url: string;
  downloadUrl?: string;
};

type DigitalLibraryClientProps = {
  initialBooks?: Book[];
  canManage?: boolean;
  isLoggedIn?: boolean;
};

function safeBookName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
}

function getExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return name.slice(dotIndex).toLowerCase();
}

function normalizeStoredPrice(value: string) {
  const digits = value.replace(/[^\d]/g, "");

  if (!digits || Number(digits) <= 0) {
    return "free";
  }

  return String(Number(digits));
}

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

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as {
      success?: boolean;
      message?: string;
      books?: Book[];
      canManage?: boolean;
      isLoggedIn?: boolean;
    };
  } catch {
    throw new Error(text || "The server returned an invalid response.");
  }
}

function BookThumbnail({ book }: { book: Book }) {
  if (book.thumbnailUrl) {
    return (
      <img
        src={book.thumbnailUrl}
        alt={`${book.title} thumbnail`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#102d5b] via-[#164477] to-[#081e3c]">
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
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [allowedToManage, setAllowedToManage] = useState(canManage);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookName, setBookName] = useState("");
  const [price, setPrice] = useState("0");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const filteredBooks = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return books;
    }

    return books.filter((book) =>
      `${book.title} ${book.fileName || ""} ${book.price || ""}`
        .toLowerCase()
        .includes(value),
    );
  }, [books, query]);

  async function loadBooks() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/digital-library", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

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
      console.error("Library loading error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load digital library.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetModal() {
    setIsModalOpen(false);
    setEditingBook(null);
    setBookName("");
    setPrice("0");
    setPdfFile(null);
    setThumbnailFile(null);
    setUploadStatus("");
    setUploadProgress(0);
  }

  function openUpload() {
    resetModal();
    setIsModalOpen(true);
  }

  function openEdit(book: Book) {
    setEditingBook(book);
    setBookName(book.title);
    setPrice(editPriceValue(book.price));
    setPdfFile(null);
    setThumbnailFile(null);
    setUploadStatus("");
    setUploadProgress(0);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSaving) {
      resetModal();
    }
  }

  async function uploadPdf(
    pathname: string,
    file: File,
  ): Promise<UploadedBlobInfo> {
    const blob = await upload(pathname, file, {
      access: "public",
      contentType: "application/pdf",
      handleUploadUrl: "/api/digital-library/upload",
      clientPayload: JSON.stringify({
        assetType: "book",
      }),
      multipart: true,
      onUploadProgress: ({ percentage }) => {
        setUploadProgress(Math.round(percentage));
      },
    });

    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
    };
  }

  async function uploadThumbnail(
    pathname: string,
    file: File,
  ): Promise<UploadedBlobInfo> {
    const blob = await upload(pathname, file, {
      access: "public",
      contentType: file.type || undefined,
      handleUploadUrl: "/api/digital-library/upload",
      clientPayload: JSON.stringify({
        assetType: "thumbnail",
      }),
      onUploadProgress: ({ percentage }) => {
        setUploadProgress(Math.round(percentage));
      },
    });

    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
    };
  }

  async function submitMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowedToManage) {
      alert("Only admins and educators can upload or edit materials.");
      return;
    }

    const title = bookName.trim();

    if (!title) {
      alert("Please enter the name of the book.");
      return;
    }

    if (!editingBook && !pdfFile) {
      alert("Please select a PDF file.");
      return;
    }

    if (!editingBook && !thumbnailFile) {
      alert("Please select a thumbnail image.");
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

    if (thumbnailFile && !/\.(png|jpg|jpeg|webp)$/i.test(thumbnailFile.name)) {
      alert("Thumbnail must be PNG, JPG or WEBP.");
      return;
    }

    const safeTitle = safeBookName(title);

    if (!safeTitle) {
      alert("Invalid book name.");
      return;
    }

    const storedPrice = normalizeStoredPrice(price);
    const assetKey = `${Date.now()}__${storedPrice}__${safeTitle}`;

    setIsSaving(true);
    setUploadProgress(0);

    try {
      let uploadedPdf: UploadedBlobInfo | null = null;
      let uploadedThumbnail: UploadedBlobInfo | null = null;

      if (pdfFile) {
        setUploadStatus("Uploading PDF...");

        uploadedPdf = await uploadPdf(
          `digital-library/books/${assetKey}.pdf`,
          pdfFile,
        );
      }

      if (thumbnailFile) {
        setUploadStatus("Uploading thumbnail...");

        const thumbnailExtension = getExtension(thumbnailFile.name);

        uploadedThumbnail = await uploadThumbnail(
          `digital-library/thumbnails/${assetKey}${thumbnailExtension}`,
          thumbnailFile,
        );
      }

      if (!editingBook) {
        setUploadStatus("Upload completed.");

        resetModal();
        await loadBooks();
        return;
      }

      if (!editingBook.pathname) {
        throw new Error("Unable to identify the material being edited.");
      }

      setUploadStatus("Saving material changes...");

      const response = await fetch(
        `/api/digital-library/${encodeURIComponent(editingBook.pathname)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            price,
            assetKey,
            uploadedPdf,
            uploadedThumbnail,
          }),
        },
      );

      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save material.");
      }

      resetModal();
      await loadBooks();
    } catch (error) {
      console.error("Material save error:", error);

      alert(
        error instanceof Error ? error.message : "Unable to save material.",
      );
    } finally {
      setIsSaving(false);
      setUploadStatus("");
      setUploadProgress(0);
    }
  }

  function requestDeleteBook(book: Book) {
    if (!allowedToManage) {
      return;
    }

    setDeleteError("");
    setBookToDelete(book);
  }

  function cancelDeleteBook() {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setBookToDelete(null);
  }

  async function confirmDeleteBook() {
    if (!allowedToManage || !bookToDelete) {
      return;
    }

    if (!bookToDelete.pathname) {
      setDeleteError("Unable to identify this material.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/digital-library/${encodeURIComponent(bookToDelete.pathname)}`,
        {
          method: "DELETE",
        },
      );

      const result = await readJsonResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed.");
      }

      setBookToDelete(null);
      await loadBooks();
    } catch (error) {
      console.error("Delete material error:", error);

      setDeleteError(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  function downloadBook(book: Book) {
    if (!loggedIn && !allowedToManage) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        "/library",
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
    <main className="min-h-screen bg-transparent px-4 py-8 text-slate-950 dark:text-white sm:px-6">
      <section className="mx-auto max-w-7xl">
        <section className="grid items-center gap-8 py-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-5 py-3 text-sm font-black text-blue-600 dark:border-sky-400/40 dark:bg-white/10 dark:text-sky-300">
              <span className="h-3 w-3 rounded-full bg-sky-400" />
              Smart Tutors Library
            </span>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 sm:text-sm">
              India&apos;s Trusted Smart Learning Platform
            </p>

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Digital Library.
              <br />
              Smarter Study Access.
            </h1>

            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Explore PDF notes and learning materials with clear prices,
              attractive previews and secure download access.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#library-files"
                className="rounded-full bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-500"
              >
                View Library
              </a>

              {allowedToManage && (
                <button
                  type="button"
                  onClick={openUpload}
                  className="rounded-full bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-500"
                >
                  Upload Material
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#101a2e] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              Library Highlights
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              PDF materials,
              <br />
              clear pricing
            </h2>

            <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#071124]">
              <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                Total PDFs
              </p>
              <strong className="mt-2 block text-4xl font-black text-blue-600">
                {books.length}
              </strong>
            </div>
          </div>
        </section>

        <section
          id="library-files"
          className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#101a2e] sm:p-6"
        >
          <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
                Library Collection
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                PDF Study Materials
              </h2>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDFs..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111c31] dark:text-white md:max-w-sm"
            />
          </div>

          {isLoading ? (
            <p className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center font-bold text-slate-500 dark:border-white/10 dark:bg-[#111c31] dark:text-slate-300">
              Loading library...
            </p>
          ) : filteredBooks.length === 0 ? (
            <p className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center font-bold text-slate-500 dark:border-white/10 dark:bg-[#111c31] dark:text-slate-300">
              No PDFs found.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.map((book) => {
                const priceText = displayPrice(book.price);
                const isFree = priceText === "Free";

                return (
                  <article
                    key={book.pathname || book.id || book._id || book.title}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-[#101a2e]"
                  >
                    <div className="h-[180px] overflow-hidden rounded-[18px] bg-slate-100">
                      <BookThumbnail book={book} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-extrabold text-white">
                        PDF
                      </span>

                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold text-white ${
                          isFree ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                      >
                        {priceText}
                      </span>
                    </div>

                    <h3 className="mt-5 line-clamp-2 min-h-[50px] break-words text-lg font-extrabold leading-[1.35]">
                      {book.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 min-h-[48px] text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                      Access this PDF study material for focused learning and
                      revision.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => downloadBook(book)}
                        className="rounded-[14px] bg-blue-600 px-2 py-3 text-xs font-extrabold text-white transition hover:bg-blue-500 sm:text-sm"
                      >
                        {isFree ? "Download ↓" : "Buy & Download"}
                      </button>

                      <button
                        type="button"
                        onClick={() => previewBook(book)}
                        className="rounded-[14px] border border-slate-200 px-2 py-3 text-xs font-extrabold transition hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5 sm:text-sm"
                      >
                        Preview 👁
                      </button>
                    </div>

                    {allowedToManage && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(book)}
                          className="rounded-[14px] border border-blue-400 px-2 py-2.5 text-xs font-extrabold text-blue-500 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10 sm:text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => requestDeleteBook(book)}
                          className="rounded-[14px] border border-red-300 px-2 py-2.5 text-xs font-extrabold text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10 sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
      {allowedToManage && bookToDelete && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={cancelDeleteBook}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-material-title"
            aria-describedby="delete-material-description"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-2xl dark:border-white/10 dark:bg-[#101a2e] sm:p-8"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl dark:bg-red-500/15">
              🗑️
            </div>

            <h2
              id="delete-material-title"
              className="mt-5 text-2xl font-black text-slate-950 dark:text-white"
            >
              Delete PDF?
            </h2>

            <p
              id="delete-material-description"
              className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300"
            >
              Are you sure you want to delete{" "}
              <span className="font-black text-slate-950 dark:text-white">
                “{bookToDelete.title}”
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {deleteError}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelDeleteBook}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDeleteBook()}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500 px-5 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
      {allowedToManage && isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <form
            onSubmit={(event) => void submitMaterial(event)}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#101a2e] sm:p-7"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400">
                  {editingBook ? "Edit Center" : "Upload Center"}
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {editingBook ? "Edit Material" : "Upload New Material"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black dark:border-white/15"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Name of the book
                </span>

                <input
                  required
                  value={bookName}
                  onChange={(event) => setBookName(event.target.value)}
                  placeholder="Enter book name"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111c31] dark:text-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Book upload (PDF only)
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setPdfFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white dark:border-white/10 dark:bg-[#111c31] dark:text-white"
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current PDF.
                  </span>
                )}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Thumbnail upload
                </span>

                <input
                  required={!editingBook}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(event) =>
                    setThumbnailFile(event.target.files?.[0] || null)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-black file:text-white dark:border-white/10 dark:bg-[#111c31] dark:text-white"
                />

                {editingBook && (
                  <span className="text-xs font-bold text-slate-500">
                    Leave blank to keep the current thumbnail.
                  </span>
                )}
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[#111c31] dark:text-white"
                />

                <span className="text-xs font-bold text-slate-500">
                  Display price: {displayPrice(price)}
                </span>
              </label>

              {isSaving && (
                <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
                  <div className="flex items-center justify-between gap-4 text-sm font-bold text-blue-600 dark:text-blue-300">
                    <span>{uploadStatus || "Saving material..."}</span>
                    {uploadProgress > 0 && <span>{uploadProgress}%</span>}
                  </div>

                  {uploadProgress > 0 && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/15"
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
      )}
    </main>
  );
}

export default DigitalLibraryClient;
