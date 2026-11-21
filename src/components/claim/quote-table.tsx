import type { Coverage, RepairAction } from "@prisma/client";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTION_LABEL, COVERAGE_LABEL } from "@/domain/labels";
import { partLabel } from "@/domain/parts";
import { itemTotal, quoteTotals } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VISUAL_COLOR } from "@/components/vehicle-3d/visual-style";

export type QuoteTableItem = {
  id: string;
  partKey: string;
  action: RepairAction;
  partPrice: number;
  laborPrice: number;
  coverage: Coverage;
  insurerNote: string | null;
};

export function CoverageBadge({ coverage }: { coverage: Coverage }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        coverage === "COBERTO" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        coverage === "NAO_COBERTO" && "bg-red-500/15 text-red-700 dark:text-red-300",
        coverage === "PENDENTE" && "bg-muted text-muted-foreground",
      )}
    >
      {COVERAGE_LABEL[coverage]}
    </span>
  );
}

export function ActionDot({ action }: { action: RepairAction }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: VISUAL_COLOR[action] }} />
      {ACTION_LABEL[action]}
    </span>
  );
}

export function QuoteTable({ items, showCoverage = true }: { items: QuoteTableItem[]; showCoverage?: boolean }) {
  const t = quoteTotals(items);
  return (
    <div className="min-w-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Peça</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead className="text-right">Peça</TableHead>
            <TableHead className="text-right">Mão de obra</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {showCoverage ? <TableHead>Cobertura</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="font-medium">
                {partLabel(i.partKey)}
                {i.insurerNote ? <p className="text-muted-foreground max-w-64 text-xs font-normal whitespace-normal italic">“{i.insurerNote}”</p> : null}
              </TableCell>
              <TableCell><ActionDot action={i.action} /></TableCell>
              <TableCell className="text-right tabular-nums">{formatBRL(i.partPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatBRL(i.laborPrice)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatBRL(itemTotal(i))}</TableCell>
              {showCoverage ? <TableCell><CoverageBadge coverage={i.coverage} /></TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right tabular-nums">{formatBRL(t.partsTotal)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatBRL(t.laborTotal)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatBRL(t.total)}</TableCell>
            {showCoverage ? <TableCell /> : null}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
