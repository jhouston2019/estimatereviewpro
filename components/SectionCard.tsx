export function SectionCard({
  title,
  description,
  children,
  className = "",
  variant = "default",
  icon,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "error";
  icon?: React.ReactNode;
}) {
  const variantStyles = {
    default: "border-slate-800 bg-slate-950/70",
    success: "border-emerald-500/40 bg-emerald-950/20",
    warning: "border-amber-500/40 bg-amber-950/20",
    error: "border-rose-500/40 bg-rose-950/20",
  };

  return (
    <section
      className={`rounded-3xl border p-6 shadow-lg shadow-slate-950/60 ${variantStyles[variant]} ${className}`}
    >
      {title && (
        <div className="mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
              {description && (
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="text-xs text-slate-200">{children}</div>
    </section>
  );
}
