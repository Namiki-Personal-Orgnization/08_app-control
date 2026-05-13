import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { HOTELS, isValidHotelId } from "@/config/hotels";

const PUBLIC_PATHS = [
  "/login",
  "/select-operator",
  "/select-hotel",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/operator",
  "/api/auth/hotel",
];

const HOTEL_ROUTE = /^\/hotels\/([^/]+)(?:\/(.*))?$/;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!session.role) {
    if (isPublic) return res;
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.operator) {
    if (pathname === "/select-operator" || pathname.startsWith("/api/auth")) return res;
    const url = req.nextUrl.clone();
    url.pathname = "/select-operator";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" || pathname === "/select-operator") {
    const target = session.currentHotelId
      ? `/hotels/${session.currentHotelId}/dashboard`
      : "/select-hotel";
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  const hotelMatch = pathname.match(HOTEL_ROUTE);
  if (hotelMatch) {
    const urlHotelId = hotelMatch[1];
    if (!isValidHotelId(urlHotelId)) {
      const url = req.nextUrl.clone();
      url.pathname = "/select-hotel";
      return NextResponse.redirect(url);
    }

    if (session.role === "staff") {
      if (!session.currentHotelId || session.currentHotelId !== urlHotelId) {
        const url = req.nextUrl.clone();
        url.pathname = session.currentHotelId
          ? `/hotels/${session.currentHotelId}/dashboard`
          : "/select-hotel";
        return NextResponse.redirect(url);
      }
    } else {
      if (session.currentHotelId !== urlHotelId) {
        session.currentHotelId = urlHotelId;
        await session.save();
      }
    }
    return res;
  }

  if (pathname === "/select-hotel") {
    if (HOTELS.length === 1) {
      session.currentHotelId = HOTELS[0].id;
      await session.save();
      const url = req.nextUrl.clone();
      url.pathname = `/hotels/${HOTELS[0].id}/dashboard`;
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (pathname === "/") {
    if (session.currentHotelId && isValidHotelId(session.currentHotelId)) {
      const url = req.nextUrl.clone();
      url.pathname = `/hotels/${session.currentHotelId}/dashboard`;
      return NextResponse.redirect(url);
    }
    if (HOTELS.length === 1) {
      session.currentHotelId = HOTELS[0].id;
      await session.save();
      const url = req.nextUrl.clone();
      url.pathname = `/hotels/${HOTELS[0].id}/dashboard`;
      return NextResponse.redirect(url);
    }
    const url = req.nextUrl.clone();
    url.pathname = "/select-hotel";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)"],
};
