"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoThumb } from "@/components/common/photo-thumb";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import type { UnitRate } from "@/lib/unit";
import {
  createItemAction,
  updateItemAction,
  deleteItemAction,
  type ItemActionState,
} from "./actions";

type Item = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: string;
  unitRates: UnitRate[];
  alertEnabled: boolean;
  alertThreshold: number | null;
  isActive: boolean;
  photoUrl: string | null;
};

export function ItemsClient({ items }: { items: Item[] }) {
  const [editing, setEditing] = React.useState<Item | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="商品名・カテゴリで検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> 商品を追加
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="商品がありません"
          description="「商品を追加」から最初の商品を登録してください。"
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
            />
          ))}
        </div>
      )}

      <ItemFormDialog
        open={creating}
        onOpenChange={(o) => setCreating(o)}
        item={null}
      />
      <ItemFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        item={editing}
      />
    </div>
  );
}

function ItemCard({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);
  async function handleDelete() {
    if (!confirm(`${item.name} を削除しますか？\n（過去ログがある場合は無効化されます）`)) return;
    setDeleting(true);
    const res = await deleteItemAction(item.id);
    setDeleting(false);
    if (res.error) {
      toast({ variant: "destructive", title: "削除失敗", description: res.error });
    } else {
      toast({ title: "削除しました" });
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-3">
        <PhotoThumb url={item.photoUrl} alt={item.name} size="md" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{item.name}</p>
            {!item.isActive && (
              <Badge variant="secondary" className="text-[10px]">無効</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.category ?? "未分類"} ・ 最小単位 {item.baseUnit}
          </p>
          {item.unitRates.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {item.unitRates
                .map((u) => `${u.name}=${u.rate}${item.baseUnit}`)
                .join(" / ")}
            </p>
          )}
          {item.alertEnabled && item.alertThreshold != null && (
            <Badge variant="warning" className="gap-1 text-[10px]">
              <AlertTriangle className="h-3 w-3" />
              閾値 {item.alertThreshold} {item.baseUnit}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemFormDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}) {
  const { toast } = useToast();
  const action = item ? updateItemAction : createItemAction;
  const [state, formAction, pending] = useActionState<ItemActionState, FormData>(
    action,
    {},
  );

  const [rates, setRates] = React.useState<UnitRate[]>(item?.unitRates ?? []);
  const [alertEnabled, setAlertEnabled] = React.useState(item?.alertEnabled ?? false);

  React.useEffect(() => {
    setRates(item?.unitRates ?? []);
    setAlertEnabled(item?.alertEnabled ?? false);
  }, [item, open]);

  React.useEffect(() => {
    if (state.ok) {
      toast({ title: item ? "更新しました" : "追加しました" });
      onOpenChange(false);
    } else if (state.error) {
      toast({ variant: "destructive", title: "失敗", description: state.error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "商品を編集" : "商品を追加"}</DialogTitle>
          <DialogDescription>
            最小単位（バラ）と換算比率を設定します。例: 1ケース = 8箱、1箱 = 50本
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {item && <input type="hidden" name="id" value={item.id} />}
          <input
            type="hidden"
            name="unitRatesJson"
            value={JSON.stringify(rates)}
          />
          <div className="space-y-1">
            <Label htmlFor="name">商品名</Label>
            <Input id="name" name="name" defaultValue={item?.name ?? ""} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="category">カテゴリ（任意）</Label>
              <Input
                id="category"
                name="category"
                defaultValue={item?.category ?? ""}
                placeholder="例: アメニティ"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="baseUnit">最小単位</Label>
              <Input
                id="baseUnit"
                name="baseUnit"
                defaultValue={item?.baseUnit ?? "本"}
                placeholder="例: 本"
                required
              />
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>単位換算</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRates([...rates, { name: "", rate: 0 }])}
              >
                <Plus className="h-3 w-3" /> 追加
              </Button>
            </div>
            <div className="space-y-2">
              {rates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  最小単位のみで管理する場合は空のままで構いません。
                </p>
              )}
              {rates.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="単位名 (例: 箱)"
                    value={r.name}
                    onChange={(e) =>
                      setRates(
                        rates.map((row, i) =>
                          i === idx ? { ...row, name: e.target.value } : row,
                        ),
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">=</span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="個数"
                    value={r.rate || ""}
                    onChange={(e) =>
                      setRates(
                        rates.map((row, i) =>
                          i === idx
                            ? { ...row, rate: Number(e.target.value) || 0 }
                            : row,
                        ),
                      )
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setRates(rates.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <input
                id="alertEnabled"
                name="alertEnabled"
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="alertEnabled">在庫アラートを有効化</Label>
            </div>
            {alertEnabled && (
              <div className="space-y-1">
                <Label htmlFor="alertThreshold">閾値（最小単位）</Label>
                <Input
                  id="alertThreshold"
                  name="alertThreshold"
                  type="number"
                  min={0}
                  defaultValue={item?.alertThreshold ?? ""}
                  placeholder="例: 100"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="photo">写真（任意）</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" />
            {item?.photoUrl && (
              <p className="text-xs text-muted-foreground">
                現在の写真があります。新しい写真で上書きされます。
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={item ? item.isActive : true}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive">有効</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : item ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
