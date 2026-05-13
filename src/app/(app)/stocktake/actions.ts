"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/session";
import { parseUnitRates, toBase, unitRatesSchema } from "@/lib/unit";
import { currentYearMonth } from "@/lib/utils";

const upsertSnapshotSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  locationId: z.string().min(1),
  entries: z
    .array(
      z.object({
        itemId: z.string().min(1),
        rawInputs: z.record(z.string(), z.number().int().nonnegative()),
      }),
    )
    .min(1),
});

export type StocktakeActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export async function saveStocktakeAction(
  payload: z.infer<typeof upsertSnapshotSchema>,
): Promise<StocktakeActionState> {
  const session = await requireSession();
  const parsed = upsertSnapshotSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const close = await prisma.monthlyCloseStatus.findUnique({
    where: { yearMonth: parsed.data.yearMonth },
  });
  if (close?.closedAt) {
    return { error: "この月は既に確定済みです" };
  }

  const location = await prisma.location.findUnique({
    where: { id: parsed.data.locationId },
  });
  if (!location) return { error: "保管場所が見つかりません" };

  const itemIds = parsed.data.entries.map((e) => e.itemId);
  const items = await prisma.item.findMany({ where: { id: { in: itemIds } } });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  await prisma.$transaction(async (tx) => {
    for (const entry of parsed.data.entries) {
      const item = itemMap.get(entry.itemId);
      if (!item) continue;
      const rates = unitRatesSchema.parse(parseUnitRates(item.unitRates));
      const base = toBase(entry.rawInputs, item.baseUnit, rates);

      await tx.inventorySnapshot.upsert({
        where: {
          yearMonth_itemId_locationId: {
            yearMonth: parsed.data.yearMonth,
            itemId: entry.itemId,
            locationId: parsed.data.locationId,
          },
        },
        update: {
          confirmedQty: base,
          rawInputs: entry.rawInputs,
          operator: session.operator,
          confirmedAt: new Date(),
        },
        create: {
          yearMonth: parsed.data.yearMonth,
          itemId: entry.itemId,
          locationId: parsed.data.locationId,
          confirmedQty: base,
          rawInputs: entry.rawInputs,
          operator: session.operator,
        },
      });

      await tx.stockLog.create({
        data: {
          type: "COUNT",
          itemId: entry.itemId,
          locationId: parsed.data.locationId,
          quantityBase: base,
          rawInputs: entry.rawInputs,
          operator: session.operator,
        },
      });
    }
  });

  revalidatePath("/stocktake");
  revalidatePath(`/stocktake/${parsed.data.locationId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

const closeSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function closeMonthAction(
  payload: z.infer<typeof closeSchema>,
): Promise<StocktakeActionState> {
  const session = await requireAdmin();
  const parsed = closeSchema.safeParse(payload);
  if (!parsed.success) return { error: "不正な月指定です" };

  const ym = parsed.data.yearMonth;
  if (ym > currentYearMonth()) {
    return { error: "未来の月は確定できません" };
  }

  const [locations, items, snapshots, close] = await Promise.all([
    prisma.location.findMany({ where: { isActive: true } }),
    prisma.item.findMany({ where: { isActive: true } }),
    prisma.inventorySnapshot.findMany({ where: { yearMonth: ym } }),
    prisma.monthlyCloseStatus.findUnique({ where: { yearMonth: ym } }),
  ]);

  if (close?.closedAt) {
    return { error: "既に確定済みです" };
  }

  const haveKeys = new Set(snapshots.map((s) => `${s.locationId}:${s.itemId}`));
  const missing: string[] = [];
  for (const l of locations) {
    for (const i of items) {
      if (!haveKeys.has(`${l.id}:${i.id}`)) {
        missing.push(`${l.floor} ${l.roomName} / ${i.name}`);
      }
    }
  }

  if (missing.length > 0) {
    return {
      error: `未入力が ${missing.length} 件あります: ${missing.slice(0, 3).join("、")}${missing.length > 3 ? " ほか" : ""}`,
    };
  }

  await prisma.monthlyCloseStatus.upsert({
    where: { yearMonth: ym },
    update: { closedAt: new Date(), closedBy: session.operator },
    create: { yearMonth: ym, closedAt: new Date(), closedBy: session.operator },
  });
  revalidatePath("/stocktake");
  revalidatePath("/dashboard");
  return { ok: true, message: "棚卸しを確定しました" };
}

export async function reopenMonthAction(
  payload: z.infer<typeof closeSchema>,
): Promise<StocktakeActionState> {
  await requireAdmin();
  const parsed = closeSchema.safeParse(payload);
  if (!parsed.success) return { error: "不正な月指定です" };
  await prisma.monthlyCloseStatus.update({
    where: { yearMonth: parsed.data.yearMonth },
    data: { closedAt: null, closedBy: null },
  });
  revalidatePath("/stocktake");
  revalidatePath("/dashboard");
  return { ok: true };
}
