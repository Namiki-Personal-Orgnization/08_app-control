"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  type ActionState,
} from "./actions";

type Location = {
  id: string;
  floor: string;
  roomName: string;
  sortOrder: number;
  isActive: boolean;
  photoUrl: string | null;
};

export function LocationsClient({ locations }: { locations: Location[] }) {
  const [editing, setEditing] = React.useState<Location | null>(null);
  const [creating, setCreating] = React.useState(false);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Location[]>();
    for (const l of locations) {
      if (!map.has(l.floor)) map.set(l.floor, []);
      map.get(l.floor)!.push(l);
    }
    return Array.from(map.entries());
  }, [locations]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> 場所を追加
        </Button>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          title="場所が登録されていません"
          description="「場所を追加」から最初の保管場所を登録してください。"
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([floor, list]) => (
            <section key={floor} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {floor}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((l) => (
                  <LocationCard
                    key={l.id}
                    location={l}
                    onEdit={() => setEditing(l)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <LocationFormDialog
        open={creating}
        onOpenChange={(o) => setCreating(o)}
        location={null}
      />
      <LocationFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        location={editing}
      />
    </div>
  );
}

function LocationCard({
  location,
  onEdit,
}: {
  location: Location;
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`${location.floor} ${location.roomName} を削除しますか？\n（過去ログがある場合は無効化されます）`)) return;
    setDeleting(true);
    const res = await deleteLocationAction(location.id);
    setDeleting(false);
    if (res.error) {
      toast({ variant: "destructive", title: "削除失敗", description: res.error });
    } else {
      toast({ title: "削除しました" });
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <PhotoThumb url={location.photoUrl} alt={location.roomName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{location.roomName}</p>
            {!location.isActive && (
              <Badge variant="secondary" className="text-[10px]">無効</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {location.floor} ・ 並び {location.sortOrder}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationFormDialog({
  open,
  onOpenChange,
  location,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
}) {
  const { toast } = useToast();
  const action = location ? updateLocationAction : createLocationAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  React.useEffect(() => {
    if (state.ok) {
      toast({ title: location ? "更新しました" : "追加しました" });
      onOpenChange(false);
    } else if (state.error) {
      toast({ variant: "destructive", title: "失敗", description: state.error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "場所を編集" : "場所を追加"}</DialogTitle>
          <DialogDescription>
            写真を登録すると棚卸し時の場所確認が楽になります。
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {location && <input type="hidden" name="id" value={location.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="floor">フロア</Label>
              <Input
                id="floor"
                name="floor"
                defaultValue={location?.floor ?? ""}
                placeholder="例: 1F"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortOrder">並び順</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={location?.sortOrder ?? 0}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="roomName">場所名</Label>
            <Input
              id="roomName"
              name="roomName"
              defaultValue={location?.roomName ?? ""}
              placeholder="例: リネン庫A"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="photo">写真（任意）</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" />
            {location?.photoUrl && (
              <p className="text-xs text-muted-foreground">
                現在の写真があります。新しい写真を選ぶと差し替えられます。
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              name="isActive"
              defaultChecked={location ? location.isActive : true}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive">有効</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : location ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
