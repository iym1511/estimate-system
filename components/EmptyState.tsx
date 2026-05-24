'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-28 px-6 border border-dashed border-[#dfdfdf] rounded-sm bg-[#fafafa]">
      <div className="w-12 h-12 bg-white border border-[#dfdfdf] rounded-sm flex items-center justify-center mb-5 shadow-none">
        <Icon className="h-5 w-5 text-[#9a9a9a]" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-medium text-[#171717]">{title}</h3>
      {description && (
        <p className="text-[13px] text-[#9a9a9a] mt-2 text-center max-w-[280px] leading-relaxed">{description}</p>
      )}
    </div>
  );
}
