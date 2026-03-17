"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MEMBER";
  isActive: boolean;
  createdAt: string;
}

interface AllowedEmail {
  id: string;
  email: string;
  addedBy: string | null;
  createdAt: string;
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setAllowedEmails(data.allowedEmails);
      setError(null);
    } catch {
      setError("Failed to load members data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Failed to add email");
        return;
      }
      setNewEmail("");
      fetchData();
    } catch {
      setActionError("Failed to add email.");
    }
  };

  const handleRemoveEmail = async (email: string) => {
    setActionError(null);
    try {
      const res = await fetch("/api/users/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || "Failed to remove email");
        return;
      }
      fetchData();
    } catch {
      setActionError("Failed to remove email.");
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });
      if (!res.ok) {
        setActionError("Failed to update user");
        return;
      }
      fetchData();
    } catch {
      setActionError("Failed to update user.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Members</h1>
      <p className="text-gray-500 text-sm mb-8">
        Manage allowed emails and active members.
      </p>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {actionError}
        </div>
      )}

      {/* Add email form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Invite Member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D7AB5] focus:border-transparent"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B3A5C]/90 transition-colors"
          >
            Add to Allowed List
          </button>
        </form>
      </div>

      {/* Registered users */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">
            Registered Users ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No users have signed in yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        handleToggleActive(user.id, user.isActive)
                      }
                      className="text-xs text-[#3D7AB5] hover:underline"
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Allowed emails */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">
            Allowed Emails ({allowedEmails.length})
          </h2>
        </div>
        {allowedEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No emails in the allowed list. Add one above to allow sign-in.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Added By</th>
                <th className="px-4 py-3 font-medium">Added</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allowedEmails.map((ae) => (
                <tr
                  key={ae.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-3 text-gray-900">{ae.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ae.addedBy ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(ae.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveEmail(ae.email)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
