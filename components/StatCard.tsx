'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  className?: string;
}

export function StatCard({ label, value, subValue, className }: StatCardProps) {
  return (
    <Card className={cn('rounded-sm border-[#dfdfdf] bg-white shadow-none', className)}>
      <CardContent className="p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a] mb-4">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-medium tracking-tight text-[#171717]">{value}</span>
          {subValue && <span className="text-xs text-[#9a9a9a]">{subValue}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
