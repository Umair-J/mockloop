"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#3D7AB5]/10 text-[#1B3A5C]"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
