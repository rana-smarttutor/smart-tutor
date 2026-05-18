import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

global.smartTutorMaterials = global.smartTutorMaterials || [];

const MAX_RELEVANT_CHUNKS = 8;
const MAX_CONTEXT_CHARACTERS = 12000;

function findRelevantMaterial(question) {
  const materials = global.smartTutorMaterials || [];

  if (!materials.length) {
    return "";
  }

  const lowerQuestion = question.toLowerCase();

  const questionWords = lowerQuestion
    .split(/\W+/)
    .filter((word) => word.length > 3);

  const wantsAllMaterial =
    lowerQuestion.includes("summarize all") ||
    lowerQuestion.includes("summary of all") ||
    lowerQuestion.includes("all uploaded") ||
    lowerQuestion.includes("all materials") ||
    lowerQuestion.includes("all files") ||
    lowerQuestion.includes("revision plan") ||
    lowerQuestion.includes("mcq");

  const scoredChunks = [];

  for (const material of materials) {
    for (const chunk of material.chunks || []) {
      const lowerChunk = chunk.toLowerCase();
      let score = 0;

      if (wantsAllMaterial) {
        score += 1;
      }

      for (const word of questionWords) {
        if (lowerChunk.includes(word)) {
          score += 2;
        }
      }

      if (
        material.fileName &&
        lowerQuestion.includes(material.fileName.toLowerCase())
      ) {
        score += 5;
      }

      if (score > 0) {
        scoredChunks.push({
          score,
          fileName: material.fileName,
          sourceType: material.sourceType || "uploaded-material",
          text: chunk,
        });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);

  let context = "";

  for (const item of scoredChunks.slice(0, MAX_RELEVANT_CHUNKS)) {
    const block = `From file "${item.fileName}" (${item.sourceType}):\n${item.text}\n\n`;

    if ((context + block).length > MAX_CONTEXT_CHARACTERS) {
      break;
    }

    context += block;
  }

  return context.trim();
}

const systemPrompt = `
You are SmartTutor AI Assistant, the official AI education assistant for Smart Tutor. Be short and to the point.

Your role is to help students, parents, and educators with:
- Study questions
- Course recommendations
- Exam preparation
- Study timetables
- Mock test guidance
- Smart Tutor services
- Admission and course guidance

Smart Tutor services:
- School board preparation
- Junior college / HSC support
- College academic support
- Government exam preparation
- MPSC / UPSC foundation guidance
- Banking, SSC, railway, and aptitude preparation
- Career Launch Studio for placement preparation
- Mock tests
- Digital study library
- Weekly assessments
- 1-on-1 mentoring
- Parent progress communication
- Resume, GDPI, aptitude, and interview preparation

Rules:
- Always reply only in simple clear English.
- Even if the user writes in Hinglish, Hindi, or mixed language, reply in English only.
- Do not use Hinglish or Hindi words like "aap", "mujhe", "batao", "padhai", "karna", "hai", "kya".
- Be friendly, practical, student-focused, and action-oriented.
- Do not sound robotic.
- Do not be too pushy while recommending Smart Tutor services.
- Never promise guaranteed marks, rank, admission, job, or selection.
- Do not say "100% result", "guaranteed selection", or "sure success".
- If uploaded material is relevant, answer using it first.
- If uploaded material is relevant, start with: "According to the uploaded Smart Tutor material..."
- If uploaded material is not relevant, answer using general educational knowledge.
- Keep answers short, clear, and practical.
`;

async function tryOpenAI(input) {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OpenAI API Key");
  
  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: input }],
    temperature: 0.5,
  });

  return response.choices[0].message.content;
}

async function tryGemini(input) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing Gemini API Key");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(input);
  const response = await result.response;
  return response.text();
}

export async function POST(req) {
  try {
    const { message, memory, history } = await req.json();

    const relevantMaterial = findRelevantMaterial(message);

    const memoryText = `
Session memory:
Student name: ${memory?.name || "Not provided"}
Student class: ${memory?.classGrade || "Not provided"}
Target exam: ${memory?.targetExam || "Not provided"}
Weak subject: ${memory?.weakSubject || "Not provided"}
Preferred language: English only
Study goal: ${memory?.studyGoal || "Not provided"}
Course interest: ${memory?.courseInterest || "Not provided"}
`;

    const recentHistory = (history || [])
      .slice(-8)
      .map((item) => {
        const speaker = item.role === "assistant" ? "Assistant" : "Student";
        return `${speaker}: ${item.content}`;
      })
      .join("\n");

    const input = `
${systemPrompt}

${memoryText}

Uploaded Smart Tutor material:
${relevantMaterial
        ? relevantMaterial
        : "No relevant uploaded material found for this question."
      }

Previous conversation:
${recentHistory}

Student's latest message:
${message}

Now reply as SmartTutor AI Assistant.
`;

    let reply = "";
    let method = "openai";

    try {
      reply = await tryOpenAI(input);
    } catch (error) {
      console.error("OpenAI failed, falling back to Gemini:", error.message);
      try {
        reply = await tryGemini(input);
        method = "gemini";
      } catch (geminiError) {
        console.error("Gemini also failed:", geminiError.message);
        throw new Error("Both AI services are currently unavailable.");
      }
    }

    return Response.json({
      reply: reply || "I can help with study doubts, courses, exams, mock tests, and Smart Tutor services.",
      method
    });
  } catch (error) {
    console.error("SmartTutor Chat API error:", error);

    return Response.json(
      {
        reply: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
