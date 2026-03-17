"use client";

/**
 * CommentsSection — Displays and manages interviewer comments on a session.
 *
 * - Interviewer/admin: sees all comments, can add/edit/delete, can finalize
 * - Interviewee: sees only finalized comments (read-only)
 */

import { useState, useEffect, useCallback } from "react";
import CommentForm from "./CommentForm";

interface Comment {
  id: string;
  commentText: string;
  commentType: string;
  timestampSeconds: number | null;
  sectionLabel: string | null;
  isFinalized: boolean;
  createdAt: string;
  author: { id: true; name: string | null };
}

interface CommentsSectionProps {
  sessionId: string;
  isInterviewer: boolean;
  isAdmin: boolean;
}

const TYPE_STYLES: Record<string, string> = {
  STRENGTH: "bg-green-100 text-green-800 border-green-200",
  WEAKNESS: "bg-red-100 text-red-800 border-red-200",
  SUGGESTION: "bg-blue-100 text-blue-800 border-blue-200",
  GENERAL: "bg-gray-100 text-gray-800 border-gray-200",
};

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CommentsSection({
  sessionId,
  isInterviewer,
  isAdmin,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const canManage = isInterviewer || isAdmin;

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/by-session/${sessionId}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
      // silently fail — comments are supplementary
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) fetchComments();
    } catch {
      // ignore
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      const res = await fetch(`/api/comments/by-session/${sessionId}/finalize`, {
        method: "POST",
      });
      if (res.ok) fetchComments();
    } catch {
      // ignore
    } finally {
      setFinalizing(false);
    }
  }

  const allFinalized = comments.length > 0 && comments.every((c) => c.isFinalized);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Interviewer Comments
        </h2>
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Interviewer Comments
          {comments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({comments.length})
            </span>
          )}
        </h2>

        {/* Finalize toggle — only for interviewer/admin */}
        {canManage && comments.length > 0 && (
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
              allFinalized
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {finalizing
              ? "Processing..."
              : allFinalized
                ? "Un-finalize (Edit)"
                : "Finalize & Share"}
          </button>
        )}
      </div>

      {/* Finalization status banner */}
      {allFinalized && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Comments are finalized. The interviewee can see this feedback.
        </div>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          {canManage
            ? "No comments yet. Add your feedback below."
            : "No feedback available yet."}
        </p>
      ) : (
        <div className="space-y-3 mb-6">
          {comments.map((comment) =>
            editingId === comment.id && canManage ? (
              <div
                key={comment.id}
                className="border border-indigo-200 rounded-lg p-4 bg-indigo-50"
              >
                <CommentForm
                  sessionId={sessionId}
                  editingComment={{
                    id: comment.id,
                    commentText: comment.commentText,
                    commentType: comment.commentType,
                    timestampSeconds: comment.timestampSeconds,
                    sectionLabel: comment.sectionLabel,
                  }}
                  onCommentAdded={() => {
                    setEditingId(null);
                    fetchComments();
                  }}
                  onCancelEdit={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={comment.id}
                className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${
                          TYPE_STYLES[comment.commentType] ?? TYPE_STYLES.GENERAL
                        }`}
                      >
                        {comment.commentType}
                      </span>
                      {comment.sectionLabel && (
                        <span className="text-xs text-gray-400">
                          {comment.sectionLabel}
                        </span>
                      )}
                      {comment.timestampSeconds != null && (
                        <span className="text-xs text-indigo-500 font-mono">
                          @{formatTimestamp(comment.timestampSeconds)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{comment.commentText}</p>
                  </div>

                  {/* Edit/Delete — only if not finalized and user can manage */}
                  {canManage && !comment.isFinalized && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setEditingId(comment.id)}
                        className="p-1 text-gray-400 hover:text-indigo-600 text-xs"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-gray-400 hover:text-red-600 text-xs"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add comment form — only for interviewer/admin, only when not all finalized */}
      {canManage && !allFinalized && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Add Comment
          </h3>
          <CommentForm sessionId={sessionId} onCommentAdded={fetchComments} />
        </div>
      )}
    </div>
  );
}
