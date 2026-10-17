
type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

export async function generateGroqQuizJson(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    schema?: Record<string, unknown>;
    schemaName?: string;
  } = {},
): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is missing from the server environment.",
    );
  }

  const model =
    process.env.GROQ_QUESTION_MODEL?.trim() ||
    "openai/gpt-oss-120b";

  const responseFormat = options.schema
    ? {
        type: "json_schema",
        json_schema: {
          name: options.schemaName || "quiz_response",
          strict: true,
          schema: options.schema,
        },
      }
    : {
        type: "json_object",
      };

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are SmartIQ Institute's educational question generation and review assistant. Follow the provided academic constraints carefully. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature ?? 0.3,
        max_completion_tokens: options.maxTokens ?? 8192,
        response_format: responseFormat,
      }),
      signal: AbortSignal.timeout(60000),
    },
  );

  const data = (await response.json()) as GroqResponse;

  if (!response.ok) {
    const message =
      data.error?.message ||
      `Groq request failed with HTTP ${response.status}`;

    console.error("Groq quiz generation failed", {
      status: response.status,
      model,
      message,
    });

    throw new Error(
      response.status === 429
        ? "Groq rate limit reached. Please try again later."
        : `Groq generation failed: ${message}`,
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("Groq returned invalid JSON.");
  }
}
