import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface ColumnHeaderProps {
  title: string;
  icon: any;
  onAdd?: () => void;
  isAdding?: boolean;
}

export function ColumnHeader({ title, icon: Icon, onAdd, isAdding }: ColumnHeaderProps) {
  return (
    <div className="flex justify-between items-center px-5 py-4 border-b border-[#dfdfdf] bg-[#fafafa] shrink-0">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#3ecf8e]" />
        <span className="text-[11px] font-medium uppercase text-[#9a9a9a] tracking-wider">{title}</span>
      </div>
      {onAdd && (
        <Button size="icon" variant="ghost" className="h-7 w-7 text-[#b2b2b2] hover:text-[#171717]" onClick={onAdd}>
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
