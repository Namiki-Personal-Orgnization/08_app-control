"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, PackagePlus, Settings, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const STAFF_ITEMS = [
  { href: "/dashboard", label: "ダッシュ", icon: BarChart3 },
  { href: "/arrivals", label: "入荷", icon: PackagePlus },
  { href: "/stocktake", label: "棚卸し", icon: ClipboardList },
];

const ADMIN_ITEMS = [
  { href: "/dashboard", label: "ダッシュ", icon: BarChart3 },
  { href: "/arrivals", label: "入荷", icon: PackagePlus },
  { href: "/stocktake", label: "棚卸し", icon: ClipboardList },
  { href: "/admin/items", label: "マスタ", icon: Boxes },
  { href: "/admin/history", label: "管理", icon: Settings },
];

export function AppNav({ role }: { role: "staff" | "admin" }) {
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_ITEMS : STAFF_ITEMS;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur sm:static sm:border-t-0 sm:bg-transparent sm:hidden">
      <ul className="container grid grid-cols-5 gap-1 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md p-2 text-xs transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
