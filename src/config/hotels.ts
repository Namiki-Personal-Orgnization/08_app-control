/**
 * 店舗（ホテル）マスタ。
 *
 * 新しい店舗を追加する場合は、この配列に項目を追加してください。
 * 一度設定した `id` は DB のレコードと紐づくため、後から変更しないでください。
 *
 * 例:
 *   { id: "osaka", name: "ホテル大阪", shortName: "大阪" }
 *
 * 反映手順:
 *   1. 下の HOTELS 配列に追加
 *   2. git push  → Vercel が自動再デプロイ
 *   3. ログインして店舗選択画面から新店舗を選ぶ → マスタ（場所・商品）を登録
 */
export const HOTELS = [
  {
    id: "tokyo",
    name: "ホテル東京",
    shortName: "東京",
    address: null,
  },
] as const satisfies ReadonlyArray<Hotel>;

export type Hotel = {
  id: string;
  name: string;
  shortName: string;
  address: string | null;
};

export type HotelId = (typeof HOTELS)[number]["id"];

export function getHotel(hotelId: string): Hotel | null {
  return HOTELS.find((h) => h.id === hotelId) ?? null;
}

export function isValidHotelId(hotelId: string | undefined | null): hotelId is HotelId {
  if (!hotelId) return false;
  return HOTELS.some((h) => h.id === hotelId);
}

export const DEFAULT_HOTEL_ID: HotelId = HOTELS[0].id;
