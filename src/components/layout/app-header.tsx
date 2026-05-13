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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STAFF_LINKS = [
  { href: "/dashboard", label: "ダッシュボード", icon: BarChart3 },
  { href: "/arrivals", label: "入荷", icon: PackagePlus },
  { href: "/stocktake", label: "棚卸し", icon: ClipboardList },
];

const ADMIN_LINKS = [
  ...STAFF_LINKS,
  { href: "/admin/items", label: "商品マスタ", icon: Boxes },
  { href: "/admin/locations", label: "場所マスタ", icon: Boxes },
  { href: "/admin/history", label: "履歴", icon: Settings },
];

export function AppHeader({
  role,
  operator,
}: {
  role: "staff" | "admin";
  operator: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const links = role === "admin" ? ADMIN_LINKS : STAFF_LINKS;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="safe-top sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
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
