"use client";

import { useEffect, useState } from "react";
import type { MessageItem, ChatFlag, ChatBlock, ManagedUser } from "@/lib/types";

type AdminChatMonitorProps = {
  managedUsers: ManagedUser[];
};

export function AdminChatMonitor({ managedUsers }: AdminChatMonitorProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [flags, setFlags] = useState<ChatFlag[]>([]);
  const [blocks, setBlocks] = useState<ChatBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"history" | "flags" | "blocks">("flags");
  const [selectedChat, setSelectedChat] = useState<MessageItem[] | null>(null);
  const [chatParticipants, setChatParticipants] = useState<{ user1: string; user2: string } | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/admin", {
        method: "GET",
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setFlags(data.flags || []);
        setBlocks(data.blocks || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function getUserName(id: string): string {
    const user = managedUsers.find((u) => u.id === id);
    return user?.name ?? id.slice(0, 8) + "...";
  }

  function getUserRole(id: string): string {
    const user = managedUsers.find((u) => u.id === id);
    return user?.role ?? "unknown";
  }

  function getChatKey(message: MessageItem): string {
    if (!message.userIds || message.userIds.length < 2) return message.id;
    const sorted = [...message.userIds].sort();
    return sorted.join(":");
  }

  function groupMessagesByChat(): Map<string, MessageItem[]> {
    const groups = new Map<string, MessageItem[]>();
    for (const msg of messages) {
      const key = getChatKey(msg);
      const existing = groups.get(key) || [];
      existing.push(msg);
      groups.set(key, existing);
    }
    return groups;
  }

  function viewChat(messages: MessageItem[]) {
    setSelectedChat(messages);
    if (messages[0]?.userIds && messages[0].userIds.length >= 2) {
      const sorted = [...messages[0].userIds].sort();
      setChatParticipants({ user1: sorted[0], user2: sorted[1] });
    } else {
      setChatParticipants(null);
    }
  }

  async function handleResolveFlag(flagId: string, status: "allowed" | "blocked") {
    try {
      const res = await fetch("/api/chat/flag", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, status }),
      });
      if (res.ok) {
        setActionMsg(`Flag ${status === "allowed" ? "approved" : "blocked"}.`);
        loadData();
      }
    } catch {
      setActionMsg("Failed to update flag.");
    }
  }

  async function handleBlockChat(participantIds: string[], action: "block" | "unblock", reason?: string) {
    try {
      const res = await fetch("/api/chat/block", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds, action, reason }),
      });
      if (res.ok) {
        setActionMsg(`Chat ${action === "block" ? "blocked" : "unblocked"}.`);
        loadData();
      }
    } catch {
      setActionMsg("Failed to update block status.");
    }
  }

  const chatGroups = groupMessagesByChat();

  function renderMessageBody(body: string) {
    const fileMatch = body.match(/^\[File: (.+?)\] (.+)$/);
    if (fileMatch) {
      const [, fileName, fileUrl] = fileMatch;
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fileName);
      const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(fileName);
      return (
        <div>
          {isImage ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={fileUrl} alt={fileName} className="max-w-[200px] rounded-lg mt-1 cursor-pointer hover:opacity-90" loading="lazy" />
            </a>
          ) : isVideo ? (
            <video src={fileUrl} controls className="max-w-[250px] rounded-lg mt-1" preload="metadata" />
          ) : (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)]/10 px-3 py-2 mt-1 text-sm font-medium text-[var(--color-primary)] hover:underline">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{fileName}</span>
            </a>
          )}
        </div>
      );
    }
    return <p className="text-sm text-[var(--color-heading)] whitespace-pre-wrap break-words">{body}</p>;
  }

  const q = searchQuery.toLowerCase();
  const filteredFlags = q
    ? flags.filter((f) => {
        const sender = getUserName(f.senderId).toLowerCase();
        const receiver = getUserName(f.receiverId).toLowerCase();
        const msg = messages.find((m) => m.id === f.messageId);
        const body = msg?.body?.toLowerCase() ?? "";
        return sender.includes(q) || receiver.includes(q) || f.reason?.toLowerCase().includes(q) || f.reasonDetail?.toLowerCase().includes(q) || body.includes(q);
      })
    : flags;
  const filteredChatGroups = q
    ? new Map(Array.from(chatGroups.entries()).filter(([_, msgs]) => {
        const ids = msgs[0]?.userIds ?? [];
        return ids.some((id) => getUserName(id).toLowerCase().includes(q));
      }))
    : chatGroups;
  const filteredBlocks = q
    ? blocks.filter((b) => {
        return b.participantIds.some((id) => getUserName(id).toLowerCase().includes(q)) || b.reason?.toLowerCase().includes(q);
      })
    : blocks;

  return (
    <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-5 text-white"
        style={{
          background: "linear-gradient(135deg, #1E1B4B, var(--color-primary), #6D28D9)",
        }}
      >
        <p className="text-sm font-medium text-white/60">Admin Console</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Chat Monitor</h1>
      </div>

      {/* Action message */}
      {actionMsg ? (
        <div className="mx-6 mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          {actionMsg}
          <button type="button" onClick={() => setActionMsg("")} className="float-right text-emerald-500 hover:text-emerald-700">&times;</button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] px-6">
        {(["flags", "history", "blocks"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setSelectedTab(tab); setSelectedChat(null); }}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              selectedTab === tab
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-heading)]"
            }`}
          >
            {tab === "flags" ? `Flags (${flags.filter(f => f.status === "pending").length})` : tab === "history" ? "Chat History" : `Blocks (${blocks.length})`}
          </button>
        ))}
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="ml-auto px-4 py-3 text-xs font-bold text-[var(--color-primary)] hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm">
          <svg className="h-4 w-4 shrink-0 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, message, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[var(--color-heading)] placeholder-[var(--color-muted)] outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="text-[var(--color-muted)] hover:text-[var(--color-heading)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          <p className="mt-3 text-sm text-[var(--color-muted)]">Loading chat data...</p>
        </div>
      ) : selectedChat ? (
        /* Chat detail view */
        <div>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
            <button
              type="button"
              onClick={() => setSelectedChat(null)}
              className="flex items-center gap-1 text-sm font-bold text-[var(--color-primary)] hover:opacity-80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {chatParticipants ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-[var(--color-heading)]">{getUserName(chatParticipants.user1)}</span>
                <span className="text-[var(--color-muted)]">( {getUserRole(chatParticipants.user1)} )</span>
                <span className="text-[var(--color-muted)]">&harr;</span>
                <span className="font-bold text-[var(--color-heading)]">{getUserName(chatParticipants.user2)}</span>
                <span className="text-[var(--color-muted)]">( {getUserRole(chatParticipants.user2)} )</span>
              </div>
            ) : null}
            {chatParticipants ? (
              <div className="ml-auto flex gap-2">
                {blocks.find((b) => {
                  const sorted = [chatParticipants.user1, chatParticipants.user2].sort();
                  return b.participantIds[0] === sorted[0] && b.participantIds[1] === sorted[1] && b.blocked;
                }) ? (
                  <button
                    type="button"
                    onClick={() => handleBlockChat([chatParticipants.user1, chatParticipants.user2], "unblock")}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                  >
                    Unblock Chat
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBlockChat([chatParticipants.user1, chatParticipants.user2], "block", "Violation of chat policy")}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                  >
                    Block Chat
                  </button>
                )}
              </div>
            ) : null}
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {selectedChat.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-muted)]">No messages in this conversation.</p>
            ) : (
              [...selectedChat].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()).map((msg) => (
                <div key={msg.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[var(--color-primary)]">{msg.author || "Unknown"}</span>
                    <span className="text-[10px] text-[var(--color-muted)]">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  {renderMessageBody(msg.body)}
                  {flags.filter(f => f.messageId === msg.id).length > 0 ? (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Flagged</span>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : selectedTab === "flags" ? (
        <div className="p-6">
          {filteredFlags.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-muted)] py-8">{searchQuery ? "No flagged messages match your search." : "No flagged messages."}</p>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag) => {
                const flaggedMsg = messages.find((m) => m.id === flag.messageId);
                return (
                  <div key={flag.id} className={`rounded-xl border px-4 py-4 ${
                    flag.status === "pending"
                      ? "border-amber-200 bg-amber-50/50"
                      : flag.status === "allowed"
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            flag.status === "pending" ? "bg-amber-100 text-amber-700" :
                            flag.status === "allowed" ? "bg-emerald-100 text-emerald-700" :
                            "bg-red-100 text-red-700"
                          }`}>{flag.status}</span>
                          <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary)]">{flag.reason}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[var(--color-heading)]">
                          {getUserName(flag.senderId)} &rarr; {getUserName(flag.receiverId)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{flag.reasonDetail}</p>
                        {flaggedMsg ? (
                          <p className="mt-2 text-xs text-[var(--color-muted)] bg-white rounded-lg px-3 py-2 border border-[var(--color-border)]">
                            &ldquo;{flaggedMsg.body.slice(0, 150)}{flaggedMsg.body.length > 150 ? "..." : ""}&rdquo;
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                          {new Date(flag.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {flag.status === "pending" ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleResolveFlag(flag.id, "allowed")}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                          >
                            Allow
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveFlag(flag.id, "blocked")}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
                          >
                            Block
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : selectedTab === "history" ? (
        <div className="p-6">
          {filteredChatGroups.size === 0 ? (
            <p className="text-center text-sm text-[var(--color-muted)] py-8">{searchQuery ? "No chats match your search." : "No chat history."}</p>
          ) : (
            <div className="grid gap-3">
              {Array.from(filteredChatGroups.entries()).map(([key, msgs]) => {
                const sortedMsgs = [...msgs].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
                const lastMsg = sortedMsgs[0];
                const participantIds = lastMsg?.userIds ?? [];
                const p1 = participantIds[0] ?? "";
                const p2 = participantIds[1] ?? "";
                const isBlocked = blocks.some((b) => {
                  const sorted = [p1, p2].sort();
                  return b.participantIds[0] === sorted[0] && b.participantIds[1] === sorted[1] && b.blocked;
                });
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => viewChat(msgs)}
                    className="w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 hover:bg-[var(--color-card)] transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-heading)]">
                        <span>{getUserName(p1)}</span>
                        <span className="text-[var(--color-muted)] font-normal">&harr;</span>
                        <span>{getUserName(p2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isBlocked ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">Blocked</span>
                        ) : null}
                        <span className="text-[10px] text-[var(--color-muted)]">{msgs.length} msgs</span>
                        <svg className="h-4 w-4 text-[var(--color-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-muted)] truncate">
                      {lastMsg?.body ? lastMsg.body.replace(/^\[File: (.+?)\] .+$/, "[File: $1]").slice(0, 80) : "No messages"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                      {lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleString() : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Blocks tab */
        <div className="p-6">
          {filteredBlocks.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-muted)] py-8">{searchQuery ? "No blocked chats match your search." : "No blocked chats."}</p>
          ) : (
            <div className="space-y-3">
              {filteredBlocks.map((block) => (
                <div key={block.id} className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-heading)]">
                        {getUserName(block.participantIds[0])} &harr; {getUserName(block.participantIds[1])}
                      </p>
                      {block.reason ? (
                        <p className="mt-1 text-xs text-[var(--color-muted)]">Reason: {block.reason}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                        Blocked on {block.blockedAt ? new Date(block.blockedAt).toLocaleString() : ""}
                        {block.blockedBy ? ` by ${getUserName(block.blockedBy)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBlockChat(block.participantIds, "unblock")}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
