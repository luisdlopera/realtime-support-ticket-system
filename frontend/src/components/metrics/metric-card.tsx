import { Card, CardBody } from "@heroui/react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  className?: string;
  icon?: LucideIcon;
  color?: "blue" | "green" | "yellow" | "red" | "gray" | "indigo";
}

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  green: { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  red: { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
  gray: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

export function MetricCard({
  label,
  value,
  className = "",
  icon: Icon,
  color = "indigo",
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <Card shadow="sm" className={`border-none ${className}`}>
      <CardBody className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider sm:text-sm">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl lg:text-4xl">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`rounded-lg p-2 ${colors.bg}`}>
              <Icon size={20} className={colors.text} />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
