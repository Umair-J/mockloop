"use client";

/**
 * CommentForm — Add or edit an interviewer comment on a session.
 * Supports: comment type selection, optional timestamp link, optional section label.
 */

import { useState } from "react";

interface CommentFormProps {
  sessionId: string;
  onCommentAdded: () => void;
  /** Pre-fill for editing */
  editingComment?: {
    id: string;
    commentText: string;
    commentType: string;
    timestampSeconds: number | null;
    sectionLabel: string | null;
  };
  onCancelEdit?: () => void;
}

const COMMENT_TYPES = [
  { value: "STRENGTH", label: "Strength", color: "bg-green-100 text-green-800" },
  { value: "WEAKNESS", label: "Weakness", color: "bg-red-100 text-red-800" },
  { value: "SUGGESTION", label: "Suggestion", color: "bg-blue-100 text-blue-800" },
  { value: "GENERAL", label: "General", color: "bg-gray-100 text-gray-800" },
] as const;

export default function CommentForm({
  sessionId,
  onCommentAdded,
  editingComment,
  onCancelEdit,
}: CommentFormProps) {
  const [commentText, setCommentText] = useState(editingComment?.commentText ?? "");
  const [commentType, setCommentType] = useState(editingComment?.commentType ?? "GENERAL");
  const [timestampSeconds, setTimestampSeconds] = useState<string>(
    editingComment?.timestampSeconds != null ? String(editingComment.timestampSeconds) : ""
  );
  const [sectionLabel, setSectionLabel] = useState(editingComment?.sectionLabel ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editingComment;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(isEditing ? {} : { sessionId }),
        commentText,
        commentType,
        ...(timestampSeconds ? { timestampSeconds: parseInt(timestampSeconds, 10) } : {}),
        ...(sectionLabel ? { sectionLabel } : {}),
      };

      const url = isEditing ? `/api/comments/${editingComment.id}` : "/api/comments";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save comment");
      }

      // Reset form
      setCommentText("");
      setCommentType("GENERAL");
      setTimestampSeconds("");
      setSectionLabel("");
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Comment type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setCommentType(type.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                commentType === type.value
                  ? `${type.color} border-current ring-2 ring-offset-1 ring-current`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional metadata row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Timestamp (seconds) — optional
          </label>
          <input
            type="number"
            min="0"
            value={timestampSeconds}
            onChange={(e) => setTimestampSeconds(e.target.value)}
            placeholder="e.g. 120"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Section label — optional
          </label>
          <input
            type="text"
            value={sectionLabel}
            onChange={(e) => setSectionLabel(e.target.value)}
            placeholder="e.g. Leadership question"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Comment text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Comment
        </label>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          required
          maxLength={5000}
          placeholder="Write your feedback..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !commentText.trim()}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Comment"
              : "Add Comment"}
        </button>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
