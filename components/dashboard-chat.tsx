"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ManagedUser, MessageItem, Role, SessionUser } from "@/lib/types";

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

export function ChatView({
  session,
  role,
  messages,
  onMessagesChange,
  managedUsers,
  studentDirectory,
  assignedFacultyIds,
  assignedFacultyNames,
}: ChatViewProps) {
  const [chatContactId, setChatContactId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const studentEducators = useMemo(() => {
    if (role !== "student" || !managedUsers || !assignedFacultyIds) return [];
    return managedUsers.filter(
      (u) => u.role === "educator" && assignedFacultyIds.includes(u.id)
    );
  }, [role, managedUsers, assignedFacultyIds]);

  const chatContacts = useMemo(() => {
    if (role === "admin") {
      const educators = (managedUsers ?? []).filter((u) => u.role === "educator");
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

  const sortedContacts = useMemo(() => {
    return [...chatContacts].sort((a, b) => {
      const aMsgs = messages.filter((m) => {
        if (m.channel !== "Chat") return false;
        const involvesMe = Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
        const involvesContact = Array.isArray(m.userIds) && m.userIds.includes(a.id);
        return involvesMe && involvesContact;
      });
      const bMsgs = messages.filter((m) => {
        if (m.channel !== "Chat") return false;
        const involvesMe = Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
        const involvesContact = Array.isArray(m.userIds) && m.userIds.includes(b.id);
        return involvesMe && involvesContact;
      });
      const aLatest = aMsgs.reduce((latest, m) => {
        const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
        return t > latest ? t : latest;
      }, 0);
      const bLatest = bMsgs.reduce((latest, m) => {
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
        const involvesUser = Array.isArray(m.userIds) && m.userIds.includes(session.id);
        const involvesContact = Array.isArray(m.userIds) && m.userIds.includes(contact.id);
        const isNew = m.createdAt ? new Date(m.createdAt).getTime() > lastRead : false;
        return involvesUser && involvesContact && isNew;
      }).length;
    }
    setUnreadCounts(counts);
  }, [messages, lastReadTimestamps, chatContacts, session]);

  const conversationMessages = useMemo(() => {
    if (!chatContactId || !session) return [];
    return messages.filter((m) => {
      if (m.channel !== "Chat") return false;
      const involvesMe = Array.isArray(m.userIds) && m.userIds.includes(session.id);
      const involvesContact = Array.isArray(m.userIds) && m.userIds.includes(chatContactId);
      return involvesMe && involvesContact;
    }).sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
  }, [messages, chatContactId, session]);

  const selectedContact = useMemo(() => {
    return chatContacts.find((c) => c.id === chatContactId) ?? null;
  }, [chatContacts, chatContactId]);

  const lastMessageForContact = (contactId: string): string | null => {
    const msgs = messages.filter((m) => {
      if (m.channel !== "Chat") return false;
      const involvesMe = Array.isArray(m.userIds) && m.userIds.includes(session?.id ?? "");
      const involvesContact = Array.isArray(m.userIds) && m.userIds.includes(contactId);
      return involvesMe && involvesContact;
    }).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    if (msgs.length === 0) return null;
    return msgs[0].body.length > 40 ? msgs[0].body.slice(0, 40) + "..." : msgs[0].body;
  };

  function handleSelectContact(contactId: string) {
    setChatContactId(contactId);
    setLastReadTimestamps((prev) => ({
      ...prev,
      [contactId]: Date.now(),
    }));
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
      if (!response.ok) return;
      const data = (await response.json()) as { message: MessageItem };
      onMessagesChange([data.message, ...messages]);
      setChatInput("");
    } finally {
      setSendingChat(false);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
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
                            isSelected ? "text-white" : "text-[var(--color-heading)]"
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
                            isSelected ? "text-white/70" : "text-[var(--color-muted)]"
                          }`}
                        >
                          {lastMsg}
                        </p>
                      ) : (
                        <p
                          className={`text-xs mt-0.5 italic ${
                            isSelected ? "text-white/50" : "text-[var(--color-muted)]"
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
                  <i className="bi bi-arrow-left" />
                </button>
                <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
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
                          style={{
                            maxWidth: "85%",
                          }}
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
                          <p className="break-words whitespace-pre-wrap">{msg.body}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? "text-[#64748b]" : "text-[var(--color-muted)]"
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
                <div className="flex gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value.slice(0, 500))}
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
                    className="shrink-0 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <i className="bi bi-send-fill" />
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
    </section>
  );
}
