import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export type Role = "staff" | "admin";

export type SessionData = {
  role?: Role;
  operator?: string;
  loginAt?: number;
};

const SESSION_PASSWORD =
  process.env.SESSION_PASSWORD ??
  "dev-only-fallback-please-change-me-to-at-least-32-chars";

export const sessionOptions: SessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: "inventory_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireSession(): Promise<
  IronSession<SessionData> & { role: Role; operator: string }
> {
  const session = await getSession();
  if (!session.role || !session.operator) {
    throw new Error("UNAUTHENTICATED");
  }
  return session as IronSession<SessionData> & { role: Role; operator: string };
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
