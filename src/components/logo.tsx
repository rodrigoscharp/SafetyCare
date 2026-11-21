import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
      <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-xl shadow-sm shadow-primary/30">
        <ShieldCheck className="size-[18px]" />
      </span>
      SafetyCare
    </Link>
  );
}
