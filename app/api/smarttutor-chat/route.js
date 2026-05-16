import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Using global to persist material in-memory across requests in dev
// In production, consider a more robust store if needed
if (!global.smartTutorMaterials) {
  global.smartTutorMaterials = [];
}

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

      if (lowerQuestion.includes(material.fileName?.toLowerCase?.() || "")) {
        score += 5;
      }

      if (score > 0) {
        scoredChunks.push({
          score,
          fileName: material.fileName,
          sourceType: material.sourceType || "unknown",
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
You are SmartTutor AI Assistant, the official AI education assistant for Smart Tutor.

Smart Tutor Institute Details:
- Name: Smart Tutor (part of SmartIQ Academy & Prime Digital School)
- Director & Founder: Prof. Ravi Rana
- Location: Sector 17, Vashi, Navi Mumbai (primarily serves Vashi, Navi Mumbai, and Thane)
- Hours: Mon - Sat | 08:00 AM - 08:30 PM
- Contact: +91 88504 47887 | admissions@smarttutor.in
- Specialties: School Coaching, Competitive Exams, Civil Services

Our Programs & Courses:
1. Primary School Foundation (Class 1-5): Concept clarity, reading, numeracy, and homework support.
2. Middle School Foundation (Class 6-8): Subject clarity, strong habits, and worksheet practice.
3. Board Preparation (Class 9-10): Chapter-wise completion, prelim paper solving, and answer-writing guidance.
4. Senior Secondary/Junior College (Class 11-12 & JC): Stream-wise (Commerce, Science, Arts) board preparation and mentoring.
5. Diploma, Polytechnic & Graduation Support: Semester preparation, aptitude, communication, and placement readiness.
6. Entrance Exams: JEE (Foundation/Advanced), NEET-UG, MHT-CET, CUET.
7. Government & Competitive Exams: UPSC Foundation, State PSC (MPSC), Banking (IBPS/SBI), SSC CGL/GD, Railway Recruitment.
8. Skill Development: Spoken English & Personality Development, Career Launch Studio.

Smart Tutor Features:
- Small-batch mentoring (max 25+ expert mentors)
- Disciplined weekly testing and mock paper analysis
- Digital study library and recorded revision
- 1-on-1 mentoring and parent-teacher communication
- Success rate: 94% with 500+ active students

Your role is to help students, parents, and educators with study questions, course recommendations, exam preparation, and Smart Tutor services.

Rules:
- Always reply only in simple clear English.
- EXTREME CONCISENESS IS MANDATORY: Provide very short and direct answers (maximum 1-2 sentences).
- Even if the user writes in Hinglish, Hindi, or mixed language, reply in English only.
- Be friendly, practical, student-focused, and action-oriented.
- If a question is outside education or Smart Tutor services, politely redirect the user.
- Always offer to help more at the end of your response.
`;

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        reply:
          "Gemini API key is missing. Please add GEMINI_API_KEY in .env.local and restart the server.",
      });
    }

    const { message, memory, history, isExpanded } = await req.json();

    const relevantMaterial = findRelevantMaterial(message);

    const projectContext = isExpanded ? `
PROJECT INFO (Expanded Context):
- App: Smart Tutor (Vashi-based institute)
- Tech: Next.js 16 (App Router), React 19, MongoDB.
- Roles: Student, Educator, Admin.
- Founder: Prof. Ravi Rana.
- Features: Dashboard, course catalog, mock tests, parent comms.
- Goal: Concept clarity & career readiness.
` : "";

    const memoryText = `
Session memory:
Student name: ${memory?.name || "Not provided"}
Student class: ${memory?.classGrade || "Not provided"}
Target exam: ${memory?.targetExam || "Not provided"}
Weak subject: ${memory?.weakSubject || "Not provided"}
Preferred language: ${memory?.preferredLanguage || "Not provided"}
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

    const prompt = `
${systemPrompt}

${projectContext}

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

Now reply as SmartTutor AI Assistant. REMEMBER: Keep it extremely short (max 1-2 sentences).
`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let replyText = "";

    // Check if result has the expected text property (Direct text extraction)
    if (result && typeof result.text === "string") {
      replyText = result.text;
    }
    // Check if it's the standard SDK structure (candidates -> content -> parts -> text)
    else if (result && result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      replyText = result.candidates[0].content.parts[0].text;
    }
    // Fallback if structure is slightly different
    else if (result && result.response && typeof result.response.text === "function") {
      replyText = result.response.text();
    }

    return Response.json({
      reply:
        replyText.trim() ||
        "I can help with study doubts, courses, exams, mock tests, and Smart Tutor services. Could you please rephrase your question?",
    });
  } catch (error) {
    console.error("SmartTutor Gemini API error:", error);

    const message = error?.message || "";

    let reply =
      "I'm here to guide you with Smart Tutor's services. Please feel free to ask about our classes, subjects, exam goals, study plans, mock tests, uploaded materials, or course recommendations.";

    if (
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.toLowerCase().includes("quota")
    ) {
      reply =
        "Gemini quota is currently exhausted. Uploaded PDF/DOCX/TXT extraction can still work locally, but AI answering and image understanding need Gemini quota. Please wait and try again, or add billing/increase quota in Google AI Studio.";
    }

    return Response.json({
      reply,
      error: message,
    });
  }
}
