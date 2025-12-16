import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: "default" | "warning" | "error" | "success";
}

export function SectionCard({ title, description, children, variant = "default" }: SectionCardProps) {
  const getBorderColor = () => {
    switch (variant) {
      case "warning":
        return "border-amber-500/40";
      case "error":
        return "border-rose-500/40";
      case "success":
        return "border-emerald-500/40";
      default:
        return "border-slate-800";
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "warning":
        return "bg-amber-950/20";
      case "error":
        return "bg-rose-950/20";
      case "success":
        return "bg-emerald-950/20";
      default:
        return "bg-slate-950/70";
    }
  };

  return (
    <div className={`rounded-3xl border ${getBorderColor()} ${getBackgroundColor()} p-6 shadow-lg shadow-slate-950/60`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

