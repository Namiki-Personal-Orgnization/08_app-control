"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { uploadPhoto, deletePhoto } from "@/lib/supabase";
import { isValidHotelId } from "@/config/hotels";

const locationFormSchema = z.object({
  hotelId: z.string().min(1),
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
  if (!parsed.success || !isValidHotelId(parsed.data.hotelId)) {
    return {
      error: parsed.success
        ? "店舗指定が不正です"
        : (parsed.error.issues[0]?.message ?? "入力内容を確認してください"),
    };
  }
  const hotelId = parsed.data.hotelId;
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
      hotelId,
      floor: parsed.data.floor,
      roomName: parsed.data.roomName,
      sortOrder: parsed.data.sortOrder,
      isActive: normalizeActive(parsed.data.isActive ?? true),
      photoUrl: photoUrl,
    },
  });
  revalidatePath(`/hotels/${hotelId}/admin/locations`);
  revalidatePath(`/hotels/${hotelId}/stocktake`);
  return { ok: true };
}

export async function updateLocationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = locationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id || !isValidHotelId(parsed.data.hotelId)) {
    return { error: "入力内容を確認してください" };
  }
  const hotelId = parsed.data.hotelId;
  const existing = await prisma.location.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.hotelId !== hotelId) {
    return { error: "場所が見つかりません" };
  }

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
  revalidatePath(`/hotels/${hotelId}/admin/locations`);
  revalidatePath(`/hotels/${hotelId}/stocktake`);
  return { ok: true };
}

export async function deleteLocationAction(
  hotelId: string,
  id: string,
): Promise<ActionState> {
  if (!isValidHotelId(hotelId)) return { error: "店舗が見つかりません" };
  await requireAdmin();
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing || existing.hotelId !== hotelId) {
    return { error: "場所が見つかりません" };
  }
  const usage = await prisma.stockLog.count({ where: { locationId: id } });
  if (usage > 0) {
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath(`/hotels/${hotelId}/admin/locations`);
    revalidatePath(`/hotels/${hotelId}/stocktake`);
    return { ok: true };
  }
  if (existing.photoUrl) await deletePhoto(existing.photoUrl);
  await prisma.location.delete({ where: { id } });
  revalidatePath(`/hotels/${hotelId}/admin/locations`);
  revalidatePath(`/hotels/${hotelId}/stocktake`);
  return { ok: true };
}
