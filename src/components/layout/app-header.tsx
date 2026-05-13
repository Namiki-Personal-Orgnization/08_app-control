"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hotel,
  LogOut,
  UserCircle,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  PackagePlus,
  Settings,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type HotelOption = { id: string; name: string; shortName: string };

function buildLinks(hotelId: string, role: "staff" | "admin") {
  const base = [
    { href: `/hotels/${hotelId}/dashboard`, label: "ダッシュボード", icon: BarChart3 },
    { href: `/hotels/${hotelId}/arrivals`, label: "入荷", icon: PackagePlus },
    { href: `/hotels/${hotelId}/stocktake`, label: "棚卸し", icon: ClipboardList },
  ];
  if (role !== "admin") return base;
  return [
    ...base,
    { href: `/hotels/${hotelId}/admin/items`, label: "商品マスタ", icon: Boxes },
    { href: `/hotels/${hotelId}/admin/locations`, label: "場所マスタ", icon: Boxes },
    { href: `/hotels/${hotelId}/admin/history`, label: "履歴", icon: Settings },
  ];
}

export function AppHeader({
  role,
  operator,
  hotelId,
  hotelName,
  hotelShortName,
  availableHotels,
}: {
  role: "staff" | "admin";
  operator: string;
  hotelId: string;
  hotelName: string;
  hotelShortName: string;
  availableHotels: HotelOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [switching, setSwitching] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const links = buildLinks(hotelId, role);

  React.useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchHotel(newId: string) {
    setOpen(false);
    if (newId === hotelId) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/auth/hotel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: newId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "店舗の切り替えに失敗しました",
          description: data.error ?? "再度お試しください",
        });
        return;
      }
      router.push(`/hotels/${newId}/dashboard`);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  const canSwitch = role === "admin" && availableHotels.length > 1;

  return (
    <header className="safe-top sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link
          href={`/hotels/${hotelId}/dashboard`}
          className="flex items-center gap-2 font-semibold"
        >
          <Hotel className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">ホテル在庫管理</span>
          <span className="sm:hidden">在庫管理</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {canSwitch ? (
            <div className="relative" ref={menuRef}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={switching}
                onClick={() => setOpen((v) => !v)}
              >
                {switching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{hotelName}</span>
                <span className="sm:hidden">{hotelShortName}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
              {open ? (
                <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    店舗を切り替え
                  </div>
                  <div className="my-1 h-px bg-border" />
                  {availableHotels.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => switchHotel(h.id)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="flex-1 text-left">{h.name}</span>
                      {h.id === hotelId ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <Badge variant="outline" className="hidden gap-1 sm:flex">
              <Building2 className="h-3 w-3" /> {hotelShortName}
            </Badge>
          )}
          {role === "admin" ? (
            <Badge variant="default" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> 管理者
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <UserCircle className="h-3 w-3" /> {operator}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="ログアウト"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
