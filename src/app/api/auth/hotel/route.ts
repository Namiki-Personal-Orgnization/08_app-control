import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { isValidHotelId } from "@/config/hotels";

const schema = z.object({
  hotelId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.role) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidHotelId(parsed.data.hotelId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 400 });
  }
  session.currentHotelId = parsed.data.hotelId;
  await session.save();
  return NextResponse.json({ currentHotelId: session.currentHotelId });
}
