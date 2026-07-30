import type { Role } from "./types";

export type ActionLogAction =
  | "login"
  | "logout"
  | "session_expire"
  | "create"
  | "update"
  | "delete"
  | "view"
  | "api_call"
  | "bulk_operation";

export type ActionLogCategory =
  | "auth"
  | "fees"
  | "payout"
  | "courses"
  | "users"
  | "roles"
  | "students"
  | "attendance"
  | "messages"
  | "library"
  | "performance"
  | "settings"
  | "other";

export type ActionLogEntry = {
  id: string;
  action: ActionLogAction;
  category: ActionLogCategory;

  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: Role;

  details: string;
  metadata?: Record<string, unknown>;

  ip: string;
  userAgent: string;
  browser?: string;
  os?: string;
  device?: string;
  referer?: string;
  acceptLanguage?: string;
  cfCountry?: string;
  geo?: {
    city?: string;
    region?: string;
    country?: string;
  };

  path: string;
  method: string;
  duration?: number;
  statusCode?: number;
  timestamp: string;
};

export type AuditLogFilter = {
  userId?: string;
  action?: ActionLogAction;
  category?: ActionLogCategory;
  search?: string;
  ip?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type AuditLogStats = {
  total: number;
  today: number;
  byAction: Record<string, number>;
  byCategory: Record<string, number>;
  uniqueUsers: number;
  uniqueIps: number;
};
