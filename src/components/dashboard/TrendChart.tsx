"use client";

/**
 * TrendChart — Line chart showing score trends over sessions using Recharts.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SessionPoint {
  date: string;
  average: number | null;
  scores: Record<string, number> | null;
}

interface TrendChartProps {
  data: SessionPoint[];
  showDimensions?: boolean;
}

const DIMENSION_COLORS: Record<string, string> = {
  star_structure: "#8884d8",
  clarity: "#82ca9d",
  depth: "#ffc658",
  confidence: "#ff7300",
  strategic_thinking: "#0088FE",
  active_listening: "#00C49F",
};

const DIMENSION_LABELS: Record<string, string> = {
  star_structure: "STAR",
  clarity: "Clarity",
  depth: "Depth",
  confidence: "Confidence",
  strategic_thinking: "Strategy",
  active_listening: "Listening",
};

export default function TrendChart({
  data,
  showDimensions = false,
}: TrendChartProps) {
  const chartData = data.map((d, i) => ({
    name: `Session ${i + 1}`,
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    average: d.average ? Math.round(d.average * 10) / 10 : null,
    ...(d.scores ?? {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="average"
          stroke="#4F46E5"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Overall Average"
        />
        {showDimensions &&
          Object.entries(DIMENSION_COLORS).map(([key, color]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={1}
              dot={{ r: 2 }}
              strokeDasharray="5 5"
              name={DIMENSION_LABELS[key] ?? key}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
