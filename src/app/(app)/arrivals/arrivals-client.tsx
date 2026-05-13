"use client";

import * as React from "react";
import { Loader2, PackagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoThumb } from "@/components/common/photo-thumb";
import { UnitInputPad } from "@/components/stocktake/unit-input-pad";
import { useToast } from "@/components/ui/use-toast";
import type { RawInputs, UnitRate } from "@/lib/unit";
import { formatDateTime } from "@/lib/utils";
import { createArrivalAction, deleteArrivalAction } from "./actions";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: string;
  unitRates: UnitRate[];
  photoUrl: string | null;
};

type Location = { id: string; floor: string; roomName: string };

type RecentArrival = {
  id: string;
  occurredAt: string;
  quantityBase: number;
  rawInputs: Record<string, number>;
  operator: string;
  note: string | null;
  itemName: string;
  baseUnit: string;
  itemPhotoUrl: string | null;
  locationLabel: string;
};

export function ArrivalsClient({
  items,
  locations,
  recent,
}: {
  items: Item[];
  locations: Location[];
  recent: RecentArrival[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [itemQuery, setItemQuery] = React.useState("");
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [locationId, setLocationId] = React.useState<string>(locations[0]?.id ?? "");
  const [inputs, setInputs] = React.useState<RawInputs>({});
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [items, itemQuery]);

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  function reset() {
    setSelectedItemId(null);
    setInputs({});
    setNote("");
  }

  async function submit() {
    if (!selectedItem || !locationId) {
      toast({ variant: "destructive", title: "商品と保管場所を選択してください" });
      return;
    }
    setSubmitting(true);
    const res = await createArrivalAction({
      itemId: selectedItem.id,
      locationId,
      rawInputs: inputs,
      note,
    });
    setSubmitting(false);
    if (res.error) {
      toast({ variant: "destructive", title: "登録失敗", description: res.error });
    } else {
      toast({ title: "入荷を登録しました", description: selectedItem.name });
      reset();
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この入荷ログを削除しますか？")) return;
    const res = await deleteArrivalAction(id);
    if (res.error) {
      toast({ variant: "destructive", title: "削除失敗", description: res.error });
    } else {
      toast({ title: "削除しました" });
      router.refresh();
    }
  }

  if (locations.length === 0 || items.length === 0) {
    return (
      <EmptyState
        title="マスタが未登録です"
        description="先に管理者で商品と保管場所を登録してください。"
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">入荷を記録</h2>
          </div>

          <div className="space-y-1">
            <Label>保管場所</Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.floor} {l.roomName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>商品</Label>
            <Input
              placeholder="商品名で検索"
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
            />
            {selectedItem ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-2">
                <PhotoThumb url={selectedItem.photoUrl} alt={selectedItem.name} size="md" />
                <div className="flex-1">
                  <p className="font-medium">{selectedItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.category ?? "未分類"} ・ 最小単位 {selectedItem.baseUnit}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  変更
                </Button>
              </div>
            ) : (
              <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto rounded-md border p-1">
                {filtered.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setSelectedItemId(i.id)}
                    className="flex items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-muted"
                  >
                    <PhotoThumb url={i.photoUrl} alt={i.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{i.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {i.category ?? "未分類"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="space-y-2">
              <Label>数量</Label>
              <UnitInputPad
                baseUnit={selectedItem.baseUnit}
                unitRates={selectedItem.unitRates}
                value={inputs}
                onChange={setInputs}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="note">メモ（任意）</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: 業者A、伝票番号..."
              rows={2}
            />
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={submit}
            disabled={submitting || !selectedItem}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "入荷を登録"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <h2 className="font-semibold">最近の入荷</h2>
          {recent.length === 0 ? (
            <EmptyState title="まだ入荷ログがありません" />
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-2">
                  <PhotoThumb url={r.itemPhotoUrl} alt={r.itemName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-medium">{r.itemName}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        +{r.quantityBase} {r.baseUnit}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {r.locationLabel} ・ {formatDateTime(r.occurredAt)} ・ {r.operator}
                    </p>
                    {r.note && (
                      <p className="mt-0.5 text-xs text-muted-foreground">📝 {r.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4 text-destructive/70" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
