import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  isPrimary?: boolean;
}

export function StatCard({ label, value, subValue, isPrimary = false }: StatCardProps) {
  return (
    <Card className={cn(
      "rounded-lg border-[#dfdfdf] shadow-sm overflow-hidden", 
      isPrimary ? "bg-[#1c1c1c] text-white border-[#2e2e2e]" : "bg-white"
    )}>
      <CardContent className="p-6">
        <p className="text-[11px] font-medium uppercase tracking-wider mb-4 text-[#9a9a9a]">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-medium tracking-tight">
            {value}
          </h3>
          {subValue && (
            <span className={cn(
              "text-xs font-normal", 
              isPrimary ? "text-[#707070]" : "text-[#9a9a9a]"
            )}>
              {subValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
