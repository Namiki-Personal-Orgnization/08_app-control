import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoThumb } from "@/components/common/photo-thumb";
import { getPublicUrl } from "@/lib/supabase";
import { currentYearMonth, formatYearMonth } from "@/lib/utils";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { CheckCircle2, CircleDashed, ChevronRight, Lock } from "lucide-react";
import { CloseMonthButton, ReopenMonthButton } from "./month-actions";

export const dynamic = "force-dynamic";

export default async function StocktakePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const yearMonth = sp.month ?? currentYearMonth();

  const [locations, items, snapshots, close] = await Promise.all([
    prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { roomName: "asc" }],
    }),
    prisma.item.findMany({ where: { isActive: true } }),
    prisma.inventorySnapshot.findMany({ where: { yearMonth } }),
    prisma.monthlyCloseStatus.findUnique({ where: { yearMonth } }),
  ]);

  const itemCount = items.length;
  const progress = new Map<string, number>();
  for (const s of snapshots) {
    progress.set(s.locationId, (progress.get(s.locationId) ?? 0) + 1);
  }

  const totalCells = locations.length * itemCount;
  const filledCells = snapshots.length;
  const completedLocations = locations.filter(
    (l) => (progress.get(l.id) ?? 0) >= itemCount && itemCount > 0,
  ).length;
  const isClosed = !!close?.closedAt;

  return (
    <div className="space-y-4">
      <PageHeader
        title="棚卸し"
        description={`対象月: ${formatYearMonth(yearMonth)}`}
        actions={
          isClosed ? (
            <Badge variant="success" className="gap-1">
              <Lock className="h-3 w-3" /> 確定済み
            </Badge>
          ) : (
            <Badge variant="secondary">未確定</Badge>
          )
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-6">
          <Stat label="対象拠点" value={`${locations.length} 箇所`} />
          <Stat label="対象商品" value={`${itemCount} 件`} />
          <Stat
            label="完了拠点"
            value={`${completedLocations} / ${locations.length}`}
            highlight={completedLocations === locations.length && locations.length > 0}
          />
          <Stat
            label="入力済セル"
            value={`${filledCells} / ${totalCells}`}
          />
        </CardContent>
      </Card>

      {session.role === "admin" && (
        <div className="flex flex-wrap gap-2">
          {!isClosed ? (
            <CloseMonthButton
              yearMonth={yearMonth}
              disabled={completedLocations < locations.length || locations.length === 0}
            />
          ) : (
            <ReopenMonthButton yearMonth={yearMonth} />
          )}
        </div>
      )}

      {locations.length === 0 ? (
        <EmptyState
          title="保管場所が登録されていません"
          description="管理者で場所マスタを登録してください。"
        />
      ) : (
        <ul className="space-y-2">
          {locations.map((l) => {
            const done = progress.get(l.id) ?? 0;
            const isDone = done >= itemCount && itemCount > 0;
            const isPartial = done > 0 && !isDone;
            return (
              <li key={l.id}>
                <Link
                  href={`/stocktake/${l.id}?month=${yearMonth}`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-muted/30">
                    <CardContent className="flex items-center gap-3 p-3">
                      <PhotoThumb
                        url={getPublicUrl(l.photoUrl)}
                        alt={l.roomName}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {l.floor} {l.roomName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {isDone ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              完了
                            </Badge>
                          ) : isPartial ? (
                            <Badge variant="warning" className="gap-1">
                              <CircleDashed className="h-3 w-3" />
                              入力中
                            </Badge>
                          ) : (
                            <Badge variant="secondary">未入力</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {done} / {itemCount}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
