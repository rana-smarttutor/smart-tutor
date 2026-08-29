import "server-only";

import * as cheerio from "cheerio";

export type ExamUpdateType =
  | "Result"
  | "Admit Card"
  | "Answer Key"
  | "Application"
  | "Exam Date"
  | "Recruitment"
  | "Notification";

export type ExamUpdate = {
  id: string;
  title: string;
  source: string;
  sourceKey: string;
  category: string;
  type: ExamUpdateType;
  officialUrl: string;
  publishedLabel?: string;
};

type ExamSource = {
  key: string;
  name: string;
  category: string;
  url: string;
  allowedHosts: string[];
  maxItems: number;
};

const SOURCES: ExamSource[] = [
  {
    key: "ssc",
    name: "SSC",
    category: "Government Exams",
    url: "https://ssc.gov.in/",
    allowedHosts: ["ssc.gov.in"],
    maxItems: 25,
  },
  {
    key: "upsc",
    name: "UPSC",
    category: "Government Exams",
    url: "https://www.upsc.gov.in/whats-new",
    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],
    maxItems: 25,
  },
  {
    key: "nta",
    name: "NTA",
    category: "Entrance Exams",
    url: "https://www.nta.ac.in/",
    allowedHosts: ["nta.ac.in"],
    maxItems: 30,
  },
  {
    key: "ibps",
    name: "IBPS",
    category: "Banking",
    url: "https://www.ibps.in/index.php/recruitment/",
    allowedHosts: ["ibps.in", "ibpsreg.ibps.in"],
    maxItems: 30,
  },
];

export const OFFICIAL_EXAM_SOURCES = SOURCES.map((source) => ({
  key: source.key,
  name: source.name,
  url: source.url,
}));

const RELEVANT_KEYWORDS = [
  "exam",
  "examination",
  "admit card",
  "e-admit",
  "hall ticket",
  "result",
  "answer key",
  "answerkey",
  "application",
  "apply",
  "registration",
  "recruitment",
  "vacancy",
  "notification",
  "notice",
  "time table",
  "timetable",
  "schedule",
  "score",
  "score card",
  "scorecard",
  "marks",
  "merit",
  "interview",
  "counselling",
  "counseling",
  "shortlisted",
  "shortlist",
  "written result",
  "final result",
  "provisional",
  "challenge",
];

const BLOCKED_KEYWORDS = [
  "request for proposal",
  "rfp",
  "tender",
  "procurement",
  "website policy",
  "privacy policy",
  "copyright policy",
  "contact us",
  "about us",
  "annual report",
  "sitemap",
];

const GENERIC_LINK_TEXT =
  /^(read more|view|download|pdf|click here|new|more|details|attachment)$/i;

function cleanText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value: string) {
  return cleanText(value)
    .replace(/\bRead More\b/gi, "")
    .replace(/\bDownload\b/gi, "")
    .replace(/\(\s*\d+(?:\.\d+)?\s*(?:KB|MB)\s*\)/gi, "")
    .replace(/\s+-\s+reg\.?$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isRelevantTitle(title: string) {
  const lower = title.toLowerCase();

  if (BLOCKED_KEYWORDS.some((word) => lower.includes(word))) {
    return false;
  }

  return RELEVANT_KEYWORDS.some((word) => lower.includes(word));
}

function classifyUpdate(title: string): ExamUpdateType {
  const lower = title.toLowerCase();

  if (
    lower.includes("admit card") ||
    lower.includes("e-admit") ||
    lower.includes("hall ticket")
  ) {
    return "Admit Card";
  }

  if (
    lower.includes("answer key") ||
    lower.includes("answerkey") ||
    lower.includes("recorded response")
  ) {
    return "Answer Key";
  }

  if (
    lower.includes("result") ||
    lower.includes("score card") ||
    lower.includes("scorecard") ||
    lower.includes("marks of") ||
    lower.includes("merit list")
  ) {
    return "Result";
  }

  if (
    lower.includes("application") ||
    lower.includes("apply online") ||
    lower.includes("registration") ||
    lower.includes("online form")
  ) {
    return "Application";
  }

  if (
    lower.includes("time table") ||
    lower.includes("timetable") ||
    lower.includes("exam date") ||
    lower.includes("examination date") ||
    lower.includes("schedule")
  ) {
    return "Exam Date";
  }

  if (
    lower.includes("recruitment") ||
    lower.includes("vacancy") ||
    lower.includes("posts of") ||
    lower.includes("post of")
  ) {
    return "Recruitment";
  }

  return "Notification";
}

function stableId(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function extractDateLabel(text: string) {
  const monthPattern =
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

  const patterns = [
    new RegExp(
      `\\b(${monthPattern}\\s+\\d{1,2},?\\s+20\\d{2})\\b`,
      "i",
    ),
    new RegExp(
      `\\b(\\d{1,2}\\s+${monthPattern},?\\s+20\\d{2})\\b`,
      "i",
    ),
    /\b(\d{1,2}[./-]\d{1,2}[./-]20\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return undefined;
}

function isAllowedOfficialUrl(url: URL, source: ExamSource) {
  return source.allowedHosts.some(
    (host) =>
      url.hostname === host ||
      url.hostname.endsWith(`.${host}`),
  );
}

function shouldIgnoreHref(href: string) {
  const normalized = href.trim().toLowerCase();

  return (
    normalized.startsWith("#") ||
    normalized.startsWith("javascript:") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
}

function buildRequestHeaders() {
  return {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  };
}

async function fetchSource(
  source: ExamSource,
): Promise<ExamUpdate[]> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(source.url, {
      next: {
        revalidate: 3600,
      },
      redirect: "follow",
      signal: controller.signal,
      headers: buildRequestHeaders(),
    });

    /*
     * Some official government websites block automated/server-side
     * requests. A blocked source should NEVER break the whole page.
     */
    if (!response.ok) {
      console.warn(
        `[Exam Updates] ${source.name} unavailable: HTTP ${response.status}`,
      );

      return [];
    }

    const contentType =
      response.headers.get("content-type") ?? "";

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      console.warn(
        `[Exam Updates] ${source.name} returned unsupported content type: ${contentType}`,
      );

      return [];
    }

    const html = await response.text();

    if (!html.trim()) {
      return [];
    }

    const $ = cheerio.load(html);

    const updates: ExamUpdate[] = [];
    const seenUrls = new Set<string>();

    $("a[href]").each((_, element) => {
      if (updates.length >= source.maxItems) {
        return false;
      }

      const anchor = $(element);
      const rawHref = anchor.attr("href");

      if (!rawHref) {
        return;
      }

      if (shouldIgnoreHref(rawHref)) {
        return;
      }

      let officialUrl: URL;

      try {
        officialUrl = new URL(rawHref, source.url);
      } catch {
        return;
      }

      if (
        officialUrl.protocol !== "https:" &&
        officialUrl.protocol !== "http:"
      ) {
        return;
      }

      /*
       * Critical:
       * Only links belonging to the actual official authority
       * are allowed onto Smart IQ Institute.
       */
      if (!isAllowedOfficialUrl(officialUrl, source)) {
        return;
      }

      officialUrl.hash = "";

      const finalUrl = officialUrl.toString();

      if (seenUrls.has(finalUrl)) {
        return;
      }

      const anchorText = cleanText(anchor.text());

      const possibleContexts = [
        anchor.closest("tr").first().text(),
        anchor.closest("li").first().text(),
        anchor.closest("article").first().text(),
        anchor.closest("[class*='notice']").first().text(),
        anchor.closest("[class*='news']").first().text(),
        anchor.closest("[class*='update']").first().text(),
        anchor.closest("[class*='card']").first().text(),
        anchor.parent().text(),
        anchor.parent().parent().text(),
      ]
        .map(cleanText)
        .filter(Boolean);

      const contextText =
        possibleContexts.find(
          (text) =>
            text.length >= 12 &&
            text.length <= 500,
        ) ?? "";

      let title = anchorText;

      if (
        !title ||
        title.length < 10 ||
        GENERIC_LINK_TEXT.test(title)
      ) {
        title = contextText;
      }

      title = cleanTitle(title);

      if (title.length > 220) {
        title = `${title.slice(0, 217)}...`;
      }

      if (title.length < 12) {
        return;
      }

      if (!isRelevantTitle(title)) {
        return;
      }

      seenUrls.add(finalUrl);

      updates.push({
        id: `${source.key}-${stableId(finalUrl)}`,
        title,
        source: source.name,
        sourceKey: source.key,
        category: source.category,
        type: classifyUpdate(title),
        officialUrl: finalUrl,
        publishedLabel: extractDateLabel(contextText),
      });
    });

    return updates;
  } catch (error) {
    /*
     * Never use console.error here.
     * Next.js dev mode can display it as a red error overlay.
     */
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      console.warn(
        `[Exam Updates] ${source.name} request timed out.`,
      );

      return [];
    }

    console.warn(
      `[Exam Updates] ${source.name} temporarily unavailable.`,
      error instanceof Error ? error.message : String(error),
    );

    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function interleaveUpdates(
  groups: ExamUpdate[][],
  limit = 80,
) {
  const output: ExamUpdate[] = [];
  const seen = new Set<string>();

  let position = 0;

  while (output.length < limit) {
    let addedSomething = false;

    for (const group of groups) {
      const item = group[position];

      if (!item) {
        continue;
      }

      addedSomething = true;

      if (!seen.has(item.officialUrl)) {
        seen.add(item.officialUrl);
        output.push(item);
      }

      if (output.length >= limit) {
        break;
      }
    }

    if (!addedSomething) {
      break;
    }

    position += 1;
  }

  return output;
}

export async function getExamUpdates() {
  /*
   * Promise.all is safe because fetchSource handles its own
   * failures and always returns an array.
   *
   * Therefore:
   * UPSC blocked → []
   * IBPS unavailable → []
   * SSC works → SSC data displayed
   * NTA works → NTA data displayed
   */
  const groups = await Promise.all(
    SOURCES.map((source) => fetchSource(source)),
  );

  return interleaveUpdates(groups);
}