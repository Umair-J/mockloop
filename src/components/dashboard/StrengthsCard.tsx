"use client";

/**
 * StrengthsCard — Displays top strengths or growth areas as a card.
 */

interface ScoreItem {
  key: string;
  label: string;
  average: number;
}

interface StrengthsCardProps {
  title: string;
  items: ScoreItem[];
  variant: "strength" | "growth";
}

export default function StrengthsCard({
  title,
  items,
  variant,
}: StrengthsCardProps) {
  const borderColor =
    variant === "strength" ? "border-green-200" : "border-amber-200";
  const bgColor =
    variant === "strength" ? "bg-green-50" : "bg-amber-50";
  const barColor =
    variant === "strength" ? "bg-green-500" : "bg-amber-500";
  const icon = variant === "strength" ? "💪" : "🎯";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-5`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-medium text-gray-900">
                {item.average.toFixed(1)}
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${barColor}`}
                style={{ width: `${(item.average / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
