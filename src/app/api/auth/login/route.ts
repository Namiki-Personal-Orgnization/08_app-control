import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession, type Role } from "@/lib/session";

const schema = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

const STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

function authenticate(userId: string, password: string): Role | null {
  const id = userId.trim().toLowerCase();
  if (id === "admin" && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
    return "admin";
  }
  if (id === "staff" && STAFF_PASSWORD && password === STAFF_PASSWORD) {
    return "staff";
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const role = authenticate(parsed.data.userId, parsed.data.password);
  if (!role) {
    return NextResponse.json({ error: "認証情報が正しくありません" }, { status: 401 });
  }
  const session = await getSession();
  session.role = role;
  session.operator = role === "admin" ? "管理者" : undefined;
  session.loginAt = Date.now();
  await session.save();
  return NextResponse.json({ role });
}
