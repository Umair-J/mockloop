import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">
        Welcome back, {session?.user?.name ?? "there"}.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
        <p className="text-gray-400 text-sm">
          Your performance dashboard will appear here once you have completed
          sessions.
        </p>
      </div>
    </div>
  );
}
