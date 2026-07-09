"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ManagedUser, MessageItem, Role, SessionUser } from "@/lib/types";

type DashboardMessageCenterProps = {
  session: SessionUser | null;
  role: Role;
  messages: MessageItem[];
  studentDirectory: ManagedUser[];
  onMessagesChange: (messages: MessageItem[]) => void;
  managedUsers?: ManagedUser[];
  assignedFacultyIds?: string[];
  assignedFacultyNames?: string[];
};

export function DashboardMessageCenter({
  session,
  role,
  messages,
  studentDirectory,
  onMessagesChange,
  managedUsers,
  assignedFacultyIds,
  assignedFacultyNames,
}: DashboardMessageCenterProps) {
  const [viewMode, setViewMode] = useState<"board" | "chat">("board");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState(
    role === "admin" ? "Admin Board" : "Student Notice",
  );
  const [targetMode, setTargetMode] = useState<
    "everyone" | "selected-students"
  >("everyone");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [expiryPreset, setExpiryPreset] = useState<
    "24h" | "7d" | "30d" | "never"
  >("7d");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editChannel, setEditChannel] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [studentRecipient, setStudentRecipient] = useState<"faculty" | "admin">(
    "faculty",
  );
  const [educatorRecipient, setEducatorRecipient] = useState<
    "admin" | "students" | "selected-students"
  >("admin");

  // Chat state
  const [chatContactId, setChatContactId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isStudentOrParent = role === "student" || role === "parent";
  const boardLabel = isStudentOrParent ? "Application Board" : "Notice Board";
  const composeLabel = isStudentOrParent
    ? "Write an application"
    : role === "educator"
      ? "Write message"
      : "Write institute message";
  const canPost = role === "student" || role === "educator" || role === "admin";
  const canPostToEveryone = role === "admin";

  const studentEducators = useMemo(() => {
    if (role !== "student" || !managedUsers || !assignedFacultyIds) return [];
    return managedUsers.filter(
      (u) => u.role === "educator" && assignedFacultyIds.includes(u.id),
    );
  }, [role, managedUsers, assignedFacultyIds]);

  const adminUsers = useMemo(() => {
    if (!managedUsers) return [];
    return managedUsers.filter((u) => u.role === "admin");
  }, [managedUsers]);

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
      const students = studentDirectory.filter((u) => u.role === "student");
      return [...admins, ...students];
    }
    if (role === "student") {
      const admins = (managedUsers ?? []).filter((u) => u.role === "admin");
      const educators = studentEducators;
      return [...admins, ...educators];
    }
    return [];
  }, [role, managedUsers, studentDirectory, studentEducators]);

  useEffect(() => {
    if (!chatContactId && chatContacts.length > 0) {
      const adminContact = chatContacts.find((c) => c.role === "admin");
      setChatContactId(adminContact?.id ?? chatContacts[0].id);
    }
  }, [chatContacts, chatContactId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatContactId]);

  const chatMessages = useMemo(() => {
    if (!chatContactId || !session) return [];
    const contactName =
      chatContacts.find((c) => c.id === chatContactId)?.name ?? "";
    return messages
      .filter((m) => {
        const isFromContact = m.author === contactName;
        const isToContact =
          Array.isArray(m.userIds) && m.userIds.includes(chatContactId);
        const isFromMe = m.author === session.name;
        return (
          m.channel === "Chat" &&
          ((isFromContact && isToContact) ||
            (isFromMe && isToContact) ||
            (isFromContact && isFromMe))
        );
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime(),
      );
  }, [messages, chatContactId, session, chatContacts]);

  function buildExpiryIso() {
    if (expiryPreset === "never") return null;
    const now = new Date();
    if (expiryPreset === "24h") now.setHours(now.getHours() + 24);
    else if (expiryPreset === "7d") now.setDate(now.getDate() + 7);
    else now.setDate(now.getDate() + 30);
    return now.toISOString();
  }

  function buildAudienceAndUserIds() {
    if (role === "admin") {
      if (targetMode === "selected-students") {
        return {
          audience: ["student", "educator", "admin"] as const,
          userIds: selectedStudentIds,
        };
      }
      return {
        audience: ["student", "educator", "admin"] as const,
        userIds: undefined as string[] | undefined,
      };
    }
    if (role === "educator") {
      if (educatorRecipient === "admin") {
        return {
          audience: ["admin"] as const,
          userIds: adminUsers.map((u) => u.id),
        };
      }
      if (educatorRecipient === "selected-students") {
        return { audience: ["student"] as const, userIds: selectedStudentIds };
      }
      return {
        audience: ["student"] as const,
        userIds: studentDirectory.map((s) => s.id),
      };
    }
    if (role === "student") {
      if (studentRecipient === "admin") {
        return {
          audience: ["admin"] as const,
          userIds: adminUsers.map((u) => u.id),
        };
      }
      return {
        audience: ["educator"] as const,
        userIds: assignedFacultyIds ?? [],
      };
    }
    return {
      audience: ["student", "educator", "admin"] as const,
      userIds: undefined as string[] | undefined,
    };
  }

  async function handlePublish() {
    const { audience, userIds } = buildAudienceAndUserIds();
    const response = await fetch("/api/messages", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        channel,
        audience,
        userIds,
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

  async function handleSendChat() {
    if (!chatInput.trim() || !chatContactId || !session) return;
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
          body: chatInput,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? "Message could not be sent.");
        return;
      }
      const data = (await response.json()) as { message: MessageItem };
      onMessagesChange([data.message, ...messages]);
      setChatInput("");
      setStatus("");
    } finally {
      setSendingChat(false);
    }
  }

  function startEdit(message: MessageItem) {
    setEditingId(message.id);
    setEditTitle(message.title);
    setEditBody(message.body);
    setEditChannel(message.channel);
    setStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setEditChannel("");
    setStatus("");
  }

  async function handleEdit(messageId: string) {
    if (!editTitle.trim() || !editBody.trim() || !editChannel.trim()) {
      setStatus("Title, body, and channel are required.");
      return;
    }
    const response = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        body: editBody,
        channel: editChannel,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? "Message could not be updated.");
      return;
    }
    const data = (await response.json()) as { message: MessageItem };
    onMessagesChange(
      messages.map((m) => (m.id === messageId ? data.message : m)),
    );
    cancelEdit();
    setStatus("Message updated.");
  }

  async function handleDelete(messageId: string) {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? "Message could not be deleted.");
      setDeleteConfirmId(null);
      return;
    }
    onMessagesChange(messages.filter((m) => m.id !== messageId));
    setDeleteConfirmId(null);
    setStatus("Message deleted.");
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">Communications</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              {viewMode === "board" ? boardLabel : "Direct Chat"}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                viewMode === "board"
                  ? "bg-white text-[#0B40A1]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Notice Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chat")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                viewMode === "chat"
                  ? "bg-white text-[#0B40A1]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Direct Chat
            </button>
          </div>
        </div>
      </div>

      {/* Status */}
      {status ? (
        <div className="mx-6 mt-4 rounded-xl bg-[var(--color-panel)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)] border border-[var(--color-border)]">
          {status}
        </div>
      ) : null}

      {viewMode === "board" ? (
        /* ════ NOTICE BOARD VIEW ════ */
        <div className="p-6">
          {/* Messages displayed first */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-6">
            {messages
              .filter((m) => m.channel !== "Chat")
              .map((message) => (
                <div
                  key={message.id}
                  className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5"
                >
                  {editingId === message.id ? (
                    <div className="grid gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Editing
                      </p>
                      <input
                        value={editTitle}
                        onChange={(e) =>
                          setEditTitle(e.target.value.slice(0, 80))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) =>
                          setEditBody(e.target.value.slice(0, 280))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <select
                        value={editChannel}
                        onChange={(e) => setEditChannel(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      >
                        <option value="Student Notice">Student Notice</option>
                        <option value="Academic Update">Academic Update</option>
                        <option value="Results">Results</option>
                        <option value="Admin Board">Admin Board</option>
                      </select>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(message.id)}
                          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-heading)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 break-words text-base font-bold text-[var(--color-heading)]">
                          {message.title}
                        </p>
                        <span className="shrink-0 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                          {message.channel}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-[var(--color-muted)]">
                        {message.author ? (
                          <span>By {message.author}</span>
                        ) : null}
                        {message.createdAt ? (
                          <span>
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        ) : null}
                        {message.expiresAt ? (
                          <span>
                            Expires{" "}
                            {new Date(message.expiresAt).toLocaleString()}
                          </span>
                        ) : (
                          <span>No expiry</span>
                        )}
                      </div>
                      <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">
                        {message.body}
                      </p>
                      {canPost ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(message)}
                            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-heading)] hover:bg-blue-500/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(message.id)}
                            className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
          </div>

          {/* Compose form below */}
          {canPost && session ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
              <p className="text-sm font-bold text-[var(--color-heading)]">
                {composeLabel}
              </p>
              <div className="mt-4 grid gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="Message title"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 280))}
                  placeholder={
                    role === "student"
                      ? "Write your message..."
                      : "Write update for student or faculty boards"
                  }
                  rows={4}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="Student Notice">Student Notice</option>
                    <option value="Academic Update">Academic Update</option>
                    <option value="Results">Results</option>
                    <option value="Admin Board">Admin Board</option>
                  </select>
                  {canPostToEveryone ? (
                    <select
                      value={targetMode}
                      onChange={(e) =>
                        setTargetMode(
                          e.target.value as "everyone" | "selected-students",
                        )
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="everyone">Send to everyone</option>
                      <option value="selected-students">
                        Send to selected students
                      </option>
                    </select>
                  ) : role === "educator" ? (
                    <select
                      value={educatorRecipient}
                      onChange={(e) =>
                        setEducatorRecipient(
                          e.target.value as
                            | "admin"
                            | "students"
                            | "selected-students",
                        )
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="admin">Send to Admin</option>
                      <option value="students">Send to all my students</option>
                      <option value="selected-students">
                        Send to selected students
                      </option>
                    </select>
                  ) : role === "student" ? (
                    <select
                      value={studentRecipient}
                      onChange={(e) =>
                        setStudentRecipient(
                          e.target.value as "faculty" | "admin",
                        )
                      }
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value="faculty">Send to my faculty</option>
                      <option value="admin">Send to Admin</option>
                    </select>
                  ) : null}
                </div>
                {(targetMode === "selected-students" && canPostToEveryone) ||
                (educatorRecipient === "selected-students" &&
                  role === "educator") ? (
                  <div className="rounded-xl border border-[var(--color-border)] p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      Target registered students
                    </p>
                    <div className="max-h-40 space-y-1.5 overflow-y-auto">
                      {studentDirectory.map((student) => (
                        <label
                          key={student.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-primary)]/5"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(e) =>
                              setSelectedStudentIds((c) =>
                                e.target.checked
                                  ? [...c, student.id]
                                  : c.filter((id) => id !== student.id),
                              )
                            }
                            className="h-4 w-4 text-[var(--color-primary)]"
                          />
                          <span className="font-medium text-[var(--color-heading)]">
                            {student.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                      Expiry
                    </p>
                    <select
                      value={expiryPreset}
                      onChange={(e) =>
                        setExpiryPreset(
                          e.target.value as "24h" | "7d" | "30d" | "never",
                        )
                      }
                      className="mt-1 w-full bg-transparent text-sm text-[var(--color-heading)] outline-none"
                    >
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="never">No expiry</option>
                    </select>
                  </div>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-muted)]">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
                      Format
                    </p>
                    <p className="mt-1 leading-6">
                      Title, channel, audience, expiry, and delivery scope.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePublish}
                  className="w-full rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                >
                  Publish Message to Board
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* ════ CHAT VIEW ════ */
        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Contacts sidebar — hidden on mobile when a contact is selected */}
          <div
            className={`w-full lg:w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-panel)] flex flex-col ${chatContactId ? "hidden lg:flex" : ""}`}
          >
            <div className="p-4 border-b border-[var(--color-border)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Contacts
              </p>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {chatContacts.map((contact) => {
                const isAdmin = contact.role === "admin";
                const isAssignedFaculty =
                  role === "student" &&
                  assignedFacultyIds?.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setChatContactId(contact.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      chatContactId === contact.id
                        ? "bg-[var(--color-primary)]/10 border-l-2 border-[var(--color-primary)]"
                        : "hover:bg-[var(--color-card)] border-l-2 border-transparent"
                    }`}
                  >
                    <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                        {contact.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] font-semibold text-[var(--color-muted)]">
                          {contact.role}
                        </p>
                        {isAdmin ? (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                            Admin
                          </span>
                        ) : null}
                        {isAssignedFaculty ? (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                            My Faculty
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
              {chatContacts.length === 0 ? (
                <p className="p-4 text-xs text-[var(--color-muted)]">
                  No contacts available.
                </p>
              ) : null}
            </div>
          </div>

          {/* Chat area — hidden on mobile when no contact selected */}
          <div
            className={`flex-1 flex flex-col bg-[var(--color-card)] ${!chatContactId ? "hidden lg:flex" : ""}`}
          >
            {chatContactId ? (
              <>
                {/* Chat header with mobile back button */}
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 lg:px-5 py-3 bg-[var(--color-panel)]">
                  <button
                    type="button"
                    onClick={() => setChatContactId(null)}
                    className="lg:hidden mr-1 text-lg text-[var(--color-heading)]"
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                    {chatContacts
                      .find((c) => c.id === chatContactId)
                      ?.name.charAt(0)
                      .toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--color-heading)] truncate">
                      {chatContacts.find((c) => c.id === chatContactId)?.name ??
                        "Unknown"}
                    </p>
                    <p className="text-[10px] font-semibold text-[var(--color-muted)]">
                      {chatContacts.find((c) => c.id === chatContactId)?.role ??
                        ""}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-none">
                  {chatMessages.map((msg) => {
                    const isMine = msg.author === session?.name;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] lg:max-w-[75%] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? "bg-[var(--color-primary)] text-white rounded-br-md"
                              : "bg-[var(--color-panel)] text-[var(--color-heading)] rounded-bl-md border border-[var(--color-border)]"
                          }`}
                        >
                          {!isMine && msg.author ? (
                            <p className="text-[10px] font-bold text-[var(--color-muted)] mb-1">
                              {msg.author}
                            </p>
                          ) : null}
                          <p className="break-words">{msg.body}</p>
                          <p
                            className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-[var(--color-muted)]"}`}
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
                  })}
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-[var(--color-muted)]">
                        Start a conversation
                      </p>
                    </div>
                  ) : null}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-panel)]">
                  <div className="flex gap-3">
                    <input
                      value={chatInput}
                      onChange={(e) =>
                        setChatInput(e.target.value.slice(0, 500))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] min-w-0"
                    />
                    <button
                      type="button"
                      onClick={handleSendChat}
                      disabled={sendingChat || !chatInput.trim()}
                      aria-label="Send message"
                      title="Send message"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm transition hover:scale-[1.03] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className="bi bi-send-fill text-lg" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex h-full items-center justify-center">
                <div className="text-center">
                  <i className="bi bi-chat-dots text-4xl text-[var(--color-muted)]" />
                  <p className="mt-3 text-sm font-semibold text-[var(--color-muted)]">
                    Select a contact to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              Delete message?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold text-[var(--color-heading)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
