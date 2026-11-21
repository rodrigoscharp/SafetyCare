import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <span className="bg-muted grid size-11 place-items-center rounded-full">
        <Icon className="text-muted-foreground size-5" />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
