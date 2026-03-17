/**
 * MockLoop AI Analysis Prompt — Version 1
 *
 * Versioned prompt template for Claude-powered interview analysis.
 * Each scoring dimension has rubric anchors so the model grades consistently.
 */

export const PROMPT_VERSION = "analysis-v1" as const;

export interface TranscriptEntry {
  speaker: string;
  role: "interviewer" | "interviewee";
  text: string;
  timestamp?: string;
}

export interface AnalysisScores {
  star_structure: number;
  clarity: number;
  depth: number;
  confidence: number;
  strategic_thinking: number;
  active_listening: number;
}

export interface StrengthOrWeakness {
  text: string;
  evidence: string;
  timestamp_range?: string;
}

export interface Recommendation {
  text: string;
  priority: "high" | "medium" | "low";
}

export interface AnalysisResult {
  scores: AnalysisScores;
  strengths: StrengthOrWeakness[];
  weaknesses: StrengthOrWeakness[];
  recommendations: Recommendation[];
  overall_summary: string;
}

export function buildAnalysisPrompt(
  transcript: TranscriptEntry[],
  intervieweeName?: string
): string {
  const formattedTranscript = transcript
    .map(
      (entry) =>
        `[${entry.timestamp ?? "??:??"}] ${entry.speaker} (${entry.role}): ${entry.text}`
    )
    .join("\n");

  return `You are an expert interview coach analyzing a mock interview transcript. Evaluate the INTERVIEWEE's performance only — the interviewer's questions are context.

## Scoring Dimensions (1–10 scale, 0.5 increments)

### 1. STAR Structure
How well the interviewee uses Situation → Task → Action → Result format.
- **3:** Answers are unstructured; jumps between topics without a narrative arc
- **5:** Some structure present but inconsistent; may skip Situation or Result
- **7:** Most answers follow STAR; occasionally misses one element
- **9:** Every behavioral answer has a clear, complete STAR arc with smooth transitions

### 2. Clarity & Conciseness
Directness and absence of filler, rambling, or tangents.
- **3:** Frequent rambling, excessive filler words ("um", "like"), answers exceed 3+ minutes without adding value
- **5:** Moderately clear but includes unnecessary tangents or repetition
- **7:** Direct and focused; minor filler but doesn't derail the answer
- **9:** Crisp, precise answers; every sentence adds value; no wasted words

### 3. Depth of Examples
Concrete details: named tools/frameworks, specific numbers, real outcomes.
- **3:** Vague, generic answers ("I improved the process"); no specifics
- **5:** Some details but missing quantification or named technologies
- **7:** Good specifics (named tools, team sizes, timelines); occasional quantified outcomes
- **9:** Rich detail — exact metrics ("reduced latency from 800ms to 120ms"), named stakeholders, specific technologies, clear before/after

### 4. Confidence & Delivery
Decisive language, appropriate assertion, ownership of achievements.
- **3:** Hedging language ("I think maybe…"), deflects credit, sounds uncertain
- **5:** Mixed — some confident moments but reverts to hedging under pressure
- **7:** Generally confident; uses "I led", "I decided"; minor hesitation on tough questions
- **9:** Consistently assertive without arrogance; owns decisions and outcomes; handles pushback gracefully

### 5. Strategic Thinking
Articulation of tradeoffs, stakeholder awareness, business impact.
- **3:** Focuses only on tactical execution; no mention of why decisions were made
- **5:** Mentions some reasoning but doesn't articulate tradeoffs or alternatives considered
- **7:** Explains decision rationale with tradeoffs; shows awareness of business context
- **9:** Frames every decision in terms of business impact, stakeholder needs, and alternatives weighed

### 6. Active Listening
Responsiveness to follow-up questions, building on interviewer cues, asking clarifying questions.
- **3:** Ignores follow-ups, gives pre-rehearsed answers regardless of the question asked
- **5:** Addresses follow-ups but sometimes misses the specific angle being asked
- **7:** Directly addresses follow-ups; adjusts answers based on interviewer's direction
- **9:** Picks up on subtle cues, asks smart clarifying questions, tailors depth to the interviewer's interest

---

## Instructions

Analyze the following transcript and respond with ONLY valid JSON matching this exact schema — no markdown, no explanation, just the JSON object:

\`\`\`json
{
  "scores": {
    "star_structure": <number>,
    "clarity": <number>,
    "depth": <number>,
    "confidence": <number>,
    "strategic_thinking": <number>,
    "active_listening": <number>
  },
  "strengths": [
    { "text": "<strength title>", "evidence": "<direct quote or paraphrase from transcript>", "timestamp_range": "<start–end or null>" }
  ],
  "weaknesses": [
    { "text": "<weakness title>", "evidence": "<direct quote or paraphrase from transcript>", "timestamp_range": "<start–end or null>" }
  ],
  "recommendations": [
    { "text": "<specific, behavioral recommendation>", "priority": "high|medium|low" }
  ],
  "overall_summary": "<2-3 sentence overall assessment>"
}
\`\`\`

Requirements:
- Provide 3–5 strengths, 3–5 weaknesses, and 3–5 recommendations
- Scores must use 0.5 increments (e.g., 6.0, 6.5, 7.0)
- Recommendations must be CONCRETE and BEHAVIORAL — not generic advice
  ✅ Good: "Practice a 60-second version of your supply chain optimization story focusing on the quantified outcome"
  ❌ Bad: "Be more concise"
- Evidence must reference specific moments from the transcript
- timestamp_range is optional — include when the transcript has timestamps

${intervieweeName ? `The interviewee is: ${intervieweeName}` : ""}

## Transcript

${formattedTranscript}`;
}
