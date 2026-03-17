/**
 * Custom 404 page.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 bg-[#1B3A5C] text-white rounded-lg text-sm font-medium hover:bg-[#15304d] transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
