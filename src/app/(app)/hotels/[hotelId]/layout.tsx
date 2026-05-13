import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/layout/app-nav";
import { AppHeader } from "@/components/layout/app-header";
import { getHotel, HOTELS } from "@/config/hotels";

export default async function HotelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const session = await getSession();
  if (!session.role || !session.operator) {
    redirect("/login");
  }

  const hotel = getHotel(hotelId);
  if (!hotel) notFound();

  if (session.role === "staff" && session.currentHotelId !== hotelId) {
    redirect(
      session.currentHotelId
        ? `/hotels/${session.currentHotelId}/dashboard`
        : "/select-hotel",
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <AppHeader
        role={session.role}
        operator={session.operator}
        hotelId={hotelId}
        hotelName={hotel.name}
        hotelShortName={hotel.shortName}
        availableHotels={HOTELS.map((h) => ({ id: h.id, name: h.name, shortName: h.shortName }))}
      />
      <main className="container flex-1 pb-24 pt-4 sm:pb-8">{children}</main>
      <AppNav role={session.role} hotelId={hotelId} />
    </div>
  );
}
