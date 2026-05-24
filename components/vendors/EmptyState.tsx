interface EmptyStateProps {
  icon: any;
  label: string;
}

export function EmptyState({ icon: Icon, label }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#b2b2b2] space-y-3">
      <Icon className="h-8 w-8 opacity-10" />
      <p className="text-[11px] font-medium uppercase tracking-widest leading-relaxed">{label}</p>
    </div>
  );
}
