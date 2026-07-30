import { UAParser } from "ua-parser-js";

import type { SessionUser } from "./types";
import { COLLECTIONS, getCollection } from "./data-store";
import type {
  ActionLogAction,
  ActionLogCategory,
  ActionLogEntry,
} from "./audit-log-types";

// ── Geo-lookup cache ─────────────────────────────────────────────

const geoCache = new Map<string, ActionLogEntry["geo"]>();

async function lookupGeo(ip: string): Promise<ActionLogEntry["geo"]> {
  if (geoCache.has(ip)) return geoCache.get(ip) ?? undefined;
  if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return undefined;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      city?: string;
      region?: string;
      country_name?: string;
      error?: boolean;
    };
    if (data.error) return undefined;
    const geo = {
      city: data.city || undefined,
      region: data.region || undefined,
      country: data.country_name || undefined,
    };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return undefined;
  }
}

// ── Request metadata extraction ──────────────────────────────────

export function extractRequestMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";
  const referer = request.headers.get("referer") || undefined;
  const acceptLanguage = request.headers.get("accept-language") || undefined;
  const cfCountry = request.headers.get("cf-ipcountry") || undefined;

  let browser: string | undefined;
  let os: string | undefined;
  let device: string | undefined;

  try {
    const parsed = new UAParser(userAgent);
    const b = parsed.getBrowser();
    const o = parsed.getOS();
    const d = parsed.getDevice();
    if (b.name) browser = b.version ? `${b.name} ${b.version}` : b.name;
    if (o.name) os = o.version ? `${o.name} ${o.version}` : o.name;
    if (d.type) device = d.type;
    else if (d.vendor) device = d.vendor;
  } catch {
    /* best-effort parse */
  }

  const geo = geoCache.get(ip) || undefined;

  return { ip, userAgent, referer, acceptLanguage, cfCountry, browser, os, device, geo };
}

// ── Log builder ──────────────────────────────────────────────────

function buildEntry(params: {
  action: ActionLogAction;
  category: ActionLogCategory;
  details: string;
  path: string;
  method: string;
  request?: Request;
  session?: SessionUser | null;
  metadata?: Record<string, unknown>;
  duration?: number;
  statusCode?: number;
}): ActionLogEntry {
  const meta = params.request ? extractRequestMeta(params.request) : null;

  const entry: ActionLogEntry = {
    id: `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    action: params.action,
    category: params.category,
    userId: params.session?.id,
    userEmail: params.session?.email,
    userName: params.session?.name,
    userRole: params.session?.role,
    details: params.details,
    metadata: params.metadata,
    ip: meta?.ip || "unknown",
    userAgent: meta?.userAgent || "unknown",
    browser: meta?.browser,
    os: meta?.os,
    device: meta?.device,
    referer: meta?.referer,
    acceptLanguage: meta?.acceptLanguage,
    cfCountry: meta?.cfCountry,
    geo: meta?.geo,
    path: params.path,
    method: params.method,
    duration: params.duration,
    statusCode: params.statusCode,
    timestamp: new Date().toISOString(),
  };

  return entry;
}

// ── Public API ───────────────────────────────────────────────────

export async function logAction(params: {
  action: ActionLogAction;
  category: ActionLogCategory;
  details: string;
  path: string;
  method: string;
  request?: Request;
  session?: SessionUser | null;
  metadata?: Record<string, unknown>;
  duration?: number;
  statusCode?: number;
}): Promise<void> {
  const entry = buildEntry(params);

  // Fire-and-forget geo cache warm-up
  lookupGeo(entry.ip).catch(() => {});

  // Write directly to MongoDB — no temp file (serverless-safe)
  try {
    const collection = await getCollection(COLLECTIONS.actionLogs);
    await collection.insertOne(entry as any);
  } catch (err) {
    console.error("[audit-log] Failed to persist entry:", err);
  }
}
