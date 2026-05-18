"use client";

import { useState } from "react";
import { LibraryBook, Role, SessionUser } from "@/lib/types";

type DigitalLibraryClientProps = {
  initialBooks: LibraryBook[];
  canManage: boolean;
};

export function DigitalLibraryClient({
  initialBooks,
  canManage,
}: DigitalLibraryClientProps) {
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUploading(true);
    setStatus("Uploading to Mega.nz...");

    const formData = new FormData(e.currentTarget);
    const audience = ["student", "educator", "admin"];
    formData.append("audience", JSON.stringify(audience));

    try {
      const response = await fetch("/api/digital-library", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setBooks([data.book, ...books]);
        setStatus("Book uploaded successfully!");
        setShowUploadForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setStatus("Failed to upload book.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await fetch("/api/digital-library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setBooks(books.filter((b) => b.id !== id));
      }
    } catch (error) {
      alert("Failed to delete book.");
    }
  }

  return (
    <div className="space-y-12">
      {canManage && (
        <section className="surface rounded-[2rem] p-8 border border-blue-100 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-[var(--color-heading)]">Librarian Tools</h2>
              <p className="text-sm font-bold text-[var(--color-muted)] mt-1">Upload and manage PDF resources</p>
            </div>
            <button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="btn-action btn-md"
            >
              {showUploadForm ? "Cancel Upload" : "Upload New Book"}
            </button>
          </div>

          {showUploadForm && (
            <form onSubmit={handleUpload} className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Book Title</label>
                  <input name="title" required className="surface-soft w-full rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-blue-500/20" placeholder="e.g. Class 10 History Notes" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Author / Faculty</label>
                  <input name="author" className="surface-soft w-full rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-blue-500/20" placeholder="e.g. Prof. Ravi Rana" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Category</label>
                  <select name="category" className="surface-soft w-full rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-blue-500/20">
                    <option value="Textbooks">Textbooks</option>
                    <option value="Revision Notes">Revision Notes</option>
                    <option value="Mock Papers">Mock Papers</option>
                    <option value="Competitive Exam">Competitive Exam</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">Description</label>
                  <textarea name="description" rows={3} className="surface-soft w-full rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-blue-500/20" placeholder="Brief summary of the book content..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--color-muted)]">PDF File</label>
                  <input type="file" name="file" accept=".pdf" required className="block w-full text-sm text-[var(--color-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                </div>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="btn-action btn-lg w-full mt-4 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Finalize and Upload to Mega.nz"}
                </button>
              </div>
            </form>
          )}
          {status && <p className="mt-4 text-sm font-bold text-blue-600 bg-blue-50 p-4 rounded-xl">{status}</p>}
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.length === 0 ? (
          <div className="col-span-full py-20 text-center surface rounded-[2rem] border border-dashed border-[var(--color-border)]">
            <p className="text-xl font-bold text-[var(--color-muted)]">No books available in your library yet.</p>
          </div>
        ) : (
          books.map((book) => (
            <article key={book.id} className="surface rounded-[2rem] p-6 hover:translate-y-[-4px] transition-all duration-300 shadow-lg group">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <span className="pill bg-blue-50 text-blue-600 font-black">{book.category}</span>
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(book.id)}
                      className="h-8 w-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete book"
                    >
                      ×
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-black text-[var(--color-heading)] mb-2 group-hover:text-blue-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-4">By {book.author}</p>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-8 flex-grow">
                  {book.description || "No description provided."}
                </p>
                <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </span>
                  {book.megaFileUrl && (
                    <a 
                      href={book.megaFileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-action btn-sm px-6"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
