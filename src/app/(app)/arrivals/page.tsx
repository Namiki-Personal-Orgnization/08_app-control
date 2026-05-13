import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { getPublicUrl } from "@/lib/supabase";
import { parseUnitRates } from "@/lib/unit";
import { ArrivalsClient } from "./arrivals-client";

export const dynamic = "force-dynamic";

export default async function ArrivalsPage() {
  const [items, locations, recent] = await Promise.all([
    prisma.item.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { roomName: "asc" }],
    }),
    prisma.stockLog.findMany({
      where: { type: "ARRIVAL" },
      orderBy: { occurredAt: "desc" },
      take: 30,
      include: { item: true, location: true },
    }),
  ]);

  const itemsData = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    baseUnit: i.baseUnit,
    unitRates: parseUnitRates(i.unitRates),
    photoUrl: getPublicUrl(i.photoUrl),
  }));

  const locationsData = locations.map((l) => ({
    id: l.id,
    floor: l.floor,
    roomName: l.roomName,
  }));

  const recentData = recent.map((r) => ({
    id: r.id,
    occurredAt: r.occurredAt.toISOString(),
    quantityBase: r.quantityBase,
    rawInputs: r.rawInputs as Record<string, number>,
    operator: r.operator,
    note: r.note,
    itemName: r.item.name,
    baseUnit: r.item.baseUnit,
    itemPhotoUrl: getPublicUrl(r.item.photoUrl),
    locationLabel: `${r.location.floor} ${r.location.roomName}`,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="入荷登録"
        description="商品が届いたら、ここから登録します。"
      />
      <ArrivalsClient items={itemsData} locations={locationsData} recent={recentData} />
    </div>
  );
}
