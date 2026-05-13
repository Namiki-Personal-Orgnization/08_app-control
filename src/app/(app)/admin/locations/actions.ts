"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { uploadPhoto, deletePhoto } from "@/lib/supabase";

const locationFormSchema = z.object({
  id: z.string().optional(),
  floor: z.string().trim().min(1, "フロアを入力してください").max(20),
  roomName: z.string().trim().min(1, "場所名を入力してください").max(60),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});

export type ActionState = {
  ok?: boolean;
  error?: string;
};

function normalizeActive(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === "on" || v === "true") return true;
  return false;
}

export async function createLocationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = locationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadPhoto(photo, "locations");
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像アップロード失敗" };
    }
  }
  await prisma.location.create({
    data: {
      floor: parsed.data.floor,
      roomName: parsed.data.roomName,
      sortOrder: parsed.data.sortOrder,
      isActive: normalizeActive(parsed.data.isActive ?? true),
      photoUrl: photoUrl,
    },
  });
  revalidatePath("/admin/locations");
  revalidatePath("/stocktake");
  return { ok: true };
}

export async function updateLocationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = locationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id) {
    return { error: "入力内容を確認してください" };
  }
  const existing = await prisma.location.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "場所が見つかりません" };

  const photo = formData.get("photo");
  let photoUrl: string | null | undefined = undefined;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadPhoto(photo, "locations");
      if (existing.photoUrl) await deletePhoto(existing.photoUrl);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "画像アップロード失敗" };
    }
  }
  await prisma.location.update({
    where: { id: parsed.data.id },
    data: {
      floor: parsed.data.floor,
      roomName: parsed.data.roomName,
      sortOrder: parsed.data.sortOrder,
      isActive: normalizeActive(parsed.data.isActive),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    },
  });
  revalidatePath("/admin/locations");
  revalidatePath("/stocktake");
  return { ok: true };
}

export async function deleteLocationAction(id: string): Promise<ActionState> {
  await requireAdmin();
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) return { error: "場所が見つかりません" };
  const usage = await prisma.stockLog.count({ where: { locationId: id } });
  if (usage > 0) {
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/admin/locations");
    revalidatePath("/stocktake");
    return { ok: true };
  }
  if (existing.photoUrl) await deletePhoto(existing.photoUrl);
  await prisma.location.delete({ where: { id } });
  revalidatePath("/admin/locations");
  revalidatePath("/stocktake");
  return { ok: true };
}
