import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { LocationsClient } from "./locations-client";
import { getPublicUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const locations = await prisma.location.findMany({
    where: { hotelId },
    orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { roomName: "asc" }],
  });
  const data = locations.map((l) => ({
    ...l,
    photoUrl: getPublicUrl(l.photoUrl),
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));
  return (
    <div className="space-y-4">
      <PageHeader
        title="場所マスタ"
        description="フロアと保管場所を管理します。"
      />
      <LocationsClient hotelId={hotelId} locations={data} />
    </div>
  );
}
