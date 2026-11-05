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

export class GroqRateLimitError extends Error {
  readonly status = 429;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds = 15) {
    super("Groq rate limit reached. Please try again shortly.");
    this.name = "GroqRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getRetryDelay(response: Response, message: string): number {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.ceil(seconds * 1000);
    }

    const retryDate = Date.parse(retryAfter);

    if (Number.isFinite(retryDate)) {
      return Math.max(0, retryDate - Date.now());
    }
  }

  const match = message.match(/try again in\s+([\d.]+)\s*s/i);

  if (match) {
    return Math.ceil(Number(match[1]) * 1000);
  }

  return 15000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    throw new Error("GROQ_API_KEY is missing from the server environment.");
  }

  const model =
    process.env.GROQ_QUESTION_MODEL?.trim() || "openai/gpt-oss-120b";

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

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

    if (response.status === 429) {
      const message = data.error?.message ?? "";
      const delay = getRetryDelay(response, message);

      console.warn("Groq rate limit reached", {
        model,
        attempt,
        maxAttempts,
        retryAfterMs: delay,
      });

      if (attempt < maxAttempts && delay <= 30000) {
        await sleep(Math.max(1000, delay + 1000));
        continue;
      }

      throw new GroqRateLimitError(Math.max(1, Math.ceil(delay / 1000)));
    }

    if (!response.ok) {
      const message =
        data.error?.message ||
        `Groq request failed with HTTP ${response.status}`;

      console.error("Groq quiz generation failed", {
        status: response.status,
        model,
        message,
      });

      throw new Error(`Groq generation failed: ${message}`);
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

  throw new GroqRateLimitError();
}
