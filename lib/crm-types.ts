export const CRM_LEAD_SOURCES = [
  "website",
  "whatsapp",
  "instagram",
  "google",
  "referral",
  "walk-in",
  "other",
] as const;

export const CRM_LEAD_PRIORITIES = ["high", "medium", "low"] as const;

export const CRM_LEAD_INTERESTS = [
  "interested",
  "undecided",
  "not-interested",
] as const;

export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "follow-up",
  "counselling",
  "demo-scheduled",
  "admission-pending",
  "admitted",
  "lost",
] as const;

export const CRM_STAFF_DESIGNATIONS = [
  "counsellor",
  "sales-executive",
  "receptionist",
] as const;

export type CrmLeadSource = (typeof CRM_LEAD_SOURCES)[number];
export type CrmLeadPriority = (typeof CRM_LEAD_PRIORITIES)[number];
export type CrmLeadInterest = (typeof CRM_LEAD_INTERESTS)[number];
export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];
export type CrmStaffDesignation =
  (typeof CRM_STAFF_DESIGNATIONS)[number];

export type CrmLeadActivityType =
  | "created"
  | "updated"
  | "note"
  | "call"
  | "follow-up"
  | "demo"
  | "admission"
  | "assignment"
  | "lost";

export type CrmLeadActivity = {
  id: string;
  type: CrmLeadActivityType;
  message: string;
  actorId: string;
  actorName: string;
  createdAt: string;
};

export type CrmDemo = {
  status:
    | "not-scheduled"
    | "scheduled"
    | "attended"
    | "missed"
    | "rescheduled";
  scheduledAt?: string;
  educatorName?: string;
  mode?: "online" | "offline";
  notes?: string;
};

export type CrmAdmission = {
  convertedAt?: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: "not-applicable" | "pending" | "partial" | "paid";
  notes?: string;
};

export type CrmLead = {
  id: string;

  studentName: string;
  studentPhone: string;
  studentEmail?: string;

  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;

  courseInterested: string;
  branch?: string;

  source: CrmLeadSource;
  priority: CrmLeadPriority;
  interest: CrmLeadInterest;
  status: CrmLeadStatus;

  assignedStaffId?: string;
  assignedStaffName?: string;

  nextFollowUpAt?: string;
  lastContactedAt?: string;

  demo: CrmDemo;
  admission: CrmAdmission;

  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;

  createdAt: string;
  updatedAt: string;

  activityLog: CrmLeadActivity[];
};

export type CrmStaff = {
  id: string;
  linkedUserId?: string;
  name: string;
  designation: CrmStaffDesignation;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmDashboardSummary = {
  totalLeads: number;
  newToday: number;
  newThisMonth: number;
  activeFollowUps: number;
  dueToday: number;
  overdueFollowUps: number;
  demoScheduled: number;
  admissionsConfirmed: number;
  conversionRate: number;
  revenueGenerated: number;
  pendingFeeCollection: number;
  hotLeads: number;

  pipeline: Array<{
    status: CrmLeadStatus;
    count: number;
  }>;

  sourceAnalysis: Array<{
    source: CrmLeadSource;
    count: number;
  }>;

  counsellorPerformance: Array<{
    staffId: string;
    staffName: string;
    leadsAssigned: number;
    demosBooked: number;
    admissionsConverted: number;
    conversionRate: number;
    revenueGenerated: number;
  }>;

  monthlyRevenue: Array<{
    label: string;
    revenue: number;
    admissions: number;
  }>;
};