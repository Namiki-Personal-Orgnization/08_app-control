"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { parseUnitRates, toBase, unitRatesSchema } from "@/lib/unit";

const arrivalSchema = z.object({
  itemId: z.string().min(1),
  locationId: z.string().min(1),
  rawInputs: z.record(z.string(), z.number().int().nonnegative()),
  note: z.string().optional(),
});

export type ArrivalActionState = {
  ok?: boolean;
  error?: string;
};

export async function createArrivalAction(
  payload: z.infer<typeof arrivalSchema>,
): Promise<ArrivalActionState> {
  const session = await requireSession();
  const parsed = arrivalSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const item = await prisma.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!item || !item.isActive) {
    return { error: "商品が見つかりません" };
  }
  const location = await prisma.location.findUnique({
    where: { id: parsed.data.locationId },
  });
  if (!location || !location.isActive) {
    return { error: "保管場所が見つかりません" };
  }

  const rates = parseUnitRates(item.unitRates);
  const safeRates = unitRatesSchema.parse(rates);
  const quantityBase = toBase(parsed.data.rawInputs, item.baseUnit, safeRates);
  if (quantityBase <= 0) {
    return { error: "数量を入力してください" };
  }

  await prisma.stockLog.create({
    data: {
      type: "ARRIVAL",
      itemId: parsed.data.itemId,
      locationId: parsed.data.locationId,
      quantityBase,
      rawInputs: parsed.data.rawInputs,
      operator: session.operator,
      note: parsed.data.note?.trim() || null,
    },
  });
  revalidatePath("/arrivals");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteArrivalAction(id: string): Promise<ArrivalActionState> {
  const session = await requireSession();
  if (session.role !== "admin") {
    return { error: "管理者のみ削除できます" };
  }
  const existing = await prisma.stockLog.findUnique({ where: { id } });
  if (!existing || existing.type !== "ARRIVAL") {
    return { error: "対象が見つかりません" };
  }
  await prisma.stockLog.delete({ where: { id } });
  revalidatePath("/arrivals");
  revalidatePath("/dashboard");
  return { ok: true };
}
