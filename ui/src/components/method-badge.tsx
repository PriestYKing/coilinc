import React from "react";

const methodColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  GET: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  POST: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  PUT: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  PATCH: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
  DELETE: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  HEAD: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
  },
  OPTIONS: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export function MethodBadge({ method, className = "" }: MethodBadgeProps) {
  const colors = methodColors[method] || methodColors.GET;

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {method}
    </span>
  );
}
