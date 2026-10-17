"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  Megaphone,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

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

type ViewMode = "board" | "chat";

type NoticeFilter =
  | "All Notices"
  | "Academic Update"
  | "Student Notice"
  | "Results"
  | "Admin Board"
  | "Other";

const NOTICE_FILTERS: NoticeFilter[] = [
  "All Notices",
  "Academic Update",
  "Student Notice",
  "Results",
  "Admin Board",
  "Other",
];

function formatNoticeDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNoticeTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isRecentNotice(value?: string | null) {
  if (!value) return false;

  const created = new Date(value).getTime();

  if (!Number.isFinite(created)) return false;

  const age = Date.now() - created;

  return age >= 0 && age <= 24 * 60 * 60 * 1000;
}

function noticeCategory(channel: string): NoticeFilter {
  if (
    channel === "Academic Update" ||
    channel === "Student Notice" ||
    channel === "Results" ||
    channel === "Admin Board"
  ) {
    return channel;
  }

  return "Other";
}

function noticeTheme(channel: string) {
  const name = channel.toLowerCase();

  if (name.includes("academic")) {
    return {
      icon: BookOpen,
      iconBackground: "bg-blue-50",
      iconColor: "text-blue-600",
      badge: "bg-blue-50 text-blue-700",
    };
  }

  if (name.includes("result")) {
    return {
      icon: GraduationCap,
      iconBackground: "bg-emerald-50",
      iconColor: "text-emerald-600",
      badge: "bg-emerald-50 text-emerald-700",
    };
  }

  if (name.includes("admin")) {
    return {
      icon: Megaphone,
      iconBackground: "bg-violet-50",
      iconColor: "text-violet-600",
      badge: "bg-violet-50 text-violet-700",
    };
  }

  return {
    icon: FileText,
    iconBackground: "bg-sky-50",
    iconColor: "text-sky-600",
    badge: "bg-sky-50 text-sky-700",
  };
}

/* CLASS ANNOUNCEMENT PARSER */

function parseClassAnnouncement(body: string) {
  if (!/a new class has been scheduled/i.test(body)) {
    return null;
  }

  const fieldPattern =
    /\b(Title|Subject|Faculty|Date\s*&\s*Time|Homework)\s*:/gi;

  const matches = Array.from(body.matchAll(fieldPattern));

  if (!matches.length) return null;

  const fields: Record<string, string> = {};

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;

    const end =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? body.length)
        : body.length;

    const key = match[1].toLowerCase().replace(/\s+/g, "");

    fields[key] = body.slice(start, end).trim();
  });

  const dateTime = fields["date&time"] ?? "";

  const timeMatch = dateTime.match(/(\d{1,2}:\d{2}\s*(?:am|pm))$/i);

  const time = timeMatch?.[1]?.trim() ?? "";

  const date = timeMatch
    ? dateTime.slice(0, timeMatch.index).replace(/,\s*$/, "").trim()
    : dateTime.trim();

  return {
    title: fields.title ?? "",
    subject: fields.subject ?? "",
    faculty: fields.faculty ?? "",
    date,
    time,
    homework: fields.homework ?? "",
  };
}

/* DATE AND WEEKDAY */

function classDateDetails(dateText: string) {
  const match = dateText.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);

  if (!match) {
    return {
      dateLabel: dateText,
      weekday: "",
    };
  }

  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  const month = months[match[2].toLowerCase()];

  if (month === undefined) {
    return {
      dateLabel: dateText,
      weekday: "",
    };
  }

  const day = Number(match[1]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return {
      dateLabel: dateText,
      weekday: "",
    };
  }

  return {
    dateLabel: dateText,
    weekday: date.toLocaleDateString("en-GB", {
      weekday: "long",
      timeZone: "UTC",
    }),
  };
}

function formatClassName(value: string) {
  const clean = value.replace(/^New Class:\s*/i, "").trim();

  if (!clean) return "Class";

  const names: Record<string, string> = {
    maths: "Mathematics",
    math: "Mathematics",
    mathematics: "Mathematics",
    english: "English",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    science: "Science",
    reasoning: "Reasoning",
  };

  return (
    names[clean.toLowerCase()] ??
    clean.replace(/^./, (character) => character.toUpperCase())
  );
}

export function DashboardMessageCenter({
  session,
  role,
  messages,
  studentDirectory,
  onMessagesChange,
  managedUsers,
  assignedFacultyIds,
  assignedFacultyNames: _assignedFacultyNames,
}: DashboardMessageCenterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("board");

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

  const [noticeSearch, setNoticeSearch] = useState("");

  const [noticeFilter, setNoticeFilter] = useState<NoticeFilter>("All Notices");

  const [studentRecipient, setStudentRecipient] = useState<"faculty" | "admin">(
    "faculty",
  );

  const [educatorRecipient, setEducatorRecipient] = useState<
    "admin" | "students" | "selected-students"
  >("admin");

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

  const canPost =
    role === "student" ||
    role === "educator" ||
    role === "admin" ||
    role === "staff" ||
    role === "counsellor";

  const canPostToEveryone =
    role === "admin" || role === "staff" || role === "counsellor";

  function canManageMessage(message: MessageItem) {
    if (!session) return false;

    if (role === "admin") return true;

    return (
      Boolean(session.name) &&
      Boolean(message.author) &&
      session.name.trim() === (message.author ?? "").trim()
    );
  }

  /* DIRECT CHAT CONTACTS */

  const studentEducators = useMemo(() => {
    if (role !== "student" || !managedUsers || !assignedFacultyIds) {
      return [];
    }

    return managedUsers.filter(
      (user) =>
        user.role === "educator" && assignedFacultyIds.includes(user.id),
    );
  }, [role, managedUsers, assignedFacultyIds]);

  const adminUsers = useMemo(() => {
    return (managedUsers ?? []).filter((user) => user.role === "admin");
  }, [managedUsers]);

  const chatContacts = useMemo(() => {
    if (role === "admin") {
      const educators = (managedUsers ?? []).filter(
        (user) => user.role === "educator",
      );

      const students = studentDirectory.filter(
        (user) => user.role === "student",
      );

      return [...educators, ...students];
    }

    if (role === "educator") {
      const admins = (managedUsers ?? []).filter(
        (user) => user.role === "admin",
      );

      const students = studentDirectory.filter(
        (user) =>
          user.role === "student" &&
          (user.assignedFacultyIds ?? []).includes(session?.id ?? ""),
      );

      return [...admins, ...students];
    }

    if (role === "student") {
      const admins = (managedUsers ?? []).filter(
        (user) => user.role === "admin",
      );

      return [...admins, ...studentEducators];
    }

    return [];
  }, [role, managedUsers, studentDirectory, studentEducators, session?.id]);

  useEffect(() => {
    if (!chatContactId && chatContacts.length > 0) {
      const adminContact = chatContacts.find(
        (contact) => contact.role === "admin",
      );

      setChatContactId(adminContact?.id ?? chatContacts[0].id);
    }
  }, [chatContacts, chatContactId]);

  useEffect(() => {
    if (viewMode === "chat") {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, chatContactId, viewMode]);

  const chatMessages = useMemo(() => {
    if (!chatContactId || !session) return [];

    const contactName =
      chatContacts.find((contact) => contact.id === chatContactId)?.name ?? "";

    return messages
      .filter((message) => {
        const isFromContact = message.author === contactName;

        const isToContact =
          Array.isArray(message.userIds) &&
          message.userIds.includes(chatContactId);

        const isFromMe = message.author === session.name;

        return (
          message.channel === "Chat" &&
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

  /* NOTICE DATA */

  const boardMessages = useMemo(() => {
    return messages
      .filter((message) => message.channel !== "Chat")
      .sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      );
  }, [messages]);

  const filteredNotices = useMemo(() => {
    const query = noticeSearch.trim().toLowerCase();

    return boardMessages.filter((message) => {
      const categoryMatches =
        noticeFilter === "All Notices" ||
        noticeCategory(message.channel) === noticeFilter;

      if (!categoryMatches) return false;

      if (!query) return true;

      return [
        message.title,
        message.body,
        message.channel,
        message.author ?? "",
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [boardMessages, noticeSearch, noticeFilter]);

  /* PUBLISH */

  function buildExpiryIso() {
    if (expiryPreset === "never") return null;

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

  function buildAudienceAndUserIds() {
    if (role === "staff" || role === "counsellor") {
      return {
        audience: ["student"] as const,
        userIds:
          targetMode === "selected-students" ? selectedStudentIds : undefined,
      };
    }

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
          userIds: adminUsers.map((user) => user.id),
        };
      }

      if (educatorRecipient === "selected-students") {
        return {
          audience: ["student"] as const,
          userIds: selectedStudentIds,
        };
      }

      return {
        audience: ["student"] as const,
        userIds: studentDirectory
          .filter((student) =>
            (student.assignedFacultyIds ?? []).includes(session?.id ?? ""),
          )
          .map((student) => student.id),
      };
    }

    if (role === "student") {
      if (studentRecipient === "admin") {
        return {
          audience: ["admin"] as const,
          userIds: adminUsers.map((user) => user.id),
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
    if (!session || !canPost) return;

    if (!title.trim() || !body.trim()) {
      setStatus("Please enter a title and message.");
      return;
    }

    const { audience, userIds } = buildAudienceAndUserIds();

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          channel,
          audience,
          userIds,
          expiresAt: buildExpiryIso(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };

        setStatus(payload.error ?? "Message could not be published.");

        return;
      }

      const data = (await response.json()) as {
        message: MessageItem;
      };

      onMessagesChange([data.message, ...messages]);

      setTitle("");
      setBody("");
      setSelectedStudentIds([]);
      setExpiryPreset("7d");

      setStatus("Message board updated.");
    } catch {
      setStatus("Unable to publish message. Please try again.");
    }
  }

  /* DIRECT CHAT SEND */

  async function handleSendChat() {
    if (!chatInput.trim() || !chatContactId || !session || sendingChat) {
      return;
    }

    setSendingChat(true);
    setStatus("");

    try {
      const targetUser = chatContacts.find(
        (contact) => contact.id === chatContactId,
      );

      if (!targetUser) return;

      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: chatContactId,
          receiverRole: targetUser.role,
          body: chatInput.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };

        setStatus(payload.error ?? "Message could not be sent.");

        return;
      }

      const data = (await response.json()) as {
        message: MessageItem;
      };

      onMessagesChange([data.message, ...messages]);

      setChatInput("");
      setStatus("");
    } catch {
      setStatus("Unable to send message. Please try again.");
    } finally {
      setSendingChat(false);
    }
  }

  /* EDIT MESSAGE */

  function startEdit(message: MessageItem) {
    if (!canManageMessage(message)) return;

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
    const original = messages.find((message) => message.id === messageId);

    if (!original || !canManageMessage(original)) {
      setStatus("You cannot edit this message.");
      return;
    }

    if (!editTitle.trim() || !editBody.trim() || !editChannel.trim()) {
      setStatus("Title, body, and channel are required.");
      return;
    }

    try {
      const response = await fetch(
        `/api/messages/${encodeURIComponent(messageId)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            body: editBody.trim(),
            channel: editChannel,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };

        setStatus(payload.error ?? "Message could not be updated.");

        return;
      }

      const data = (await response.json()) as {
        message: MessageItem;
      };

      onMessagesChange(
        messages.map((message) =>
          message.id === messageId ? data.message : message,
        ),
      );

      cancelEdit();
      setStatus("Message updated.");
    } catch {
      setStatus("Unable to update message. Please try again.");
    }
  }

  /* DELETE MESSAGE */

  async function handleDelete(messageId: string) {
    const target = messages.find((message) => message.id === messageId);

    if (!target || !canManageMessage(target)) {
      setDeleteConfirmId(null);
      setStatus("You cannot delete this message.");
      return;
    }

    if (deletingId) return;

    setDeletingId(messageId);

    try {
      const response = await fetch(
        `/api/messages/${encodeURIComponent(messageId)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        const payload = (await response.json()) as {
          error?: string;
        };

        setStatus(payload.error ?? "Message could not be deleted.");

        setDeleteConfirmId(null);
        return;
      }

      onMessagesChange(messages.filter((message) => message.id !== messageId));

      setDeleteConfirmId(null);
      setStatus("Message deleted.");
    } catch {
      setStatus("Unable to delete message. Please try again.");
      setDeleteConfirmId(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
      {/* MAIN HEADER */}

      <div
        className="px-5 py-5 text-white sm:px-7 sm:py-6"
        style={{
          background:
            "linear-gradient(115deg, #1E1B4B 0%, #4338CA 52%, #6D28D9 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-white/75">Communications</p>


            <p className="mt-1.5 text-xs text-white/65">
              {viewMode === "board"
                ? "Stay informed with your latest institute updates."
                : "Stay connected with your institute."}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS MESSAGE */}

      {status && (
        <div
          role="status"
          className="mx-5 mt-4 flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-[#0A54B7] sm:mx-7"
        >
          <span>{status}</span>

          <button
            type="button"
            onClick={() => setStatus("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* NOTICE BOARD */}

      {viewMode === "board" ? (
        <div className="min-w-0 bg-[#F6F8FC] p-4 sm:p-6">
          {/* SEARCH HEADER */}

          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A54B7]">
                  <Megaphone size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#0A193A]">
                    Latest Announcements
                  </h2>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Notices, class schedules and institute updates
                  </p>
                </div>
              </div>

              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-[#0A54B7]">
                {boardMessages.length} Notices
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  aria-label="Search announcements"
                  value={noticeSearch}
                  onChange={(event) => setNoticeSearch(event.target.value)}
                  placeholder="Search notices, subjects or faculty..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-[#0A193A] outline-none focus:border-[#0A54B7]"
                />
              </div>

              <select
                aria-label="Filter notices by category"
                value={noticeFilter}
                onChange={(event) =>
                  setNoticeFilter(event.target.value as NoticeFilter)
                }
                className="h-10 min-w-[155px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0A193A] outline-none focus:border-[#0A54B7]"
              >
                {NOTICE_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ANNOUNCEMENT GRID */}

          {filteredNotices.length > 0 ? (
            <div className="mb-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredNotices.map((message) => {
                const theme = noticeTheme(message.channel);
                const NoticeIcon = theme.icon;

                const canManage = canManageMessage(message);
                const editing = editingId === message.id;

                const isNew = isRecentNotice(message.createdAt);

                const classDetails = parseClassAnnouncement(message.body);

                const classDate = classDetails
                  ? classDateDetails(classDetails.date)
                  : null;

                const className = classDetails
                  ? formatClassName(classDetails.title || message.title)
                  : "";

                return (
                  <article
                    key={message.id}
                    className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#C9D6E9] bg-white text-[#101B4C] transition-colors hover:border-[#9CB5DE]"
                  >
                    {editing ? (
                      /* EDIT FORM */

                      <div className="grid gap-3 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A54B7]">
                          <Pencil size={15} />
                          Edit Announcement
                        </div>

                        <input
                          value={editTitle}
                          onChange={(event) =>
                            setEditTitle(event.target.value.slice(0, 80))
                          }
                          placeholder="Title"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                        />

                        <textarea
                          value={editBody}
                          onChange={(event) =>
                            setEditBody(event.target.value.slice(0, 280))
                          }
                          rows={4}
                          placeholder="Announcement details"
                          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                        />

                        <select
                          value={editChannel}
                          onChange={(event) =>
                            setEditChannel(event.target.value)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                        >
                          <option value="Student Notice">Student Notice</option>
                          <option value="Academic Update">
                            Academic Update
                          </option>
                          <option value="Results">Results</option>
                          <option value="Admin Board">Admin Board</option>
                        </select>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void handleEdit(message.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A54B7] px-4 py-2 text-xs font-bold text-white"
                          >
                            <Check size={14} />
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : classDetails ? (
                      /* CLASS ANNOUNCEMENT:
                         EXACT LECTURE UPDATES CARD STYLE */

                      <>
                        {/* DATE HEADER */}

                        <div className="flex items-center justify-between gap-3 border-b border-[#DCE5F2] px-5 py-3">
                          <h3 className="text-[17px] font-extrabold text-[#0757EA]">
                            {classDate?.dateLabel || "Date not specified"}
                          </h3>

                          <span className="text-[12px] font-medium text-[#64789F]">
                            {classDate?.weekday}
                          </span>
                        </div>

                        {/* CLASS AND TOPIC */}

                        <div className="flex flex-1 flex-col px-5 py-3">
                          <h4 className="text-[19px] font-extrabold leading-6 text-[#101548]">
                            {className}
                          </h4>

                          <p className="mt-1 text-[15px] font-medium text-[#536A98]">
                            {classDetails.subject || "Topic not specified"}
                          </p>

                          {/* FACULTY AND TIME */}

                          <div className="mt-auto grid grid-cols-2 border-t border-[#DCE5F2] pt-3 [margin-top:14px]">
                            <div className="min-w-0 border-r border-[#C9D6E9] pr-3">
                              <p className="text-[12px] text-[#64789F]">
                                Faculty
                              </p>

                              <p className="mt-1 break-words text-[13px] font-semibold text-[#101548]">
                                {classDetails.faculty || "Not assigned"}
                              </p>
                            </div>

                            <div className="min-w-0 pl-4">
                              <p className="text-[12px] text-[#64789F]">Time</p>

                              <p className="mt-1 break-words text-[13px] font-semibold text-[#101548]">
                                {classDetails.time || "Not specified"}
                              </p>
                            </div>
                          </div>

                          {/* OPTIONAL HOMEWORK */}

                          {classDetails.homework && (
                            <div className="mt-3 border-t border-[#DCE5F2] pt-2">
                              <p className="text-[11px] text-[#64789F]">
                                Homework
                              </p>

                              <p className="mt-1 break-words text-xs text-[#101548]">
                                {classDetails.homework}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* MANAGEMENT ACTIONS:
                            NOT SHOWN TO NORMAL STUDENTS */}

                        {canManage && (
                          <div className="flex items-center gap-2 border-t border-[#DCE5F2] px-5 py-2.5">
                            <button
                              type="button"
                              onClick={() => startEdit(message)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-blue-50"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(message.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      /* NORMAL ANNOUNCEMENTS */

                      <div className="flex h-full flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBackground} ${theme.iconColor}`}
                          >
                            <NoticeIcon size={19} strokeWidth={1.9} />
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {isNew && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                New
                              </span>
                            )}

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${theme.badge}`}
                            >
                              {message.channel}
                            </span>
                          </div>
                        </div>

                        <h3 className="mt-4 break-words text-[16px] font-bold text-[#0A193A]">
                          {message.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
                          {message.author && (
                            <span className="inline-flex items-center gap-1.5">
                              <UserRound size={13} />
                              {message.author}
                            </span>
                          )}

                          {message.createdAt && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={13} />
                              {formatNoticeDate(message.createdAt)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex-1">
                          <p className="whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-600">
                            {message.body}
                          </p>
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              {message.createdAt &&
                                formatNoticeTime(message.createdAt)}

                              {!isStudentOrParent && (
                                <span>
                                  {message.expiresAt
                                    ? `Expires ${formatNoticeDate(
                                        message.expiresAt,
                                      )}`
                                    : "No expiry"}
                                </span>
                              )}
                            </div>

                            {canManage && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEdit(message)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"
                                >
                                  <Pencil size={12} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(message.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-600"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 flex min-h-48 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
              <Megaphone size={24} className="text-[#0A54B7]" />

              <h3 className="mt-4 text-sm font-bold text-[#0A193A]">
                No announcements found
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {noticeSearch || noticeFilter !== "All Notices"
                  ? "Try another search or category."
                  : "New announcements will appear here."}
              </p>

              {(noticeSearch || noticeFilter !== "All Notices") && (
                <button
                  type="button"
                  onClick={() => {
                    setNoticeSearch("");
                    setNoticeFilter("All Notices");
                  }}
                  className="mt-4 text-xs font-bold text-[#0A54B7]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* COMPOSE MESSAGE */}

          {canPost && session && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A54B7]">
                  <FileText size={19} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0A193A]">
                    {composeLabel}
                  </h3>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {role === "student"
                      ? "Send a message or application to your faculty or administration."
                      : "Publish a message to the relevant recipients."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value.slice(0, 80))
                  }
                  placeholder="Message title"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0A54B7]"
                />

                <textarea
                  value={body}
                  onChange={(event) =>
                    setBody(event.target.value.slice(0, 280))
                  }
                  placeholder={
                    role === "student"
                      ? "Write your message..."
                      : "Write update for student or faculty boards"
                  }
                  rows={4}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0A54B7]"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="Student Notice">Student Notice</option>
                    <option value="Academic Update">Academic Update</option>
                    <option value="Results">Results</option>
                    <option value="Admin Board">Admin Board</option>
                  </select>

                  {canPostToEveryone ? (
                    <select
                      value={targetMode}
                      onChange={(event) =>
                        setTargetMode(
                          event.target.value as
                            | "everyone"
                            | "selected-students",
                        )
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="everyone">Send to everyone</option>
                      <option value="selected-students">
                        Send to selected students
                      </option>
                    </select>
                  ) : role === "educator" ? (
                    <select
                      value={educatorRecipient}
                      onChange={(event) =>
                        setEducatorRecipient(
                          event.target.value as
                            | "admin"
                            | "students"
                            | "selected-students",
                        )
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
                      onChange={(event) =>
                        setStudentRecipient(
                          event.target.value as "faculty" | "admin",
                        )
                      }
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <option value="faculty">Send to my faculty</option>
                      <option value="admin">Send to Admin</option>
                    </select>
                  ) : null}
                </div>

                {((canPostToEveryone && targetMode === "selected-students") ||
                  (role === "educator" &&
                    educatorRecipient === "selected-students")) && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="mb-3 text-xs font-bold text-slate-500">
                      Target registered students
                    </p>

                    <div className="max-h-40 space-y-2 overflow-y-auto">
                      {studentDirectory.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-blue-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={(event) =>
                              setSelectedStudentIds((current) =>
                                event.target.checked
                                  ? [...current, student.id]
                                  : current.filter((id) => id !== student.id),
                              )
                            }
                            className="h-4 w-4 accent-[#0A54B7]"
                          />

                          <span className="text-sm text-[#0A193A]">
                            {student.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
                    <p className="text-[11px] font-bold text-slate-500">
                      Expiry
                    </p>

                    <select
                      value={expiryPreset}
                      onChange={(event) =>
                        setExpiryPreset(
                          event.target.value as "24h" | "7d" | "30d" | "never",
                        )
                      }
                      className="mt-1 w-full bg-transparent text-sm outline-none"
                    >
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="never">No expiry</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
                    <p className="text-[11px] font-bold text-slate-500">
                      Format
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Title, channel, audience, expiry and delivery scope.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={!title.trim() || !body.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A54B7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#084899] disabled:opacity-50"
                >
                  <Send size={16} />
                  Publish Message to Board
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DIRECT CHAT */

        <div className="flex h-[600px] flex-col lg:flex-row">
          {/* CONTACTS */}

          <div
            className={`flex w-full shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)] lg:w-64 ${
              chatContactId ? "hidden lg:flex" : ""
            }`}
          >
            <div className="border-b border-[var(--color-border)] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Contacts
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
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
                    className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition ${
                      chatContactId === contact.id
                        ? "border-[#0A54B7] bg-blue-50"
                        : "border-transparent hover:bg-white"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0A54B7]">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--color-heading)]">
                        {contact.name}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold capitalize text-[var(--color-muted)]">
                          {contact.role}
                        </span>

                        {isAdmin && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                            Admin
                          </span>
                        )}

                        {isAssignedFaculty && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                            My Faculty
                          </span>
                        )}
                      </div>
                    </div>

                    {chatContactId === contact.id && (
                      <ChevronRight size={15} className="text-[#0A54B7]" />
                    )}
                  </button>
                );
              })}

              {chatContacts.length === 0 && (
                <p className="p-4 text-xs text-[var(--color-muted)]">
                  No contacts available.
                </p>
              )}
            </div>
          </div>

          {/* CHAT WINDOW */}

          <div
            className={`flex min-w-0 flex-1 flex-col bg-[var(--color-card)] ${
              !chatContactId ? "hidden lg:flex" : ""
            }`}
          >
            {chatContactId ? (
              <>
                <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 lg:px-5">
                  <button
                    type="button"
                    onClick={() => setChatContactId(null)}
                    aria-label="Back to contacts"
                    className="mr-1 lg:hidden"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0A54B7]">
                    {chatContacts
                      .find((contact) => contact.id === chatContactId)
                      ?.name.charAt(0)
                      .toUpperCase() ?? "?"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--color-heading)]">
                      {chatContacts.find(
                        (contact) => contact.id === chatContactId,
                      )?.name ?? "Unknown"}
                    </p>

                    <p className="text-[10px] font-semibold capitalize text-[var(--color-muted)]">
                      {chatContacts.find(
                        (contact) => contact.id === chatContactId,
                      )?.role ?? ""}
                    </p>
                  </div>
                </div>

                {/* MESSAGES */}

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {chatMessages.map((message) => {
                    const isMine = message.author === session?.name;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed lg:max-w-[75%] ${
                            isMine
                              ? "rounded-br-md bg-[#0A54B7] text-white"
                              : "rounded-bl-md border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-heading)]"
                          }`}
                        >
                          {!isMine && message.author && (
                            <p className="mb-1 text-[10px] font-bold opacity-70">
                              {message.author}
                            </p>
                          )}

                          <p className="break-words">{message.body}</p>

                          <p
                            className={`mt-1 text-[10px] ${
                              isMine
                                ? "text-white/60"
                                : "text-[var(--color-muted)]"
                            }`}
                          >
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {chatMessages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <MessageCircle size={30} className="text-slate-300" />

                      <p className="mt-3 text-sm text-[var(--color-muted)]">
                        Start a conversation
                      </p>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* SEND CHAT */}

                <div className="border-t border-[var(--color-border)] bg-[var(--color-panel)] p-4">
                  <div className="flex gap-3">
                    <input
                      value={chatInput}
                      onChange={(event) =>
                        setChatInput(event.target.value.slice(0, 500))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSendChat();
                        }
                      }}
                      placeholder="Type a message..."
                      className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none focus:border-[#0A54B7]"
                    />

                    <button
                      type="button"
                      onClick={() => void handleSendChat()}
                      disabled={sendingChat || !chatInput.trim()}
                      aria-label="Send message"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0A54B7] text-white disabled:opacity-40"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden h-full flex-col items-center justify-center lg:flex">
                <MessageCircle size={40} className="text-slate-300" />

                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  Select a contact to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-message-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertCircle size={22} />
            </div>

            <h3
              id="delete-message-title"
              className="mt-4 text-lg font-black text-[#0A193A]"
            >
              Delete message?
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete(deleteConfirmId)}
                disabled={Boolean(deletingId)}
                className="flex-1 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {deletingId ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
