import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/supabase";
import { parseUnitRates } from "@/lib/unit";
import { currentYearMonth, formatYearMonth } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { StocktakeInputClient } from "./stocktake-input-client";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StocktakeLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string; locationId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { hotelId, locationId } = await params;
  const sp = await searchParams;
  const yearMonth = sp.month ?? currentYearMonth();

  const [location, items, snapshots, close] = await Promise.all([
    prisma.location.findUnique({ where: { id: locationId } }),
    prisma.item.findMany({
      where: { hotelId, isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.inventorySnapshot.findMany({
      where: { hotelId, yearMonth, locationId },
    }),
    prisma.monthlyCloseStatus.findUnique({
      where: { hotelId_yearMonth: { hotelId, yearMonth } },
    }),
  ]);

  if (!location || location.hotelId !== hotelId) notFound();

  const snapshotMap = new Map(snapshots.map((s) => [s.itemId, s]));

  const itemsData = items.map((i) => {
    const snap = snapshotMap.get(i.id);
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      baseUnit: i.baseUnit,
      unitRates: parseUnitRates(i.unitRates),
      photoUrl: getPublicUrl(i.photoUrl),
      existing: snap
        ? {
            rawInputs: snap.rawInputs as Record<string, number>,
            confirmedQty: snap.confirmedQty,
            operator: snap.operator,
            confirmedAt: snap.confirmedAt.toISOString(),
          }
        : null,
    };
  });

  const isClosed = !!close?.closedAt;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${location.floor} ${location.roomName}`}
        description={`${formatYearMonth(yearMonth)} 棚卸し`}
        actions={
          isClosed ? (
            <Badge variant="success" className="gap-1">
              <Lock className="h-3 w-3" /> 確定済み（編集不可）
            </Badge>
          ) : null
        }
      />
      <StocktakeInputClient
        hotelId={hotelId}
        yearMonth={yearMonth}
        locationId={locationId}
        locationLabel={`${location.floor} ${location.roomName}`}
        locationPhotoUrl={getPublicUrl(location.photoUrl)}
        items={itemsData}
        readOnly={isClosed}
      />
    </div>
  );
}
