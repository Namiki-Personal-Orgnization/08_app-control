import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel } from "lucide-react";
import { HOTELS } from "@/config/hotels";
import { getSession } from "@/lib/session";
import { HotelSelectForm } from "./hotel-select-form";

export const dynamic = "force-dynamic";

export default async function SelectHotelPage() {
  const session = await getSession();
  if (!session.role || !session.operator) {
    redirect("/login");
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hotel className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">店舗を選択</CardTitle>
        <CardDescription>作業する店舗を選んでください</CardDescription>
      </CardHeader>
      <CardContent>
        <HotelSelectForm
          hotels={HOTELS.map((h) => ({ id: h.id, name: h.name, shortName: h.shortName }))}
        />
      </CardContent>
    </Card>
  );
}
