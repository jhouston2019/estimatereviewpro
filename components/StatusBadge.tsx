interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "upload_complete":
        return { label: "Uploaded", color: "bg-slate-500/10 text-slate-300 border-slate-500/40" };
      case "analyzing":
        return { label: "Analyzing", color: "bg-blue-500/10 text-blue-300 border-blue-500/40" };
      case "comparing":
        return { label: "Comparing", color: "bg-purple-500/10 text-purple-300 border-purple-500/40" };
      case "summarizing":
        return { label: "Summarizing", color: "bg-orange-500/10 text-orange-300 border-orange-500/40" };
      case "generating_pdf":
        return { label: "Generating PDF", color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/40" };
      case "complete":
        return { label: "Complete", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" };
      case "error":
        return { label: "Error", color: "bg-rose-500/10 text-rose-300 border-rose-500/40" };
      default:
        return { label: status, color: "bg-slate-500/10 text-slate-300 border-slate-500/40" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

