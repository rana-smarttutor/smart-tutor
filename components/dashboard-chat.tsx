"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ManagedUser,
  MessageItem,
  Role,
  SessionUser,
  ChatAttachment,
} from "@/lib/types";

type ChatViewProps = {
  session: SessionUser | null;
  role: Role;
  messages: MessageItem[];
  onMessagesChange: (messages: MessageItem[]) => void;
  managedUsers?: ManagedUser[];
  studentDirectory: ManagedUser[];
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
};

type ValidationWarning = {
  show: boolean;
  reasons: string[];
  originalBody: string;
};
type ChatContact = Pick<
  ManagedUser,
  "id" | "name" | "role" | "status" | "verified"
>;
export function ChatView({
  session,
  role,
  messages,
  onMessagesChange,
  managedUsers,
  studentDirectory,
  assignedFacultyIds,
}: ChatViewProps) {
  const [chatContactId, setChatContactId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [lastReadTimestamps, setLastReadTimestamps] = useState<
    Record<string, number>
  >(() => {
    if (typeof window === "undefined" || !session?.id) return {};
    try {
      const raw = localStorage.getItem(`chat_last_read_${session.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [attachments, setAttachments] = useState<Map<string, ChatAttachment[]>>(
    new Map(),
  );
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<ValidationWarning>(
    { show: false, reasons: [], originalBody: "" },
  );
  const [chatBlocked, setChatBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [databaseContacts, setDatabaseContacts] = useState<ChatContact[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const studentEducators = useMemo(() => {
    if (role !== "student") {
      return [];
    }

    const contactSource =
      databaseContacts.length > 0 ? databaseContacts : (managedUsers ?? []);

    return contactSource
      .filter(
        (user) =>
          user.role === "educator" &&
          user.status === "active" &&
          user.verified !== false,
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [role, databaseContacts, managedUsers]);
  useEffect(() => {
    if (role !== "student" || !session?.id) {
      setDatabaseContacts([]);
      return;
    }

    let cancelled = false;

    async function loadDatabaseContacts() {
      try {
        const response = await fetch("/api/chat", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          contacts?: ChatContact[];
        };

        if (!cancelled) {
          setDatabaseContacts(
            Array.isArray(payload.contacts) ? payload.contacts : [],
          );
        }
      } catch {
        // Continue using the managedUsers fallback.
      }
    }

    void loadDatabaseContacts();

    const refreshTimer = window.setInterval(() => {
      void loadDatabaseContacts();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [role, session?.id]);
  const chatContacts = useMemo(() => {
    if (role === "admin") {
      const educators = (managedUsers ?? []).filter(
        (u) => u.role === "educator",
      );
      const students = studentDirectory.filter((u) => u.role === "student");
      return [...educators, ...students];
    }
    if (role === "educator") {
      const admins = (managedUsers ?? []).filter((u) => u.role === "admin");
      const students = studentDirectory.filter(
        (u) =>
          u.role === "student" &&
          (u.assignedFacultyIds ?? []).includes(session?.id ?? ""),
      );
      return [...admins, ...students];
    }
    if (role === "student") {
      const contactSource =
        databaseContacts.length > 0 ? databaseContacts : (managedUsers ?? []);

      const admins = contactSource.filter(
        (user) =>
          user.role === "admin" &&
          user.status === "active" &&
          user.verified !== false,
      );

      const contacts = [...admins, ...studentEducators];

      return [
        ...new Map(contacts.map((contact) => [contact.id, contact])).values(),
      ];
    }
    if (role === "parent") {
      const admins = (managedUsers ?? []).filter((u) => u.role === "admin");
      const educators = (managedUsers ?? []).filter(
        (u) => u.role === "educator" && assignedFacultyIds?.includes(u.id),
      );
      return [...admins, ...educators];
    }
    return [];
  }, [
    role,
    managedUsers,
    studentDirectory,
    studentEducators,
    assignedFacultyIds,
    databaseContacts,
    session?.id,
  ]);

  const sortedContacts = useMemo(() => {
    return [...chatContacts].sort((a, b) => {
      const aLatest = messages
        .filter((m) => {
          if (m.channel !== "Chat") return false;
          const involvesMe =
            Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
          const involvesContact =
            Array.isArray(m.userIds) && m.userIds.includes(a.id);
          return involvesMe && involvesContact;
        })
        .reduce((latest, m) => {
          const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          return t > latest ? t : latest;
        }, 0);
      const bLatest = messages
        .filter((m) => {
          if (m.channel !== "Chat") return false;
          const involvesMe =
            Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
          const involvesContact =
            Array.isArray(m.userIds) && m.userIds.includes(b.id);
          return involvesMe && involvesContact;
        })
        .reduce((latest, m) => {
          const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          return t > latest ? t : latest;
        }, 0);
      return bLatest - aLatest;
    });
  }, [chatContacts, messages, session]);

  useEffect(() => {
    if (!chatContactId && sortedContacts.length > 0) {
      const adminContact = sortedContacts.find((c) => c.role === "admin");
      setChatContactId(adminContact?.id ?? sortedContacts[0].id);
    }
  }, [sortedContacts, chatContactId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatContactId]);

  useEffect(() => {
    if (!session) return;
    const counts: Record<string, number> = {};
    for (const contact of chatContacts) {
      const lastRead = lastReadTimestamps[contact.id] ?? 0;
      counts[contact.id] = messages.filter((m) => {
        if (m.channel !== "Chat") return false;
        const involvesUser =
          Array.isArray(m.userIds) && m.userIds.includes(session.id);
        const involvesContact =
          Array.isArray(m.userIds) && m.userIds.includes(contact.id);
        const isFromOther = m.author !== session.name;
        const isNew = m.createdAt
          ? new Date(m.createdAt).getTime() > lastRead
          : false;
        return involvesUser && involvesContact && isNew && isFromOther;
      }).length;
    }
    setUnreadCounts(counts);
  }, [messages, lastReadTimestamps, chatContacts, session]);

  useEffect(() => {
    if (!session?.id) return;
    try {
      localStorage.setItem(
        `chat_last_read_${session.id}`,
        JSON.stringify(lastReadTimestamps),
      );
    } catch {}
  }, [lastReadTimestamps, session]);

  // Check if chat is blocked when contact changes
  useEffect(() => {
    if (!chatContactId || !session) {
      setChatBlocked(false);
      setBlockReason(null);
      return;
    }
    const participantIds = [session.id, chatContactId].sort();
    fetch("/api/chat/block", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantIds, action: "check" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.blocked) {
          setChatBlocked(true);
          setBlockReason(data.reason || "Chat has been blocked by admin.");
        } else {
          setChatBlocked(false);
          setBlockReason(null);
        }
      })
      .catch(() => {});
  }, [chatContactId, session]);

  const conversationMessages = useMemo(() => {
    if (!chatContactId || !session) return [];
    return messages
      .filter((m) => {
        if (m.channel !== "Chat") return false;
        const involvesMe =
          Array.isArray(m.userIds) && m.userIds.includes(session.id);
        const involvesContact =
          Array.isArray(m.userIds) && m.userIds.includes(chatContactId);
        return involvesMe && involvesContact;
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime(),
      );
  }, [messages, chatContactId, session]);

  const selectedContact = useMemo(() => {
    return chatContacts.find((c) => c.id === chatContactId) ?? null;
  }, [chatContacts, chatContactId]);

  const lastMessageForContact = (contactId: string): string | null => {
    const msgs = messages
      .filter((m) => {
        if (m.channel !== "Chat") return false;
        const involvesMe =
          Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
        const involvesContact =
          Array.isArray(m.userIds) && m.userIds.includes(contactId);
        return involvesMe && involvesContact;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      );
    if (msgs.length === 0) return null;
    const body = msgs[0].body;
    if (body.startsWith("[File:")) return "Sent a file";
    return body.length > 40 ? body.slice(0, 40) + "..." : body;
  };

  function handleSelectContact(contactId: string) {
    setChatContactId(contactId);
    setLastReadTimestamps((prev) => ({
      ...prev,
      [contactId]: Date.now(),
    }));
  }

  async function validateAndSend() {
    if (!chatInput.trim() || !chatContactId || !session) return;

    // Validate content
    try {
      const { validateChatContent } = await import("@/lib/chat-validation");
      const result = validateChatContent(chatInput);
      if (result.hasSensitiveContent) {
        setValidationWarning({
          show: true,
          reasons: result.reasons.map((r) => {
            if (r.type === "phone") return `Phone number detected: ${r.detail}`;
            if (r.type === "email")
              return `Email address detected: ${r.detail}`;
            if (r.type === "link") return `External link detected: ${r.detail}`;
            return r.detail;
          }),
          originalBody: chatInput,
        });
        return; // Don't send yet - show warning
      }
    } catch {
      // If validation module fails, proceed without validation
    }

    await sendMessage(chatInput);
  }

  async function sendMessage(body: string) {
    if (!chatContactId || !session) return;
    setSendingChat(true);
    try {
      const targetUser = chatContacts.find((c) => c.id === chatContactId);
      if (!targetUser) return;
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: chatContactId,
          receiverRole: targetUser.role,
          body,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.reasons) {
          setValidationWarning({
            show: true,
            reasons: errData.reasons,
            originalBody: body,
          });
        }
        return;
      }
      const data = (await response.json()) as { message: MessageItem };
      onMessagesChange([data.message, ...messages]);
      setChatInput("");
    } finally {
      setSendingChat(false);
    }
  }

  async function handleEditMessage() {
    setValidationWarning({ show: false, reasons: [], originalBody: "" });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setFileWarning(
        "File size exceeds 20MB limit. Please choose a smaller file.",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileWarning(null);
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        setFileWarning(err.error || "Upload failed.");
        return;
      }

      const data = await response.json();
      // Send a message with the file link
      const fileMessage = `[File: ${data.name}] ${data.url}`;
      await sendMessage(fileMessage);
    } catch {
      setFileWarning("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function renderMessageBody(body: string) {
    // Check for file attachment pattern
    const fileMatch = body.match(/^\[File: (.+?)\] (.+)$/);
    if (fileMatch) {
      const [, fileName, fileUrl] = fileMatch;
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);
      const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(fileName);

      return (
        <div>
          {isImage ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-[200px] rounded-lg mt-1 cursor-pointer hover:opacity-90"
                loading="lazy"
              />
            </a>
          ) : isVideo ? (
            <video
              src={fileUrl}
              controls
              className="max-w-[250px] rounded-lg mt-1"
              preload="metadata"
            />
          ) : (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)]/10 px-3 py-2 mt-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="truncate">{fileName}</span>
            </a>
          )}
        </div>
      );
    }

    // Render regular text with auto-link detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = body.split(urlRegex);
    return (
      <p className="break-words whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-500 hover:text-blue-700"
              >
                {part}
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-5 text-white"
        style={{
          background:
            "linear-gradient(135deg, #1E1B4B, var(--color-primary), #6D28D9)",
        }}
      >
        <p className="text-sm font-medium text-white/60">Communications</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Direct Chat</h1>
      </div>

      <div className="flex h-[600px]">
        {/* Left pane: Contact list */}
        <div
          className={`w-[320px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] flex flex-col ${
            chatContactId ? "hidden lg:flex" : ""
          }`}
        >
          <div className="p-4 border-b border-[var(--color-border)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Chats
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {sortedContacts.length > 0 ? (
              sortedContacts.map((contact) => {
                const isSelected = chatContactId === contact.id;
                const unread = unreadCounts[contact.id] ?? 0;
                const lastMsg = lastMessageForContact(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      isSelected
                        ? "bg-[#4F46E5] text-white"
                        : "hover:bg-[var(--color-card)]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                        }`}
                      >
                        {(contact.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      {unread > 0 ? (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none px-1">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-bold truncate ${
                            isSelected
                              ? "text-white"
                              : "text-[var(--color-heading)]"
                          }`}
                        >
                          {contact.name}
                        </p>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          }`}
                        >
                          {contact.role === "admin"
                            ? "Admin"
                            : contact.role === "educator"
                              ? "Faculty"
                              : "Student"}
                        </span>
                      </div>
                      {lastMsg ? (
                        <p
                          className={`text-xs mt-0.5 truncate ${
                            isSelected
                              ? "text-white/70"
                              : "text-[var(--color-muted)]"
                          }`}
                        >
                          {lastMsg}
                        </p>
                      ) : (
                        <p
                          className={`text-xs mt-0.5 italic ${
                            isSelected
                              ? "text-white/50"
                              : "text-[var(--color-muted)]"
                          }`}
                        >
                          No messages yet
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                  No contacts available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Conversation */}
        <div
          className={`flex-1 flex flex-col bg-[var(--color-card)] ${
            !chatContactId ? "hidden lg:flex" : ""
          }`}
        >
          {chatContactId && selectedContact ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 lg:px-5 py-3 bg-[var(--color-panel)]">
                <button
                  type="button"
                  onClick={() => setChatContactId(null)}
                  className="lg:hidden mr-1 text-lg text-[var(--color-heading)]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                    {selectedContact.name}
                  </p>
                  <span className="inline-block rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--color-primary)]">
                    {selectedContact.role === "admin"
                      ? "Admin"
                      : selectedContact.role === "educator"
                        ? "Faculty"
                        : "Student"}
                  </span>
                </div>
                {chatBlocked ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold text-red-600">
                    Blocked
                  </span>
                ) : null}
              </div>

              {/* Blocked banner */}
              {chatBlocked ? (
                <div className="mx-4 mt-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-red-700">
                    This conversation has been blocked
                  </p>
                  {blockReason ? (
                    <p className="mt-1 text-xs text-red-500">{blockReason}</p>
                  ) : null}
                </div>
              ) : null}

              {/* Policy Banner */}
              <div className="mx-4 mt-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-[11px] font-medium text-amber-800">
                  Sharing personal contact info or external links is against
                  chat policy and will be blocked.
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-none">
                {conversationMessages.length > 0 ? (
                  conversationMessages.map((msg) => {
                    const isMine = msg.author === session?.name;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          style={{ maxWidth: "85%" }}
                          className={`break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? "bg-[#EEF2FF] text-[#1e293b] rounded-br-md"
                              : "bg-[#F1F5F9] text-[#1e293b] rounded-bl-md"
                          }`}
                        >
                          {!isMine && msg.author ? (
                            <p className="text-[10px] font-bold text-[var(--color-muted)] mb-1">
                              {msg.author}
                            </p>
                          ) : null}
                          {renderMessageBody(msg.body)}
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine
                                ? "text-[#64748b]"
                                : "text-[var(--color-muted)]"
                            }`}
                          >
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-[var(--color-muted)]">
                      No messages yet. Start a conversation!
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-panel)]">
                {fileWarning ? (
                  <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2">
                    <p className="text-xs font-semibold text-red-600">
                      {fileWarning}
                    </p>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || chatBlocked}
                    aria-label="Attach file"
                    title="Attach file (max 20MB)"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploadingFile ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!chatBlocked) validateAndSend();
                      }
                    }}
                    disabled={chatBlocked}
                    placeholder={
                      chatBlocked ? "Chat is blocked" : "Type a message..."
                    }
                    className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={validateAndSend}
                    disabled={
                      sendingChat ||
                      !chatInput.trim() ||
                      uploadingFile ||
                      chatBlocked
                    }
                    aria-label="Send message"
                    title="Send message"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm transition-all hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sendingChat ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path
                          d="M4.5 4.5L20 12L4.5 19.5L7.2 12L4.5 4.5Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-[var(--color-muted)] text-center">
                  Files up to 20MB. Sharing contact info or external links is
                  against policy.
                </p>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex h-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="h-12 w-12 mx-auto text-[var(--color-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
                  Select a contact to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Warning Dialog */}
      {validationWarning.show ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--color-heading)]">
                  Content Warning
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Sharing sensitive information is against institute policy
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {validationWarning.reasons.map((reason, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-amber-800">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
              Sharing personal contact details or external links is against
              institute policy. This message has been <strong>blocked</strong>.
              Please remove any sensitive info before sending.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleEditMessage}
                className="flex-1 rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]"
              >
                Edit Message
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
