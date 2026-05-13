"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Hotel } from "lucide-react";

type HotelOption = { id: string; name: string; shortName: string };

export function HotelSelectForm({ hotels }: { hotels: HotelOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  async function select(hotelId: string) {
    setLoadingId(hotelId);
    try {
      const res = await fetch("/api/auth/hotel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "店舗を切り替えられませんでした",
          description: data.error ?? "再度お試しください",
        });
        return;
      }
      router.push(`/hotels/${hotelId}/dashboard`);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {hotels.map((h) => (
        <Button
          key={h.id}
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-start"
          onClick={() => select(h.id)}
          disabled={loadingId !== null}
        >
          {loadingId === h.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Hotel className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">{h.name}</span>
          <span className="text-xs text-muted-foreground">{h.shortName}</span>
        </Button>
      ))}
    </div>
  );
}
