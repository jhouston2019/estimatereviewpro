export function PollingLoader({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      <span className="text-xs font-medium text-amber-200">{message}</span>
    </div>
  );
}

