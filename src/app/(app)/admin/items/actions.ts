"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { uploadPhoto, deletePhoto } from "@/lib/supabase";
import { unitRatesSchema } from "@/lib/unit";

const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "商品名を入力してください").max(60),
  category: z.string().trim().max(30).optional().or(z.literal("")),
  baseUnit: z.string().trim().min(1).max(10),
  unitRatesJson: z.string().default("[]"),
  alertEnabled: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
  alertThreshold: z.string().optional(),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

export type ItemActionState = {
  ok?: boolean;
  error?: string;
};

function normBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === "on" || v === "true") return true;
  return false;
}

export async function createItemAction(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  await requireAdmin();
  return saveItem(formData, false);
}

export async function updateItemAction(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  await requireAdmin();
  return saveItem(formData, true);
}

async function saveItem(formData: FormData, isUpdate: boolean): Promise<ItemActionState> {
  const parsed = baseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  let unitRates: { name: string; rate: number }[] = [];
  try {
    const json = JSON.parse(parsed.data.unitRatesJson || "[]");
    const re = unitRatesSchema.safeParse(json);
    if (!re.success) {
      return { error: "単位設定が不正です" };
    }
    unitRates = re.data;
  } catch {
    return { error: "単位設定のJSONが不正です" };
  }

  const alertEnabled = normBool(parsed.data.alertEnabled);
  let alertThreshold: number | null = null;
  if (alertEnabled && parsed.data.alertThreshold) {
    const n = Number(parsed.data.alertThreshold);
    if (!Number.isFinite(n) || n < 0) {
      return { error: "アラート閾値は0以上の数値で入力してください" };
    }
    alertThreshold = Math.floor(n);
  }

  const photo = formData.get("photo");
  let photoUrl: string | null | undefined = undefined;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadPhoto(photo, "items");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像アップロード失敗" };
    }
  }

  if (isUpdate) {
    if (!parsed.data.id) return { error: "更新対象が不明です" };
    const existing = await prisma.item.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return { error: "商品が見つかりません" };
    if (photoUrl && existing.photoUrl) {
      await deletePhoto(existing.photoUrl);
    }
    await prisma.item.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        baseUnit: parsed.data.baseUnit,
        unitRates,
        alertEnabled,
        alertThreshold,
        isActive: normBool(parsed.data.isActive),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
      },
    });
  } else {
    await prisma.item.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category || null,
        baseUnit: parsed.data.baseUnit,
        unitRates,
        alertEnabled,
        alertThreshold,
        isActive: normBool(parsed.data.isActive ?? true),
        photoUrl: photoUrl ?? null,
      },
    });
  }
  revalidatePath("/admin/items");
  revalidatePath("/dashboard");
  revalidatePath("/arrivals");
  revalidatePath("/stocktake");
  return { ok: true };
}

export async function deleteItemAction(id: string): Promise<ItemActionState> {
  await requireAdmin();
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return { error: "商品が見つかりません" };
  const usage = await prisma.stockLog.count({ where: { itemId: id } });
  if (usage > 0) {
    await prisma.item.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/items");
    return { ok: true };
  }
  if (existing.photoUrl) await deletePhoto(existing.photoUrl);
  await prisma.item.delete({ where: { id } });
  revalidatePath("/admin/items");
  return { ok: true };
}
