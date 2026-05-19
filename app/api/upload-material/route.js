import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

global.smartTutorsMaterials = global.smartTutorsMaterials || [];

const MAX_TOTAL_FILES = 10;
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const CHUNK_SIZE = 1600;
const MAX_CHUNKS_PER_FILE = 80;

function splitIntoChunks(text, chunkSize = CHUNK_SIZE) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const chunks = [];

  for (let i = 0; i < cleanText.length; i += chunkSize) {
    chunks.push(cleanText.slice(i, i + chunkSize));
  }

  return chunks.slice(0, MAX_CHUNKS_PER_FILE);
}

function cleanErrorMessage(error) {
  const message = error?.message || String(error);

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  ) {
    return "Image analysis needs Gemini Vision quota. Your Gemini free-tier quota is currently exhausted. PDF, DOCX, and TXT files can still be uploaded because they are analyzed locally.";
  }

  return message;
}

async function extractPdfText(buffer) {
  try {
    /*
      Important:
      Do NOT import pdf-parse at the top.
      In Next.js/Turbopack, top-level import may cause:
      test/data/05-versions-space.pdf missing error.
    */
    const pdfModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = pdfModule.default || pdfModule;

    const data = await pdf(buffer);
    return data.text || "";
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

function isImageFile(fileType, fileName) {
  const lowerFileName = fileName.toLowerCase();

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tiff",
    ".tif",
    ".svg",
    ".heic",
    ".heif",
    ".avif",
  ];

  return (
    fileType.startsWith("image/") ||
    imageExtensions.some((extension) => lowerFileName.endsWith(extension))
  );
}

async function extractTextFromDocumentFile(file) {
  const fileName = file.name || "uploaded-material";
  const fileType = file.type || "";
  const lowerFileName = fileName.toLowerCase();

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      fileName,
      message: `${fileName} is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";

  if (fileType.includes("pdf") || lowerFileName.endsWith(".pdf")) {
    extractedText = await extractPdfText(buffer);
  } else if (fileType.includes("word") || lowerFileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || "";
  } else if (fileType.includes("text") || lowerFileName.endsWith(".txt")) {
    extractedText = buffer.toString("utf-8");
  } else {
    return {
      success: false,
      fileName,
      message: `${fileName} is unsupported. Please upload PDF, DOCX, TXT, or image files.`,
    };
  }

  if (!extractedText || extractedText.trim().length < 20) {
    return {
      success: false,
      fileName,
      message: `Could not extract readable text from ${fileName}. If this is a scanned/image-based PDF, upload page screenshots/images. Image analysis needs Gemini Vision quota.`,
    };
  }

  const chunks = splitIntoChunks(extractedText);

  global.smartTutorsMaterials.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName,
    uploadedAt: new Date().toISOString(),
    characters: extractedText.length,
    chunks,
    sourceType: "local-document",
  });

  return {
    success: true,
    fileName,
    chunks: chunks.length,
    characters: extractedText.length,
    analysisType: "Local extraction",
  };
}

async function analyzeImagesInOneGeminiCall(imageFiles) {
  if (!imageFiles.length) return [];

  if (!process.env.GEMINI_API_KEY) {
    return imageFiles.map((file) => ({
      success: false,
      fileName: file.name || "image-file",
      message:
        "Image analysis needs Gemini Vision quota. GEMINI_API_KEY is missing. PDF, DOCX, and TXT files still work with local extraction.",
    }));
  }

  const validImageFiles = imageFiles.filter(
    (file) => file.size <= MAX_FILE_SIZE_BYTES
  );

  const oversizedImageFiles = imageFiles.filter(
    (file) => file.size > MAX_FILE_SIZE_BYTES
  );

  if (!validImageFiles.length) {
    return imageFiles.map((file) => ({
      success: false,
      fileName: file.name || "image-file",
      message: `${file.name} is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    }));
  }

  const parts = [];

  parts.push({
    text: `
You are Smart Tutors AI Assistant analyzing uploaded study-material images.

The user uploaded ${validImageFiles.length} image(s).

Important:
- Analyze ALL images.
- Read visible text and handwriting.
- Explain diagrams, charts, tables, graphs, formulas, screenshots, and textbook pages.
- Convert notes into clean study notes.
- If anything is unclear, mention it.
- Keep the answer useful for later question-answering.

Return your answer in this exact format:

### FILE: exact file name
Extracted content:
...

### FILE: exact file name
Extracted content:
...

File names in order:
${validImageFiles.map((file, index) => `${index + 1}. ${file.name}`).join("\n")}
`,
  });

  for (const file of validImageFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    parts.push({
      inlineData: {
        mimeType: file.type || "image/jpeg",
        data: base64Image,
      },
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(parts);
    const response = await result.response;
    const batchAnalysis = response.text() || "";

    if (!batchAnalysis.trim()) {
      return imageFiles.map((file) => ({
        success: false,
        fileName: file.name || "image-file",
        message: "Could not analyze this image.",
      }));
    }

    const successfulResults = validImageFiles.map((file) => {
      const fileName = file.name || "image-file";

      const extractedText = `
Image file: ${fileName}

This image was analyzed using Gemini Vision as part of a multi-image upload.

Full batch image analysis:
${batchAnalysis}
`;

      const chunks = splitIntoChunks(extractedText);

      global.smartTutorsMaterials.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        fileName,
        uploadedAt: new Date().toISOString(),
        characters: extractedText.length,
        chunks,
        sourceType: "gemini-vision-image",
      });

      return {
        success: true,
        fileName,
        chunks: chunks.length,
        characters: extractedText.length,
        analysisType: "Gemini Vision",
      };
    });

    const oversizedResults = oversizedImageFiles.map((file) => ({
      success: false,
      fileName: file.name || "image-file",
      message: `${file.name} is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    }));

    return [...successfulResults, ...oversizedResults];
  } catch (error) {
    const cleanMessage = cleanErrorMessage(error);

    return imageFiles.map((file) => ({
      success: false,
      fileName: file.name || "image-file",
      message: cleanMessage,
    }));
  }
}

export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, message: "Login required." }, { status: 401 });
    }

    const formData = await req.formData();

    let files = formData.getAll("files");

    if (!files || files.length === 0) {
      const singleFile = formData.get("file");
      files = singleFile ? [singleFile] : [];
    }

    files = files.filter(Boolean);

    if (!files.length) {
      return Response.json({
        success: false,
        message: "No files received by server.",
        uploaded: [],
        failed: [],
        totalStoredFiles: global.smartTutorsMaterials.length,
        remainingSlots: MAX_TOTAL_FILES - global.smartTutorsMaterials.length,
      });
    }

    if (files.length > 10) {
      return Response.json({
        success: false,
        message: "You can upload maximum 10 files at once.",
        uploaded: [],
        failed: files.map((file) => ({
          success: false,
          fileName: file.name || "unknown-file",
          message: "Maximum 10 files allowed at once.",
        })),
        totalStoredFiles: global.smartTutorsMaterials.length,
        remainingSlots: MAX_TOTAL_FILES - global.smartTutorsMaterials.length,
      });
    }

    const currentCount = global.smartTutorsMaterials.length;
    const remainingSlots = MAX_TOTAL_FILES - currentCount;

    if (remainingSlots <= 0) {
      return Response.json({
        success: false,
        message:
          "Upload limit reached. You already have 10 files uploaded. Please remove files before uploading new ones.",
        uploaded: [],
        failed: files.map((file) => ({
          success: false,
          fileName: file.name || "unknown-file",
          message: "Upload limit reached.",
        })),
        totalStoredFiles: currentCount,
        remainingSlots: 0,
      });
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const skippedFiles = files.slice(remainingSlots);

    const imageFiles = [];
    const documentFiles = [];

    for (const file of filesToProcess) {
      const fileName = file.name || "";
      const fileType = file.type || "";

      if (isImageFile(fileType, fileName)) {
        imageFiles.push(file);
      } else {
        documentFiles.push(file);
      }
    }

    const results = [];

    // PDF / DOCX / TXT: local extraction, no Gemini quota used.
    for (const file of documentFiles) {
      try {
        const result = await extractTextFromDocumentFile(file);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          fileName: file.name || "unknown-file",
          message: cleanErrorMessage(error),
        });
      }
    }

    // Images/screenshots/diagrams: Gemini Vision, quota required.
    const imageResults = await analyzeImagesInOneGeminiCall(imageFiles);
    results.push(...imageResults);

    const skipped = skippedFiles.map((file) => ({
      success: false,
      fileName: file.name || "unknown-file",
      message: `Skipped because total upload limit is ${MAX_TOTAL_FILES} files.`,
    }));

    const allResults = [...results, ...skipped];
    const uploaded = allResults.filter((item) => item.success);
    const failed = allResults.filter((item) => !item.success);

    return Response.json({
      success: uploaded.length > 0,
      message:
        uploaded.length > 0
          ? `${uploaded.length} file(s) uploaded successfully.`
          : "No files could be uploaded.",
      uploaded,
      failed,
      totalStoredFiles: global.smartTutorsMaterials.length,
      remainingSlots: MAX_TOTAL_FILES - global.smartTutorsMaterials.length,
      maxFiles: MAX_TOTAL_FILES,
      note:
        "PDF, DOCX, and TXT are analyzed locally. Images/screenshots/diagrams need Gemini Vision quota.",
    });
  } catch (error) {
    console.error("Material upload error:", error);

    return Response.json({
      success: false,
      message: "Material upload failed.",
      error: cleanErrorMessage(error),
      uploaded: [],
      failed: [],
      totalStoredFiles: global.smartTutorsMaterials.length,
      remainingSlots: MAX_TOTAL_FILES - global.smartTutorsMaterials.length,
    });
  }
}

export async function DELETE() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  global.smartTutorsMaterials = [];

  return Response.json({
    success: true,
    message: "All uploaded study materials removed successfully.",
    totalStoredFiles: 0,
    remainingSlots: MAX_TOTAL_FILES,
  });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return Response.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const materials = global.smartTutorsMaterials || [];

  return Response.json({
    success: true,
    totalFiles: materials.length,
    remainingSlots: MAX_TOTAL_FILES - materials.length,
    maxFiles: MAX_TOTAL_FILES,
    files: materials.map((item) => ({
      id: item.id,
      fileName: item.fileName,
      uploadedAt: item.uploadedAt,
      chunks: item.chunks.length,
      characters: item.characters,
      sourceType: item.sourceType || "unknown",
    })),
  });
}