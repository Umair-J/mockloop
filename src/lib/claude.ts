/**
 * Claude API client for MockLoop interview analysis.
 *
 * - Uses @anthropic-ai/sdk
 * - Exponential backoff with max 3 retries
 * - Returns typed AnalysisResult or throws
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  buildAnalysisPrompt,
  PROMPT_VERSION,
  type AnalysisResult,
  type TranscriptEntry,
} from "@/lib/prompts/analysis-v1";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return _client;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AnalyzeTranscriptResult {
  analysis: AnalysisResult;
  model: string;
  promptVersion: string;
  rawResponse: unknown;
}

/**
 * Send a transcript to Claude for analysis.
 * Retries up to 3 times with exponential backoff on failure.
 */
export async function analyzeTranscript(
  transcript: TranscriptEntry[],
  intervieweeName?: string
): Promise<AnalyzeTranscriptResult> {
  const client = getClient();
  const prompt = buildAnalysisPrompt(transcript, intervieweeName);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(
        `[Claude] Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`
      );
      await sleep(delay);
    }

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract text content from response
      const textBlock = response.content.find(
        (block) => block.type === "text"
      );
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      // Parse JSON — Claude may wrap it in ```json ... ```
      let jsonText = textBlock.text.trim();
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonText = fenceMatch[1].trim();
      }

      const analysis = JSON.parse(jsonText) as AnalysisResult;

      // Basic validation
      if (!analysis.scores || !analysis.strengths || !analysis.weaknesses) {
        throw new Error("Response missing required fields");
      }

      return {
        analysis,
        model: CLAUDE_MODEL,
        promptVersion: PROMPT_VERSION,
        rawResponse: response,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `[Claude] Attempt ${attempt + 1} failed:`,
        lastError.message
      );

      // Don't retry on non-retryable errors
      if (
        error instanceof Anthropic.BadRequestError ||
        error instanceof Anthropic.AuthenticationError
      ) {
        throw lastError;
      }
    }
  }

  throw new Error(
    `Claude analysis failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}
