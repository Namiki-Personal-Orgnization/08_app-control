"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoThumb } from "@/components/common/photo-thumb";
import { UnitInputPad } from "@/components/stocktake/unit-input-pad";
import { useToast } from "@/components/ui/use-toast";
import type { RawInputs, UnitRate } from "@/lib/unit";
import { toBase } from "@/lib/unit";
import { formatDateTime } from "@/lib/utils";
import { saveStocktakeAction } from "../actions";

type ItemRow = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: string;
  unitRates: UnitRate[];
  photoUrl: string | null;
  existing: {
    rawInputs: RawInputs;
    confirmedQty: number;
    operator: string;
    confirmedAt: string;
  } | null;
};

export function StocktakeInputClient({
  yearMonth,
  locationId,
  locationLabel,
  locationPhotoUrl,
  items,
  readOnly,
}: {
  yearMonth: string;
  locationId: string;
  locationLabel: string;
  locationPhotoUrl: string | null;
  items: ItemRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const draftKey = `stocktake:${yearMonth}:${locationId}`;

  const [drafts, setDrafts] = React.useState<Record<string, RawInputs>>(() => {
    const initial: Record<string, RawInputs> = {};
    for (const i of items) {
      initial[i.id] = i.existing?.rawInputs ?? {};
    }
    return initial;
  });
  const [hydrated, setHydrated] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setDrafts((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [draftKey]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }, [drafts, draftKey, hydrated]);

  function update(itemId: string, next: RawInputs) {
    setDrafts((prev) => ({ ...prev, [itemId]: next }));
  }

  function resetItem(itemId: string) {
    setDrafts((prev) => ({ ...prev, [itemId]: {} }));
  }

  async function submit() {
    const entries = items
      .map((i) => ({
        itemId: i.id,
        rawInputs: drafts[i.id] ?? {},
      }))
      .filter((e) => Object.keys(e.rawInputs).length > 0);

    if (entries.length === 0) {
      toast({ variant: "destructive", title: "数量を入力してください" });
      return;
    }

    setSubmitting(true);
    const res = await saveStocktakeAction({
      yearMonth,
      locationId,
      entries,
    });
    setSubmitting(false);

    if (res.error) {
      toast({ variant: "destructive", title: "保存失敗", description: res.error });
    } else {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      toast({ title: "棚卸しを保存しました", description: locationLabel });
      router.push(`/stocktake?month=${yearMonth}`);
      router.refresh();
    }
  }

  const filledCount = items.filter((i) => {
    const d = drafts[i.id];
    return d && Object.values(d).some((v) => v > 0);
  }).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4 sm:p-6">
          <PhotoThumb url={locationPhotoUrl} alt={locationLabel} size="lg" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">入力進捗</p>
            <p className="text-2xl font-bold">
              {filledCount} <span className="text-base font-normal">/ {items.length}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              入力途中の値は端末内に自動保存されます。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((item) => {
          const rawInputs = drafts[item.id] ?? {};
          const total = toBase(rawInputs, item.baseUnit, item.unitRates);
          const hasInput = Object.values(rawInputs).some((v) => v > 0);
          return (
            <Card key={item.id} id={`item-${item.id}`}>
              <CardContent className="space-y-3 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <PhotoThumb url={item.photoUrl} alt={item.name} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-lg font-semibold leading-tight">{item.name}</p>
                      {hasInput && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {total}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.category ?? "未分類"}
                    </p>
                    {item.existing && (
                      <p className="text-[11px] text-muted-foreground">
                        前回: {item.existing.confirmedQty} {item.baseUnit} ・{" "}
                        {item.existing.operator} ・{" "}
                        {formatDateTime(item.existing.confirmedAt)}
                      </p>
                    )}
                  </div>
                  {hasInput && !readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => resetItem(item.id)}
                      aria-label="クリア"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {readOnly ? (
                  <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    確定値: <span className="font-bold">{total} {item.baseUnit}</span>
                  </p>
                ) : (
                  <UnitInputPad
                    baseUnit={item.baseUnit}
                    unitRates={item.unitRates}
                    value={rawInputs}
                    onChange={(next) => update(item.id, next)}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!readOnly && (
        <div className="sticky bottom-20 z-20 sm:bottom-4">
          <Button
            type="button"
            size="xl"
            className="w-full shadow-lg"
            onClick={submit}
            disabled={submitting || items.length === 0}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-5 w-5" />
                棚卸し結果を保存
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
