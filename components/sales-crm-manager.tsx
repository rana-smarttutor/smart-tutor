"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type {
  CrmDashboardSummary,
  CrmLead,
  CrmLeadInterest,
  CrmLeadPriority,
  CrmLeadSource,
  CrmLeadStatus,
  CrmStaff,
  CrmStaffDesignation,
} from "@/lib/crm-types";

type CrmWorkspace = {
  leads: CrmLead[];
  staff: CrmStaff[];
  summary: CrmDashboardSummary;
};

type CrmTab =
  | "overview"
  | "leads"
  | "pipeline"
  | "follow-ups"
  | "reports"
  | "staff";

type LeadDraft = {
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  courseInterested: string;
  branch: string;
  source: CrmLeadSource;
  priority: CrmLeadPriority;
  interest: CrmLeadInterest;
  status: CrmLeadStatus;
  assignedStaffId: string;
  nextFollowUpAt: string;
};

const STATUS_ORDER: CrmLeadStatus[] = [
  "new",
  "contacted",
  "follow-up",
  "counselling",
  "demo-scheduled",
  "admission-pending",
  "admitted",
  "lost",
];

const STATUS_LABELS: Record<CrmLeadStatus, string> = {
  new: "New Lead",
  contacted: "Contacted",
  "follow-up": "Follow-up",
  counselling: "Counselling",
  "demo-scheduled": "Demo Class",
  "admission-pending": "Admission Pending",
  admitted: "Admitted",
  lost: "Lost",
};

const SOURCE_LABELS: Record<CrmLeadSource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  google: "Google",
  referral: "Referral",
  "walk-in": "Walk-in",
  other: "Other",
};

const PRIORITY_LABELS: Record<CrmLeadPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const INTEREST_LABELS: Record<CrmLeadInterest, string> = {
  interested: "Interested",
  undecided: "Undecided",
  "not-interested": "Not Interested",
};

function createEmptyLeadDraft(): LeadDraft {
  return {
    studentName: "",
    studentPhone: "",
    studentEmail: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    courseInterested: "",
    branch: "",
    source: "website",
    priority: "medium",
    interest: "undecided",
    status: "new",
    assignedStaffId: "",
    nextFollowUpAt: "",
  };
}

function toLeadDraft(lead: CrmLead): LeadDraft {
  return {
    studentName: lead.studentName,
    studentPhone: lead.studentPhone,
    studentEmail: lead.studentEmail ?? "",
    parentName: lead.parentName ?? "",
    parentPhone: lead.parentPhone ?? "",
    parentEmail: lead.parentEmail ?? "",
    courseInterested: lead.courseInterested,
    branch: lead.branch ?? "",
    source: lead.source,
    priority: lead.priority,
    interest: lead.interest,
    status: lead.status,
    assignedStaffId: lead.assignedStaffId ?? "",
    nextFollowUpAt: toDateTimeInputValue(lead.nextFollowUpAt),
  };
}

function toDateTimeInputValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isOverdue(value?: string) {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  return !Number.isNaN(timestamp) && timestamp < Date.now();
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getStatusClass(status: CrmLeadStatus) {
  if (status === "admitted") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "lost") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "admission-pending") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "demo-scheduled") {
    return "bg-violet-100 text-violet-700";
  }

  return "bg-sky-100 text-sky-700";
}

function getPriorityClass(priority: CrmLeadPriority) {
  if (priority === "high") {
    return "bg-rose-100 text-rose-700";
  }

  if (priority === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getInterestClass(interest: CrmLeadInterest) {
  if (interest === "interested") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (interest === "not-interested") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getStaffDesignationLabel(designation: CrmStaffDesignation) {
  if (designation === "sales-executive") {
    return "Sales Executive";
  }

  return designation.charAt(0).toUpperCase() + designation.slice(1);
}

function getNextStatus(status: CrmLeadStatus) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 2) {
    return null;
  }

  return STATUS_ORDER[currentIndex + 1];
}

function csvCell(value: unknown) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function StatusBadge({ status }: { status: CrmLeadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(
        status,
      )}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <p className="font-bold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function SalesCrmManager({
  role = "admin",
}: {
  role?: "admin" | "counsellor";
}) {
  const isAdmin = role === "admin";

  const [workspace, setWorkspace] = useState<CrmWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<CrmTab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CrmLeadStatus>(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState<"all" | CrmLeadSource>(
    "all",
  );
  const [interestFilter, setInterestFilter] = useState<
    "all" | CrmLeadInterest
  >("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showReminder, setShowReminder] = useState(true);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);

  const [importSummary, setImportSummary] = useState<{
    createdCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: number;
      error: string;
    }>;
    limitedToFirstRows: boolean;
  } | null>(null);

  const [leadDraft, setLeadDraft] = useState<LeadDraft>(
    createEmptyLeadDraft(),
  );

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [demoScheduledAt, setDemoScheduledAt] = useState("");
  const [demoEducatorName, setDemoEducatorName] = useState("");
  const [demoMode, setDemoMode] = useState<"online" | "offline">("online");
  const [demoNote, setDemoNote] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [admissionNote, setAdmissionNote] = useState("");

  const [staffForm, setStaffForm] = useState({
    name: "",
    designation: "counsellor" as CrmStaffDesignation,
    email: "",
    phone: "",
  });

  const loadWorkspace = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/crm/leads", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load Sales CRM.");
      }

      setWorkspace(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Sales CRM.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();

    const intervalId = window.setInterval(() => {
      void loadWorkspace();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [loadWorkspace]);

  const leads = workspace?.leads ?? [];
  const staff = workspace?.staff ?? [];
  const summary = workspace?.summary;

  const tabs: Array<[CrmTab, string]> = [
    ["overview", "Overview"],
    ["leads", "Lead Management"],
    ["pipeline", "Pipeline"],
    ["follow-ups", "Follow-ups"],
    ...(isAdmin
      ? ([
          ["reports", "Reports & Revenue"],
          ["staff", "CRM Staff"],
        ] as Array<[CrmTab, string]>)
      : []),
  ];

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const filteredLeads = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const searchableText = [
        lead.studentName,
        lead.studentPhone,
        lead.parentName,
        lead.parentPhone,
        lead.courseInterested,
        lead.branch,
        lead.assignedStaffName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText || searchableText.includes(searchText);

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      const matchesSource =
        sourceFilter === "all" || lead.source === sourceFilter;

      const matchesInterest =
        interestFilter === "all" || lead.interest === interestFilter;

      const matchesAssignee =
        assigneeFilter === "all" ||
        (assigneeFilter === "unassigned"
          ? !lead.assignedStaffId
          : lead.assignedStaffId === assigneeFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesInterest &&
        matchesAssignee
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
    interestFilter,
    assigneeFilter,
  ]);

  const hotLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.interest === "interested" &&
          lead.status !== "lost" &&
          lead.status !== "admitted",
      ),
    [leads],
  );

  const overdueLeads = useMemo(
    () =>
      leads
        .filter(
          (lead) =>
            lead.status !== "lost" &&
            lead.status !== "admitted" &&
            isOverdue(lead.nextFollowUpAt),
        )
        .sort(
          (left, right) =>
            new Date(left.nextFollowUpAt ?? 0).getTime() -
            new Date(right.nextFollowUpAt ?? 0).getTime(),
        ),
    [leads],
  );

  const todayFollowUps = useMemo(
    () =>
      leads
        .filter(
          (lead) =>
            lead.status !== "lost" &&
            lead.status !== "admitted" &&
            isToday(lead.nextFollowUpAt),
        )
        .sort(
          (left, right) =>
            new Date(left.nextFollowUpAt ?? 0).getTime() -
            new Date(right.nextFollowUpAt ?? 0).getTime(),
        ),
    [leads],
  );

  async function requestJson(url: string, options: RequestInit): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Something went wrong.");
    }

    return payload;
  }

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const assignedStaff = staff.find(
      (member) => member.id === leadDraft.assignedStaffId,
    );

    try {
      setSaving(true);
      setError("");

      await requestJson("/api/crm/leads", {
        method: "POST",
        body: JSON.stringify({
          ...leadDraft,
          assignedStaffName: assignedStaff?.name ?? "",
        }),
      });

      setLeadDraft(createEmptyLeadDraft());
      setShowLeadForm(false);
      setNotice("Lead added successfully.");

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openLead(lead: CrmLead) {
    setSelectedLeadId(lead.id);
    setLeadDraft(toLeadDraft(lead));
    setActivityNote("");
    setFollowUpNote("");
    setFollowUpAt(toDateTimeInputValue(lead.nextFollowUpAt));
    setDemoScheduledAt(toDateTimeInputValue(lead.demo.scheduledAt));
    setDemoEducatorName(lead.demo.educatorName ?? "");
    setDemoMode(lead.demo.mode ?? "online");
    setDemoNote(lead.demo.notes ?? "");
    setTotalFee(String(lead.admission.totalFee || ""));
    setPaidAmount(String(lead.admission.paidAmount || ""));
    setAdmissionNote(lead.admission.notes ?? "");
  }

  function closeLeadPanel() {
    setSelectedLeadId(null);
    setActivityNote("");
    setFollowUpNote("");
  }

  async function patchLead(
    leadId: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    try {
      setSaving(true);
      setError("");

      const payload = await requestJson(
        `/api/crm/leads/${encodeURIComponent(leadId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

      if (payload.lead) {
        setLeadDraft(toLeadDraft(payload.lead));
      }

      setNotice(successMessage);

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLeadDetails() {
    if (!selectedLead) {
      return;
    }

    if (!isAdmin) {
      await patchLead(
        selectedLead.id,
        {
          action: "update",
          studentName: leadDraft.studentName,
          studentPhone: leadDraft.studentPhone,
          studentEmail: leadDraft.studentEmail,
          parentName: leadDraft.parentName,
          parentPhone: leadDraft.parentPhone,
          parentEmail: leadDraft.parentEmail,
          courseInterested: leadDraft.courseInterested,
          branch: leadDraft.branch,
          source: leadDraft.source,
          priority: leadDraft.priority,
          interest: leadDraft.interest,
          status: leadDraft.status,
          nextFollowUpAt: leadDraft.nextFollowUpAt,
        },
        "Lead details updated.",
      );

      return;
    }

    const assignedStaff = staff.find(
      (member) => member.id === leadDraft.assignedStaffId,
    );

    await patchLead(
      selectedLead.id,
      {
        action: "update",
        ...leadDraft,
        assignedStaffName: assignedStaff?.name ?? "",
      },
      "Lead details updated.",
    );
  }

  async function handleRecordCall() {
    if (!selectedLead) {
      return;
    }

    await patchLead(
      selectedLead.id,
      {
        action: "call",
        note: activityNote || "Call activity recorded.",
        nextFollowUpAt: followUpAt,
      },
      "Call activity saved.",
    );

    setActivityNote("");
  }

  async function handleScheduleFollowUp() {
    if (!selectedLead) {
      return;
    }

    if (!followUpAt) {
      setError("Choose a follow-up date and time.");
      return;
    }

    await patchLead(
      selectedLead.id,
      {
        action: "note",
        note:
          followUpNote ||
          `Follow-up scheduled for ${formatDateTime(followUpAt)}.`,
        nextFollowUpAt: followUpAt,
        status: "follow-up",
      },
      "Follow-up scheduled.",
    );

    setFollowUpNote("");
  }

  async function handleScheduleDemo() {
    if (!selectedLead) {
      return;
    }

    if (!demoScheduledAt) {
      setError("Choose a demo class date and time.");
      return;
    }

    await patchLead(
      selectedLead.id,
      {
        action: "demo",
        demoStatus: "scheduled",
        demoScheduledAt,
        demoEducatorName,
        demoMode,
        note: demoNote,
      },
      "Demo class scheduled.",
    );
  }

  async function handleAdmissionConversion() {
    if (!selectedLead) {
      return;
    }

    const fee = Number(totalFee);
    const paid = Number(paidAmount || 0);

    if (!Number.isFinite(fee) || fee <= 0) {
      setError("Enter a valid total admission fee.");
      return;
    }

    if (!Number.isFinite(paid) || paid < 0) {
      setError("Enter a valid paid amount.");
      return;
    }

    await patchLead(
      selectedLead.id,
      {
        action: "admission",
        totalFee: fee,
        paidAmount: paid,
        note: admissionNote,
      },
      "Lead converted into admission.",
    );
  }

  async function handleMarkLost() {
    if (!selectedLead) {
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedLead.studentName} as not interested / lost?`,
    );

    if (!confirmed) {
      return;
    }

    await patchLead(
      selectedLead.id,
      {
        action: "lost",
        note: activityNote || "Lead marked as not interested.",
      },
      "Lead moved to Lost.",
    );
  }

  async function handleMoveToNextStage(lead: CrmLead) {
    const nextStatus = getNextStatus(lead.status);

    if (!nextStatus) {
      return;
    }

    await patchLead(
      lead.id,
      {
        action: "update",
        status: nextStatus,
      },
      `Lead moved to ${STATUS_LABELS[nextStatus]}.`,
    );
  }

  async function handleDeleteLead(lead: CrmLead) {
    const confirmed = window.confirm(
      `Delete ${lead.studentName}'s lead permanently?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await requestJson(`/api/crm/leads/${encodeURIComponent(lead.id)}`, {
        method: "DELETE",
      });

      closeLeadPanel();
      setNotice("Lead deleted.");

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await requestJson("/api/crm/staff", {
        method: "POST",
        body: JSON.stringify(staffForm),
      });

      setStaffForm({
        name: "",
        designation: "counsellor",
        email: "",
        phone: "",
      });

      setShowStaffForm(false);
      setNotice("CRM staff member added.");

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add CRM staff.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStaffStatus(member: CrmStaff) {
    try {
      setSaving(true);
      setError("");

      await requestJson("/api/crm/staff", {
        method: "PATCH",
        body: JSON.stringify({
          staffId: member.id,
          active: !member.active,
        }),
      });

      setNotice(
        member.active
          ? `${member.name} was marked inactive.`
          : `${member.name} was activated.`,
      );

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update staff member.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStaff(member: CrmStaff) {
    const confirmed = window.confirm(
      `Delete ${member.name} from CRM staff? Existing lead records will still keep their historical name.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await requestJson("/api/crm/staff", {
        method: "DELETE",
        body: JSON.stringify({
          staffId: member.id,
        }),
      });

      setNotice("CRM staff member deleted.");

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete staff member.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function downloadSecureBackup() {
    try {
      setError("");

      const response = await fetch("/api/crm/backup", {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json();

        throw new Error(payload.error || "Unable to download CRM backup.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `smart-tutors-crm-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setNotice("Secure CRM backup downloaded.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to download CRM backup.",
      );
    }
  }

  async function handleCsvImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(
        "Choose a CSV file. Export your Excel or Google Sheet as CSV first.",
      );

      event.target.value = "";
      return;
    }

    try {
      setImporting(true);
      setError("");
      setImportSummary(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/crm/import", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to import CSV leads.");
      }

      setImportSummary({
        createdCount: payload.createdCount ?? 0,
        skippedCount: payload.skippedCount ?? 0,
        skippedRows: payload.skippedRows ?? [],
        limitedToFirstRows: Boolean(payload.limitedToFirstRows),
      });

      setNotice(
        `${payload.createdCount ?? 0} lead${
          payload.createdCount === 1 ? "" : "s"
        } imported successfully.`,
      );

      await loadWorkspace();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to import CSV leads.",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function exportLeadsCsv() {
    const headers = [
      "Student Name",
      "Student Phone",
      "Student Email",
      "Parent Name",
      "Parent Phone",
      "Course",
      "Branch",
      "Source",
      "Priority",
      "Interest",
      "Status",
      "Assigned Staff",
      "Next Follow-up",
      "Demo Status",
      "Demo Date",
      "Admission Fee",
      "Paid Amount",
      "Pending Amount",
      "Payment Status",
      "Created At",
      "Updated At",
    ];

    const rows = leads.map((lead) => [
      lead.studentName,
      lead.studentPhone,
      lead.studentEmail,
      lead.parentName,
      lead.parentPhone,
      lead.courseInterested,
      lead.branch,
      SOURCE_LABELS[lead.source],
      PRIORITY_LABELS[lead.priority],
      INTEREST_LABELS[lead.interest],
      STATUS_LABELS[lead.status],
      lead.assignedStaffName,
      lead.nextFollowUpAt,
      lead.demo.status,
      lead.demo.scheduledAt,
      lead.admission.totalFee,
      lead.admission.paidAmount,
      lead.admission.pendingAmount,
      lead.admission.paymentStatus,
      lead.createdAt,
      lead.updatedAt,
    ]);

    const csvContent = [
      headers.map(csvCell).join(","),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `smart-tutors-crm-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setNotice("CRM backup exported as CSV.");
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          Loading Sales CRM...
        </p>
      </section>
    );
  }

  if (!workspace || !summary) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8">
        <h2 className="text-lg font-bold text-rose-800">
          Sales CRM could not load
        </h2>
        <p className="mt-2 text-sm text-rose-700">
          {error || "Please refresh the dashboard and try again."}
        </p>
        <button
          type="button"
          onClick={() => void loadWorkspace()}
          className="mt-5 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-6">
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {importSummary && isAdmin ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black">
                CSV import completed: {importSummary.createdCount} lead
                {importSummary.createdCount === 1 ? "" : "s"} added.
              </p>

              {importSummary.skippedCount ? (
                <p className="mt-1 text-sky-800">
                  {importSummary.skippedCount} row
                  {importSummary.skippedCount === 1 ? "" : "s"} skipped because
                  required information was missing or invalid.
                </p>
              ) : null}

              {importSummary.limitedToFirstRows ? (
                <p className="mt-1 text-amber-700">
                  Only the first 500 lead rows were imported.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setImportSummary(null)}
              className="font-black underline"
            >
              Dismiss
            </button>
          </div>

          {importSummary.skippedRows.length ? (
            <div className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-sky-200 bg-white p-3">
              {importSummary.skippedRows.map((item) => (
                <p
                  key={`${item.row}-${item.error}`}
                  className="py-1 text-xs text-slate-700"
                >
                  Row {item.row}: {item.error}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="font-bold underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {showReminder &&
      (summary.overdueFollowUps > 0 || summary.dueToday > 0) ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">
                Follow-up alert
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                {summary.overdueFollowUps} overdue and {summary.dueToday} due
                today
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Open Follow-ups to call students and ensure no enquiry is
                missed.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("follow-ups")}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
              >
                View follow-ups
              </button>

              <button
                type="button"
                onClick={() => setShowReminder(false)}
                className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
              {isAdmin
                ? "Admin Panel · Sales CRM"
                : "Counsellor Desk · Sales CRM"}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {isAdmin ? "Admissions Command Center" : "My Admissions Desk"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              {isAdmin
                ? "Track every enquiry, manage follow-ups, schedule demos, convert admissions, monitor collections, and export secure CRM backups."
                : "Manage your assigned leads, record calls, schedule follow-ups and demos, and convert admissions."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadWorkspace()}
              disabled={saving}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh data
            </button>

            {isAdmin ? (
              <>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvImport}
                />

                <button
                  type="button"
                  disabled={importing}
                  onClick={() => importFileInputRef.current?.click()}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? "Importing..." : "Import CSV"}
                </button>

                <button
                  type="button"
                  onClick={() => void downloadSecureBackup()}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Export backup
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setLeadDraft(createEmptyLeadDraft());
                setShowLeadForm(true);
              }}
              className="rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-sky-300"
            >
              + Add lead
            </button>
          </div>
        </div>
      </header>

      <nav className="flex min-w-0 gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === tab
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total Leads",
                value: summary.totalLeads,
                detail: `${summary.newToday} added today`,
              },
              {
                label: "Active Follow-ups",
                value: summary.activeFollowUps,
                detail: `${summary.overdueFollowUps} overdue`,
              },
              {
                label: "Demo Classes",
                value: summary.demoScheduled,
                detail: "Scheduled / rescheduled",
              },
              {
                label: "Admissions Confirmed",
                value: summary.admissionsConfirmed,
                detail: `${summary.conversionRate}% conversion`,
              },
              {
                label: "Hot Leads",
                value: summary.hotLeads,
                detail: "Interested and active",
              },
              {
                label: "Revenue Generated",
                value: formatCurrency(summary.revenueGenerated),
                detail: isAdmin
                  ? "Paid admission amount"
                  : "Revenue from your admissions",
              },
              {
                label: "Pending Collection",
                value: formatCurrency(summary.pendingFeeCollection),
                detail: isAdmin
                  ? "Pending admission fees"
                  : "Pending fees in your leads",
              },
              {
                label: "New This Month",
                value: summary.newThisMonth,
                detail: "Fresh CRM enquiries",
              },
            ].map((card) => (
              <article
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-black text-slate-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Revenue trend
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Last six months
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {formatCurrency(summary.revenueGenerated)} total
                </span>
              </div>

              <div className="mt-7 grid h-56 grid-cols-6 items-end gap-3">
                {summary.monthlyRevenue.map((month) => {
                  const maxRevenue = Math.max(
                    ...summary.monthlyRevenue.map((item) => item.revenue),
                    1,
                  );

                  const height = Math.max(
                    8,
                    Math.round((month.revenue / maxRevenue) * 100),
                  );

                  return (
                    <div
                      key={month.label}
                      className="flex h-full min-w-0 flex-col justify-end"
                    >
                      <p className="mb-2 truncate text-center text-xs font-bold text-slate-500">
                        {formatCurrency(month.revenue)}
                      </p>

                      <div
                        className="rounded-t-xl bg-sky-500 transition-all"
                        style={{ height: `${height}%` }}
                        title={`${month.label}: ${formatCurrency(
                          month.revenue,
                        )}`}
                      />

                      <p className="mt-3 text-center text-xs font-black text-slate-700">
                        {month.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Lead source analysis
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Where enquiries come from
              </h2>

              <div className="mt-6 space-y-4">
                {summary.sourceAnalysis.map((item) => {
                  const percentage = summary.totalLeads
                    ? Math.round((item.count / summary.totalLeads) * 100)
                    : 0;

                  return (
                    <div key={item.source}>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold text-slate-700">
                          {SOURCE_LABELS[item.source]}
                        </span>

                        <span className="font-black text-slate-950">
                          {item.count}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Priority queue
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Hot leads requiring attention
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("leads");
                    setInterestFilter("interested");
                  }}
                  className="text-sm font-bold text-sky-700 hover:underline"
                >
                  View all
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {hotLeads.slice(0, 5).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => openLead(lead)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left transition hover:border-emerald-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {lead.studentName}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-600">
                        {lead.courseInterested} · {lead.studentPhone}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={lead.status} />
                    </div>
                  </button>
                ))}

                {!hotLeads.length ? (
                  <EmptyState
                    title="No hot leads yet"
                    description="Mark an interested enquiry as a hot lead to see it here."
                  />
                ) : null}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Immediate actions
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Overdue follow-ups
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("follow-ups")}
                  className="text-sm font-bold text-sky-700 hover:underline"
                >
                  Open follow-ups
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {overdueLeads.slice(0, 5).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => openLead(lead)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left transition hover:border-rose-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {lead.studentName}
                      </p>

                      <p className="mt-1 text-sm text-rose-700">
                        Due {formatDateTime(lead.nextFollowUpAt)}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white">
                      Overdue
                    </span>
                  </button>
                ))}

                {!overdueLeads.length ? (
                  <EmptyState
                    title="No overdue follow-ups"
                    description="Everything is currently on track."
                  />
                ) : null}
              </div>
            </article>
          </div>
        </div>
      ) : null}

      {activeTab === "leads" ? (
        <div className="space-y-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Lead management
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {isAdmin
                    ? "Every student enquiry in one place"
                    : "Your assigned student enquiries"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLeadDraft(createEmptyLeadDraft());
                  setShowLeadForm(true);
                }}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              >
                + Add new lead
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, phone, course..."
                className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 xl:col-span-2"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | CrmLeadStatus)
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              >
                <option value="all">All statuses</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as "all" | CrmLeadSource)
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              >
                <option value="all">All sources</option>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={interestFilter}
                onChange={(event) =>
                  setInterestFilter(
                    event.target.value as "all" | CrmLeadInterest,
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
              >
                <option value="all">All interest levels</option>
                {Object.entries(INTEREST_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {isAdmin ? (
                <select
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 xl:col-start-3"
                >
                  <option value="all">All assignees</option>
                  <option value="unassigned">Unassigned</option>

                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setInterestFilter("all");
                  setAssigneeFilter("all");
                }}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Reset filters
              </button>
            </div>
          </article>

          <div className="md:hidden">
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => openLead(lead)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {lead.studentName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {lead.studentPhone}
                      </p>
                    </div>

                    <StatusBadge status={lead.status} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {lead.courseInterested}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getInterestClass(
                        lead.interest,
                      )}`}
                    >
                      {INTEREST_LABELS[lead.interest]}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClass(
                        lead.priority,
                      )}`}
                    >
                      {PRIORITY_LABELS[lead.priority]}
                    </span>
                  </div>
                </button>
              ))}

              {!filteredLeads.length ? (
                <EmptyState
                  title="No leads found"
                  description="Change the filters or add a new enquiry."
                />
              ) : null}
            </div>
          </div>

          <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-[1250px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black">Student</th>
                  <th className="px-5 py-4 font-black">Course</th>
                  <th className="px-5 py-4 font-black">Source</th>
                  <th className="px-5 py-4 font-black">Priority</th>
                  <th className="px-5 py-4 font-black">Interest</th>
                  <th className="px-5 py-4 font-black">Status</th>
                  <th className="px-5 py-4 font-black">Assignee</th>
                  <th className="px-5 py-4 font-black">Follow-up</th>
                  <th className="px-5 py-4 font-black">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">
                        {lead.studentName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {lead.studentPhone}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {lead.courseInterested}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {lead.branch || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {SOURCE_LABELS[lead.source]}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClass(
                          lead.priority,
                        )}`}
                      >
                        {PRIORITY_LABELS[lead.priority]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getInterestClass(
                          lead.interest,
                        )}`}
                      >
                        {INTEREST_LABELS[lead.interest]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {lead.assignedStaffName || "Unassigned"}
                    </td>

                    <td className="px-5 py-4">
                      <p
                        className={
                          isOverdue(lead.nextFollowUpAt)
                            ? "font-bold text-rose-700"
                            : "text-slate-700"
                        }
                      >
                        {formatDateTime(lead.nextFollowUpAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openLead(lead)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-950 hover:text-white"
                      >
                        Open lead
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredLeads.length ? (
              <div className="p-8">
                <EmptyState
                  title="No leads found"
                  description="Change the filters or add a new enquiry."
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "pipeline" ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1600px] grid-cols-8 gap-4">
            {STATUS_ORDER.map((status) => {
              const pipelineLeads = leads.filter(
                (lead) => lead.status === status,
              );

              return (
                <section
                  key={status}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-800">
                      {STATUS_LABELS[status]}
                    </span>

                    <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-600 shadow-sm">
                      {pipelineLeads.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {pipelineLeads.map((lead) => (
                      <article
                        key={lead.id}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => openLead(lead)}
                          className="w-full text-left"
                        >
                          <p className="truncate text-sm font-black text-slate-950">
                            {lead.studentName}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {lead.courseInterested}
                          </p>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-black ${getPriorityClass(
                              lead.priority,
                            )}`}
                          >
                            {PRIORITY_LABELS[lead.priority]}
                          </span>

                          {getNextStatus(lead.status) ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void handleMoveToNextStage(lead)
                              }
                              className="text-xs font-black text-sky-700 hover:underline disabled:opacity-50"
                            >
                              Move →
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))}

                    {!pipelineLeads.length ? (
                      <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-400">
                        No leads
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "follow-ups" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-600">
                  Attention required
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Overdue follow-ups
                </h2>
              </div>

              <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-black text-rose-700">
                {overdueLeads.length}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {overdueLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => openLead(lead)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left transition hover:border-rose-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {lead.studentName}
                    </p>

                    <p className="mt-1 text-sm text-rose-700">
                      Due {formatDateTime(lead.nextFollowUpAt)}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {lead.assignedStaffName || "Unassigned"} ·{" "}
                      {lead.courseInterested}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">
                    Call now
                  </span>
                </button>
              ))}

              {!overdueLeads.length ? (
                <EmptyState
                  title="No overdue follow-ups"
                  description="Great work. No missed follow-up is pending."
                />
              ) : null}
            </div>
          </article>

          <article className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-600">
                  Today&apos;s plan
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Follow-ups due today
                </h2>
              </div>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-black text-sky-700">
                {todayFollowUps.length}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {todayFollowUps.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => openLead(lead)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-left transition hover:border-sky-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-950">
                      {lead.studentName}
                    </p>

                    <p className="mt-1 text-sm text-sky-700">
                      {formatDateTime(lead.nextFollowUpAt)}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {lead.assignedStaffName || "Unassigned"} ·{" "}
                      {lead.courseInterested}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white">
                    Open
                  </span>
                </button>
              ))}

              {!todayFollowUps.length ? (
                <EmptyState
                  title="Nothing scheduled today"
                  description="Schedule follow-ups from a lead profile."
                />
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === "reports" && isAdmin ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Conversion Rate
              </p>

              <p className="mt-3 text-3xl font-black text-slate-950">
                {summary.conversionRate}%
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Admitted leads / total leads
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Revenue Collected
              </p>

              <p className="mt-3 text-3xl font-black text-emerald-700">
                {formatCurrency(summary.revenueGenerated)}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Paid admission amount
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Pending Collection
              </p>

              <p className="mt-3 text-3xl font-black text-amber-700">
                {formatCurrency(summary.pendingFeeCollection)}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Remaining fees from admissions
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                CRM Backup
              </p>

              <button
                type="button"
                onClick={exportLeadsCsv}
                className="mt-3 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              >
                Download CSV
              </button>

              <p className="mt-2 text-sm text-slate-500">
                Lead, follow-up and collection data
              </p>
            </article>
          </div>

          <article className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Counsellor performance
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Lead ownership, conversions and revenue
              </h2>
            </div>

            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black">Staff member</th>
                  <th className="px-5 py-4 font-black">Assigned leads</th>
                  <th className="px-5 py-4 font-black">Demos booked</th>
                  <th className="px-5 py-4 font-black">Admissions</th>
                  <th className="px-5 py-4 font-black">Conversion</th>
                  <th className="px-5 py-4 font-black">Revenue</th>
                </tr>
              </thead>

              <tbody>
                {summary.counsellorPerformance.map((member) => (
                  <tr
                    key={member.staffId}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4 font-black text-slate-900">
                      {member.staffName}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {member.leadsAssigned}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {member.demosBooked}
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {member.admissionsConverted}
                    </td>

                    <td className="px-5 py-4 font-bold text-sky-700">
                      {member.conversionRate}%
                    </td>

                    <td className="px-5 py-4 font-black text-emerald-700">
                      {formatCurrency(member.revenueGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!summary.counsellorPerformance.length ? (
              <div className="p-8">
                <EmptyState
                  title="No staff performance data yet"
                  description="Assign leads to CRM staff to generate performance reporting."
                />
              </div>
            ) : null}
          </article>
        </div>
      ) : null}

      {activeTab === "staff" && isAdmin ? (
        <div className="space-y-5">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  CRM team directory
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Counsellors, Sales Executives and Receptionists
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  These profiles are used for CRM lead assignment. Counsellor
                  logins are created through the Admin Accounts section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowStaffForm(true)}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white"
              >
                + Add CRM staff
              </button>
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-950">
                      {member.name}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-sky-700">
                      {getStaffDesignationLabel(member.designation)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      member.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {member.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>{member.email || "No email added"}</p>
                  <p>{member.phone || "No phone added"}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void toggleStaffStatus(member)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {member.active ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleDeleteStaff(member)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!staff.length ? (
            <EmptyState
              title="No CRM staff added"
              description="Add counsellors or sales staff before assigning leads."
            />
          ) : null}
        </div>
      ) : null}

      {showLeadForm ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                  Sales CRM
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Add New Lead
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleCreateLead}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Student Name *
                <input
                  required
                  value={leadDraft.studentName}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      studentName: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Student Phone *
                <input
                  required
                  value={leadDraft.studentPhone}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      studentPhone: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Student Email
                <input
                  type="email"
                  value={leadDraft.studentEmail}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      studentEmail: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Parent Name
                <input
                  value={leadDraft.parentName}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      parentName: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Parent Phone
                <input
                  value={leadDraft.parentPhone}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      parentPhone: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Parent Email
                <input
                  type="email"
                  value={leadDraft.parentEmail}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      parentEmail: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Course Interested *
                <input
                  required
                  value={leadDraft.courseInterested}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      courseInterested: event.target.value,
                    }))
                  }
                  placeholder="Class 10 CBSE, NEET, JEE..."
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Branch / Location
                <input
                  value={leadDraft.branch}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      branch: event.target.value,
                    }))
                  }
                  placeholder="Vashi, Online..."
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Lead Source
                <select
                  value={leadDraft.source}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      source: event.target.value as CrmLeadSource,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Priority
                <select
                  value={leadDraft.priority}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      priority: event.target.value as CrmLeadPriority,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Interest Level
                <select
                  value={leadDraft.interest}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      interest: event.target.value as CrmLeadInterest,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  {Object.entries(INTEREST_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {isAdmin ? (
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Assign Staff
                  <select
                    value={leadDraft.assignedStaffId}
                    onChange={(event) =>
                      setLeadDraft((current) => ({
                        ...current,
                        assignedStaffId: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    <option value="">Unassigned</option>

                    {staff
                      .filter((member) => member.active)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ·{" "}
                          {getStaffDesignationLabel(member.designation)}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-800">
                  This lead will be automatically assigned to you.
                </div>
              )}

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                First Follow-up
                <input
                  type="datetime-local"
                  value={leadDraft.nextFollowUpAt}
                  onChange={(event) =>
                    setLeadDraft((current) => ({
                      ...current,
                      nextFollowUpAt: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <div className="flex items-end justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showStaffForm && isAdmin ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                  CRM Staff
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Add CRM Assignee
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowStaffForm(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-6 space-y-4">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Full Name *
                <input
                  required
                  value={staffForm.name}
                  onChange={(event) =>
                    setStaffForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Designation *
                <select
                  value={staffForm.designation}
                  onChange={(event) =>
                    setStaffForm((current) => ({
                      ...current,
                      designation: event.target.value as CrmStaffDesignation,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  <option value="counsellor">Counsellor</option>
                  <option value="sales-executive">Sales Executive</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Email
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(event) =>
                    setStaffForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Phone
                <input
                  value={staffForm.phone}
                  onChange={(event) =>
                    setStaffForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {selectedLead ? (
        <div className="fixed inset-0 z-[60] bg-slate-950/40">
          <aside className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                    Lead Profile
                  </p>

                  <h2 className="mt-1 truncate text-2xl font-black text-slate-950">
                    {selectedLead.studentName}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={selectedLead.status} />

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getInterestClass(
                        selectedLead.interest,
                      )}`}
                    >
                      {INTEREST_LABELS[selectedLead.interest]}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityClass(
                        selectedLead.priority,
                      )}`}
                    >
                      {PRIORITY_LABELS[selectedLead.priority]}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeLeadPanel}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-7 p-5 sm:p-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Student Name
                    <input
                      value={leadDraft.studentName}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          studentName: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Student Phone
                    <input
                      value={leadDraft.studentPhone}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          studentPhone: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Student Email
                    <input
                      type="email"
                      value={leadDraft.studentEmail}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          studentEmail: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Parent Name
                    <input
                      value={leadDraft.parentName}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          parentName: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Parent Phone
                    <input
                      value={leadDraft.parentPhone}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          parentPhone: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Course Interested
                    <input
                      value={leadDraft.courseInterested}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          courseInterested: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Lead Source
                    <select
                      value={leadDraft.source}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          source: event.target.value as CrmLeadSource,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    >
                      {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Priority
                    <select
                      value={leadDraft.priority}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          priority: event.target.value as CrmLeadPriority,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    >
                      {Object.entries(PRIORITY_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Interest
                    <select
                      value={leadDraft.interest}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          interest: event.target.value as CrmLeadInterest,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    >
                      {Object.entries(INTEREST_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Pipeline Status
                    <select
                      value={leadDraft.status}
                      onChange={(event) =>
                        setLeadDraft((current) => ({
                          ...current,
                          status: event.target.value as CrmLeadStatus,
                        }))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    >
                      {STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  {isAdmin ? (
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Assign Staff
                      <select
                        value={leadDraft.assignedStaffId}
                        onChange={(event) =>
                          setLeadDraft((current) => ({
                            ...current,
                            assignedStaffId: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                      >
                        <option value="">Unassigned</option>

                        {staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ·{" "}
                            {getStaffDesignationLabel(member.designation)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveLeadDetails()}
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                  >
                    Save lead details
                  </button>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <article className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Call / Follow-up
                  </p>

                  <textarea
                    value={activityNote}
                    onChange={(event) => setActivityNote(event.target.value)}
                    placeholder="Call outcome, parent response, important note..."
                    className="mt-3 min-h-24 w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  />

                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Next Follow-up
                    <input
                      type="datetime-local"
                      value={followUpAt}
                      onChange={(event) => setFollowUpAt(event.target.value)}
                      className="rounded-xl border border-sky-200 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleRecordCall()}
                      className="rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-60"
                    >
                      Save call activity
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleScheduleFollowUp()}
                      className="rounded-xl border border-sky-300 bg-white px-3 py-2.5 text-xs font-black text-sky-800 disabled:opacity-60"
                    >
                      Schedule follow-up
                    </button>
                  </div>
                </article>

                <article className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Demo Class Scheduler
                  </p>

                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Demo Date & Time
                    <input
                      type="datetime-local"
                      value={demoScheduledAt}
                      onChange={(event) =>
                        setDemoScheduledAt(event.target.value)
                      }
                      className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500"
                    />
                  </label>

                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Educator / Demo Teacher
                    <input
                      value={demoEducatorName}
                      onChange={(event) =>
                        setDemoEducatorName(event.target.value)
                      }
                      placeholder="Teacher name"
                      className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500"
                    />
                  </label>

                  <label className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
                    Mode
                    <select
                      value={demoMode}
                      onChange={(event) =>
                        setDemoMode(
                          event.target.value as "online" | "offline",
                        )
                      }
                      className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 outline-none focus:border-violet-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </label>

                  <textarea
                    value={demoNote}
                    onChange={(event) => setDemoNote(event.target.value)}
                    placeholder="Demo class notes..."
                    className="mt-3 min-h-20 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleScheduleDemo()}
                    className="mt-3 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-60"
                  >
                    Schedule demo class
                  </button>
                </article>
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Admission Conversion & Fees
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Total Course Fee
                      <input
                        type="number"
                        min="0"
                        value={totalFee}
                        onChange={(event) => setTotalFee(event.target.value)}
                        className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-bold text-slate-700">
                      Paid Amount
                      <input
                        type="number"
                        min="0"
                        value={paidAmount}
                        onChange={(event) => setPaidAmount(event.target.value)}
                        className="rounded-xl border border-emerald-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
                      />
                    </label>
                  </div>

                  <textarea
                    value={admissionNote}
                    onChange={(event) => setAdmissionNote(event.target.value)}
                    placeholder="Admission / payment notes..."
                    className="mt-3 min-h-20 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleAdmissionConversion()}
                    className="mt-3 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-60"
                  >
                    Convert to admission
                  </button>
                </article>

                <article className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Lead Controls
                  </p>

                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p>
                      Demo status:{" "}
                      <span className="font-black text-slate-900">
                        {selectedLead.demo.status.replaceAll("-", " ")}
                      </span>
                    </p>

                    <p>
                      Admission paid:{" "}
                      <span className="font-black text-emerald-700">
                        {formatCurrency(selectedLead.admission.paidAmount)}
                      </span>
                    </p>

                    <p>
                      Pending:{" "}
                      <span className="font-black text-amber-700">
                        {formatCurrency(selectedLead.admission.pendingAmount)}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleMarkLost()}
                      className="rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-black text-rose-700 disabled:opacity-60"
                    >
                      Mark as lost
                    </button>

                    {isAdmin ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleDeleteLead(selectedLead)}
                        className="rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-60"
                      >
                        Delete lead
                      </button>
                    ) : null}
                  </div>
                </article>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Activity Log
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      Every lead update is tracked
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {selectedLead.activityLog.length} updates
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {selectedLead.activityLog.map((activity) => (
                    <article
                      key={activity.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black capitalize text-slate-900">
                            {activity.type.replaceAll("-", " ")}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {activity.message}
                          </p>
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          <p className="font-bold text-slate-700">
                            {activity.actorName}
                          </p>

                          <p className="mt-1">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}

                  {!selectedLead.activityLog.length ? (
                    <EmptyState
                      title="No activity yet"
                      description="Updates, calls, demos and admissions will appear here."
                    />
                  ) : null}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}