"use client";

interface TranscriptSegment {
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
}

interface TranscriptViewerProps {
  content: TranscriptSegment[];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TranscriptViewer({ content }: TranscriptViewerProps) {
  if (!content || content.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        No transcript available.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {content.map((segment, index) => {
        const isInterviewer =
          segment.speaker.toLowerCase().includes("interviewer");

        return (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <span
                className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                  isInterviewer ? "bg-[#3D7AB5]" : "bg-emerald-500"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span
                  className={`text-xs font-semibold ${
                    isInterviewer ? "text-[#3D7AB5]" : "text-emerald-600"
                  }`}
                >
                  {segment.speaker}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(segment.start_time)} –{" "}
                  {formatTime(segment.end_time)}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {segment.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
