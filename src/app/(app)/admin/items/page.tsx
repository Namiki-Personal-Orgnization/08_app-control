import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ItemsClient } from "./items-client";
import { getPublicUrl } from "@/lib/supabase";
import { parseUnitRates } from "@/lib/unit";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const data = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    baseUnit: i.baseUnit,
    unitRates: parseUnitRates(i.unitRates),
    alertEnabled: i.alertEnabled,
    alertThreshold: i.alertThreshold,
    isActive: i.isActive,
    photoUrl: getPublicUrl(i.photoUrl),
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="商品マスタ"
        description="商品の単位換算とアラート閾値を管理します。"
      />
      <ItemsClient items={data} />
    </div>
  );
}
