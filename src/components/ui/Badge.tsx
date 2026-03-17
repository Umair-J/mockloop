interface BadgeProps {
  variant: "pending" | "processing" | "completed" | "failed" | "default";
  children: React.ReactNode;
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-600",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
