import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";

const schema = z.object({
  operator: z.string().trim().min(1).max(30),
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
  if (!parsed.success) {
    return NextResponse.json({ error: "担当者名を入力してください" }, { status: 400 });
  }
  session.operator = parsed.data.operator;
  await session.save();
  return NextResponse.json({ operator: session.operator });
}
