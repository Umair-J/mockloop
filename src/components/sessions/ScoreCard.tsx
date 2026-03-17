"use client";

/**
 * ScoreCard — displays a single analysis dimension score as a colored progress bar.
 * Score: 1–10 scale. Color: red < 4, yellow 4–6, green 7–8, blue 9+.
 */

interface ScoreCardProps {
  label: string;
  score: number;
  description?: string;
}

function getScoreColor(score: number): string {
  if (score >= 9) return "bg-blue-500";
  if (score >= 7) return "bg-green-500";
  if (score >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 9) return "bg-blue-50 border-blue-200";
  if (score >= 7) return "bg-green-50 border-green-200";
  if (score >= 4) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export default function ScoreCard({ label, score, description }: ScoreCardProps) {
  const percentage = (score / 10) * 100;

  return (
    <div className={`rounded-lg border p-4 ${getScoreBg(score)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-lg font-bold text-gray-900">
          {score.toFixed(1)}
          <span className="text-sm font-normal text-gray-500">/10</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getScoreColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p className="mt-2 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
