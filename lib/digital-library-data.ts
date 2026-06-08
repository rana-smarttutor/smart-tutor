import { list } from "@vercel/blob";

export type DigitalLibraryBook = {
  id: string;
  title: string;
  description: string;
  price: string;
  fileName: string;
  pathname: string;
  categoryId?: string;
  categoryLabel?: string;
  url?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
};

const DEFAULT_BOOK_DESCRIPTION =
  "Access this PDF study material for focused learning and revision.";

const DEFAULT_CATEGORY_ID = "school-learning";
const DEFAULT_CATEGORY_LABEL = "School Learning Library";

const CATEGORY_LABELS: Record<string, string> = {
  "school-learning": "School Learning Library",
  "competitive-exam": "All Competitive Exam Library",
  "government-exam": "All Government Exam Library",
  fiction: "Fiction Books Library",
  "non-fiction": "Non-Fiction Books Library",
  biography: "Biography & Autobiography Library",
  "personality-development": "Personality Development Library",
  "spoken-english": "Spoken English Library",
  "technology-ai": "Technology & AI Library",
  "career-placement": "Career & Placement Library",
};

function displayPrice(rawPrice: string) {
  if (rawPrice === "free" || Number(rawPrice) <= 0) {
    return "Free";
  }

  return `₹${Number(rawPrice).toLocaleString("en-IN")}`;
}

function humanizeSlug(value: string) {
  return decodeURIComponent(value || "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessCategoryFromText(text: string) {
  const value = text.toLowerCase().replace(/[_-]/g, " ");

  if (
    [
      "python",
      "computer",
      "coding",
      "programming",
      "ai",
      "deep learning",
      "machine learning",
      "data",
      "analytics",
      "google analytics",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "technology-ai",
      categoryLabel: CATEGORY_LABELS["technology-ai"],
    };
  }

  if (
    [
      "banking",
      "railway",
      "ssc cgl",
      "government",
      "upsc",
      "mpsc",
      "ibps",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "government-exam",
      categoryLabel: CATEGORY_LABELS["government-exam"],
    };
  }

  if (
    ["jee", "neet", "cet", "entrance", "competitive"].some((keyword) =>
      value.includes(keyword),
    )
  ) {
    return {
      categoryId: "competitive-exam",
      categoryLabel: CATEGORY_LABELS["competitive-exam"],
    };
  }

  if (
    [
      "algebra",
      "trigonometry",
      "chemistry",
      "physics",
      "calculus",
      "economics",
      "science",
      "school",
      "cbse",
      "ssc",
      "hsc",
    ].some((keyword) => value.includes(keyword))
  ) {
    return {
      categoryId: "school-learning",
      categoryLabel: CATEGORY_LABELS["school-learning"],
    };
  }

  return {
    categoryId: DEFAULT_CATEGORY_ID,
    categoryLabel: DEFAULT_CATEGORY_LABEL,
  };
}

function parseNewBookPath(pathname: string) {
  const value = pathname
    .replace("digital-library/books/", "")
    .replace(/\.pdf$/i, "");

  const [id, rawPrice = "free", thirdPart = "", fourthPart = "", ...restParts] =
    value.split("__");

  let categoryId = "";
  let categoryLabel = "";
  let storedDescription = "";
  let storedTitle = "";

  // New format:
  // timestamp__price__sectionId__description__title
  if (restParts.length > 0) {
    categoryId = thirdPart || DEFAULT_CATEGORY_ID;
    categoryLabel = CATEGORY_LABELS[categoryId] || humanizeSlug(categoryId);
    storedDescription = fourthPart || "";
    storedTitle = restParts.join("__");
  } else if (fourthPart) {
    // Old description format:
    // timestamp__price__description__title
    storedDescription = thirdPart || "";
    storedTitle = fourthPart;
    const guessed = guessCategoryFromText(`${storedTitle} ${storedDescription}`);
    categoryId = guessed.categoryId;
    categoryLabel = guessed.categoryLabel;
  } else {
    // Old format:
    // timestamp__price__title
    storedTitle = thirdPart;
    const guessed = guessCategoryFromText(storedTitle);
    categoryId = guessed.categoryId;
    categoryLabel = guessed.categoryLabel;
  }

  const thumbnailKey =
    restParts.length > 0
      ? `${id}__${rawPrice}__${categoryId}__${storedDescription}__${storedTitle}`
      : fourthPart
        ? `${id}__${rawPrice}__${storedDescription}__${storedTitle}`
        : `${id}__${rawPrice}__${storedTitle}`;

  return {
    thumbnailKey,
    title: humanizeSlug(storedTitle),
    description:
      humanizeSlug(storedDescription) || DEFAULT_BOOK_DESCRIPTION,
    fileName: `${storedTitle}.pdf`,
    price: displayPrice(rawPrice),
    categoryId,
    categoryLabel,
  };
}

function parseOldBookPath(pathname: string) {
  const rawName = pathname.replace("digital-library/", "");
  const parts = rawName.split("-");

  const possibleTimestamp = parts[0] || "";
  const hasTimestamp = /^\d{10,}$/.test(possibleTimestamp);

  const possiblePrice = hasTimestamp ? parts[1] || "free" : "free";
  const hasPrice = possiblePrice === "free" || /^\d+$/.test(possiblePrice);

  const fileName =
    hasTimestamp && hasPrice
      ? parts.slice(2).join("-") || rawName
      : hasTimestamp
        ? parts.slice(1).join("-") || rawName
        : rawName;

  const title = fileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
  const guessed = guessCategoryFromText(title);

  return {
    title,
    description: DEFAULT_BOOK_DESCRIPTION,
    fileName,
    price: hasTimestamp && hasPrice ? displayPrice(possiblePrice) : "Free",
    categoryId: guessed.categoryId,
    categoryLabel: guessed.categoryLabel,
  };
}

export async function getDigitalLibraryBooks(
  canAccessPdf: boolean,
): Promise<DigitalLibraryBook[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  const { blobs } = await list({
    prefix: "digital-library/",
    token,
  });

  const thumbnailMap = new Map(
    blobs
      .filter((blob) =>
        blob.pathname.startsWith("digital-library/thumbnails/"),
      )
      .map((blob) => {
        const thumbnailKey = blob.pathname
          .replace("digital-library/thumbnails/", "")
          .replace(/\.(png|jpg|jpeg|webp)$/i, "");

        return [thumbnailKey, blob.url];
      }),
  );

  const newBooks: DigitalLibraryBook[] = blobs
    .filter(
      (blob) =>
        blob.pathname.startsWith("digital-library/books/") &&
        blob.pathname.toLowerCase().endsWith(".pdf"),
    )
    .map((blob) => {
      const parsed = parseNewBookPath(blob.pathname);

      return {
        id: encodeURIComponent(blob.pathname),
        title: parsed.title,
        description: parsed.description,
        price: parsed.price,
        fileName: parsed.fileName,
        pathname: blob.pathname,
        categoryId: parsed.categoryId,
        categoryLabel: parsed.categoryLabel,
        url: canAccessPdf ? blob.url : undefined,
        downloadUrl: canAccessPdf ? blob.downloadUrl || blob.url : undefined,
        thumbnailUrl: thumbnailMap.get(parsed.thumbnailKey),
        uploadedAt: new Date(blob.uploadedAt).toISOString(),
      };
    });

  const oldBooks: DigitalLibraryBook[] = blobs
    .filter((blob) => /^digital-library\/[^/]+\.pdf$/i.test(blob.pathname))
    .map((blob) => {
      const parsed = parseOldBookPath(blob.pathname);

      return {
        id: encodeURIComponent(blob.pathname),
        title: parsed.title,
        description: parsed.description,
        price: parsed.price,
        fileName: parsed.fileName,
        pathname: blob.pathname,
        categoryId: parsed.categoryId,
        categoryLabel: parsed.categoryLabel,
        url: canAccessPdf ? blob.url : undefined,
        downloadUrl: canAccessPdf ? blob.downloadUrl || blob.url : undefined,
        thumbnailUrl: undefined,
        uploadedAt: new Date(blob.uploadedAt).toISOString(),
      };
    });

  return [...newBooks, ...oldBooks].sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );
}