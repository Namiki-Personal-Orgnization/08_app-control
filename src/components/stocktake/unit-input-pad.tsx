"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RawInputs, UnitRate } from "@/lib/unit";
import { toBase } from "@/lib/unit";

export function UnitInputPad({
  baseUnit,
  unitRates,
  value,
  onChange,
}: {
  baseUnit: string;
  unitRates: UnitRate[];
  value: RawInputs;
  onChange: (next: RawInputs) => void;
}) {
  const allUnits = React.useMemo(() => {
    const sorted = [...unitRates].sort((a, b) => b.rate - a.rate);
    return [...sorted, { name: baseUnit, rate: 1 }];
  }, [unitRates, baseUnit]);

  const total = toBase(value, baseUnit, unitRates);

  function setUnit(name: string, qty: number) {
    const next = { ...value };
    if (qty <= 0) {
      delete next[name];
    } else {
      next[name] = qty;
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {allUnits.map((u) => {
          const qty = value[u.name] ?? 0;
          return (
            <div
              key={u.name}
              className="flex items-center gap-2 rounded-md border bg-card p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {u.rate === 1
                    ? "最小単位"
                    : `1${u.name} = ${u.rate}${baseUnit}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setUnit(u.name, Math.max(0, qty - 1))}
                aria-label={`${u.name}を1減らす`}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={qty || ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setUnit(u.name, Number.isFinite(n) && n >= 0 ? n : 0);
                }}
                className="h-11 w-20 text-center text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setUnit(u.name, qty + 1)}
                aria-label={`${u.name}を1増やす`}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          );
        })}
      </div>
      <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
        合計:{" "}
        <span className="text-base font-bold text-primary">
          {total} {baseUnit}
        </span>
      </p>
    </div>
  );
}
