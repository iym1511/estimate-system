'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnCardProps {
  title: string;
  icon: any;
  onAdd?: () => void;
  isAdding?: boolean;
  children: ReactNode;
  className?: string;
}

export function ColumnCard({ title, icon: Icon, onAdd, isAdding, children, className }: ColumnCardProps) {
  return (
    <Card className={cn("flex flex-col min-h-0 bg-white border-[#dfdfdf] rounded-lg shadow-sm overflow-hidden", className)}>
      <CardHeader className="px-5 py-4 border-b border-[#dfdfdf] shrink-0 bg-[#fafafa]">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium uppercase text-[#9a9a9a] tracking-wider flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-[#3ecf8e]" /> {title}
          </span>
          {onAdd && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-[#b2b2b2] hover:text-[#171717]" onClick={onAdd}>
              {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        {children}
      </CardContent>
    </Card>
  );
}
