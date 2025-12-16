interface ProgressStepsProps {
  currentStep: string;
}

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { id: "upload_complete", label: "Upload" },
    { id: "analyzing", label: "Analyze" },
    { id: "comparing", label: "Compare" },
    { id: "summarizing", label: "Summarize" },
    { id: "generating_pdf", label: "Generate PDF" },
    { id: "complete", label: "Complete" },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex || currentStep === "complete";
          const isCurrent = index === currentIndex;
          const isError = currentStep === "error";

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    isError
                      ? "border-rose-500 bg-rose-500/10 text-rose-300"
                      : isComplete
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : isCurrent
                      ? "border-amber-400 bg-amber-400/10 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium ${
                    isComplete || isCurrent ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isComplete ? "bg-emerald-500/40" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

