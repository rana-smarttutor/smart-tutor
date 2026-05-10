"use client";

import { useState } from "react";

import type { ManagedUser, MessageItem, Role, SessionUser } from "@/lib/types";

type DashboardMessageCenterProps = {
  session: SessionUser | null;
  role: Role;
  messages: MessageItem[];
  studentDirectory: ManagedUser[];
  onMessagesChange: (messages: MessageItem[]) => void;
};

export function DashboardMessageCenter({
  session,
  role,
  messages,
  studentDirectory,
  onMessagesChange,
}: DashboardMessageCenterProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState(role === "admin" ? "Admin Board" : "Student Notice");
  const [targetMode, setTargetMode] = useState<"everyone" | "selected-students">("everyone");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [expiryPreset, setExpiryPreset] = useState<"24h" | "7d" | "30d" | "never">("7d");
  const [status, setStatus] = useState("");

  const canPost = role === "educator" || role === "admin";

  function buildExpiryIso() {
    if (expiryPreset === "never") {
      return null;
    }

    const now = new Date();

    if (expiryPreset === "24h") {
      now.setHours(now.getHours() + 24);
    } else if (expiryPreset === "7d") {
      now.setDate(now.getDate() + 7);
    } else {
      now.setDate(now.getDate() + 30);
    }

    return now.toISOString();
  }

  async function handlePublish() {
    const targetAudience =
      role === "admin" ? ["student", "educator", "admin"] : ["student", "educator", "admin"];

    const response = await fetch("/api/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        channel,
        audience: targetAudience,
        targetMode,
        userIds: targetMode === "selected-students" ? selectedStudentIds : undefined,
        expiresAt: buildExpiryIso(),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? "Message could not be published.");
      return;
    }

    const data = (await response.json()) as { message: MessageItem };
    onMessagesChange([data.message, ...messages]);
    setTitle("");
    setBody("");
    setSelectedStudentIds([]);
    setExpiryPreset("7d");
    setStatus("Message board updated.");
  }

  return (
    <section className="surface overflow-hidden rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Highlighted Message Board</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-heading)]">
            Communication board
          </h2>
        </div>
        <span className="pill">{messages.length} items</span>
      </div>

      {canPost && session ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-sm font-semibold text-[var(--color-heading)]">Write institute message</p>
            <div className="mt-4 grid gap-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 80))}
                placeholder="Message title"
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, 280))}
                placeholder="Write update for student or faculty boards"
                rows={4}
                className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value)}
                  className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                >
                  <option value="Student Notice">Student Notice</option>
                  <option value="Academic Update">Academic Update</option>
                  <option value="Results">Results</option>
                  <option value="Admin Board">Admin Board</option>
                </select>
                <select
                  value={targetMode}
                  onChange={(event) =>
                    setTargetMode(event.target.value as "everyone" | "selected-students")
                  }
                  className="surface-soft rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)] outline-none"
                >
                  <option value="everyone">Send to everyone</option>
                  <option value="selected-students">Send to selected students</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface rounded-2xl px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">Expiry</p>
                  <select
                    value={expiryPreset}
                    onChange={(event) =>
                      setExpiryPreset(event.target.value as "24h" | "7d" | "30d" | "never")
                    }
                    className="mt-2 w-full bg-transparent text-sm text-[var(--color-heading)] outline-none"
                  >
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">No expiry</option>
                  </select>
                </div>
                <div className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-muted)]">
                  <p className="font-semibold text-[var(--color-heading)]">Format</p>
                  <p className="mt-2 leading-6">
                    Title, channel, audience, expiry, and delivery scope are saved to MongoDB.
                  </p>
                </div>
              </div>
              {targetMode === "selected-students" ? (
                <div className="rounded-3xl border border-[var(--color-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    Target registered students
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {studentDirectory.map((student) => (
                      <label
                        key={student.id}
                        className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-heading)]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={(event) =>
                            setSelectedStudentIds((current) =>
                              event.target.checked
                                ? [...current, student.id]
                                : current.filter((item) => item !== student.id),
                            )
                          }
                          className="mr-3"
                        />
                        {student.name}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
              <button type="button" onClick={handlePublish} className="btn-action btn-md w-full font-bold">
                Publish Message to Board
              </button>
              {status ? (
                <p className="text-sm font-semibold text-[var(--color-heading)]">{status}</p>
              ) : null}
            </div>
          </div>

          <div className="surface-soft rounded-[1.75rem] p-5">
            <p className="text-sm font-semibold text-[var(--color-heading)]">Visibility</p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Messages stay in a high-visibility panel so students can immediately see notices from educators and admins after login.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {messages.map((message) => (
          <div key={message.id} className="surface-soft overflow-hidden rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-base font-semibold text-[var(--color-heading)]" title={message.title}>
                {message.title}
              </p>
              <span className="pill shrink-0">{message.channel}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--color-muted)]">
              {message.author ? <span>By {message.author}</span> : null}
              {message.createdAt ? <span>{new Date(message.createdAt).toLocaleString()}</span> : null}
              {message.expiresAt ? <span>Expires {new Date(message.expiresAt).toLocaleString()}</span> : <span>No expiry</span>}
            </div>
            <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">{message.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
