'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL, MONTH_LABELS } from '@conciliacao/shared';
import type { DFCReport } from '@conciliacao/shared';

function MoneyCell({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td
      className={cn(
        'whitespace-nowrap px-3 py-1.5 text-right text-xs tabular-nums',
        bold && 'font-semibold',
        value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      {formatBRL(value)}
    </td>
  );
}

function ExpandButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-muted-foreground">
      {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
    </button>
  );
}

export function DfcPivotTable({ report }: { report: DFCReport }) {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="sticky left-0 min-w-[260px] bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Linha
            </th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="min-w-[100px] px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                {m.slice(0, 3)}
              </th>
            ))}
            <th className="min-w-[110px] px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b bg-secondary/40">
            <td className="sticky left-0 bg-secondary/40 px-3 py-1.5 text-xs font-semibold">Saldo Inicial</td>
            {report.openingBalance.map((v, i) => (
              <MoneyCell key={i} value={v} />
            ))}
            <MoneyCell value={report.openingBalance[0] ?? 0} />
          </tr>

          {report.groups.map((group) => {
            const groupOpen = !collapsed.has(group.key);
            return (
              <React.Fragment key={group.key}>
                <tr className="border-b bg-primary/5">
                  <td className="sticky left-0 flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 text-xs font-semibold">
                    <ExpandButton open={groupOpen} onClick={() => toggle(group.key)} />
                    {group.label}
                  </td>
                  {group.monthly.map((v, i) => (
                    <MoneyCell key={i} value={v} bold />
                  ))}
                  <MoneyCell value={group.total} bold />
                </tr>

                {groupOpen &&
                  group.sections.map((section) => {
                    const sectionKey = `${group.key}.${section.key}`;
                    const sectionOpen = !collapsed.has(sectionKey);
                    return (
                      <React.Fragment key={sectionKey}>
                        <tr className="border-b">
                          <td className="sticky left-0 flex items-center gap-1.5 bg-card py-1.5 pl-7 pr-3 text-xs font-medium">
                            <ExpandButton open={sectionOpen} onClick={() => toggle(sectionKey)} />
                            {section.label}
                          </td>
                          {section.monthly.map((v, i) => (
                            <MoneyCell key={i} value={v} />
                          ))}
                          <MoneyCell value={section.total} />
                        </tr>

                        {sectionOpen &&
                          section.lines.map((line) => (
                            <tr key={line.line} className="border-b last:border-b-0">
                              <td className="sticky left-0 bg-card py-1 pl-12 pr-3 text-xs text-muted-foreground">
                                {line.label}
                              </td>
                              {line.monthly.map((v, i) => (
                                <MoneyCell key={i} value={v} />
                              ))}
                              <MoneyCell value={line.total} />
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}

                <tr className="border-b bg-muted/30">
                  <td className="sticky left-0 bg-muted/30 px-3 py-1.5 text-xs font-semibold italic">
                    {group.resultLabel}
                  </td>
                  {group.monthly.map((v, i) => (
                    <MoneyCell key={i} value={v} bold />
                  ))}
                  <MoneyCell value={group.total} bold />
                </tr>
              </React.Fragment>
            );
          })}

          <tr className="border-b bg-secondary/40">
            <td className="sticky left-0 bg-secondary/40 px-3 py-1.5 text-xs font-semibold">Fluxo Líquido</td>
            {report.netFlow.map((v, i) => (
              <MoneyCell key={i} value={v} bold />
            ))}
            <MoneyCell value={report.netFlow.reduce((a, b) => a + b, 0)} bold />
          </tr>
          <tr>
            <td className="sticky left-0 bg-card px-3 py-1.5 text-xs font-semibold">Saldo Final</td>
            {report.closingBalance.map((v, i) => (
              <MoneyCell key={i} value={v} bold />
            ))}
            <MoneyCell value={report.closingBalance[11] ?? 0} bold />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
