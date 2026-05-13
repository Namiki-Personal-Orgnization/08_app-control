import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HOTELS, isValidHotelId } from "@/config/hotels";

export default async function Home() {
  const session = await getSession();
  if (!session.role) redirect("/login");
  if (!session.operator) redirect("/select-operator");
  if (session.currentHotelId && isValidHotelId(session.currentHotelId)) {
    redirect(`/hotels/${session.currentHotelId}/dashboard`);
  }
  if (HOTELS.length === 1) {
    redirect(`/hotels/${HOTELS[0].id}/dashboard`);
  }
  redirect("/select-hotel");
}
