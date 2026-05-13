import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackagePlus,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  computeConsumptionForMonth,
  getConsumptionTrend,
} from "@/lib/consumption";
import { currentYearMonth, formatYearMonth } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { TrendChart } from "./trend-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const yearMonth = sp.month ?? currentYearMonth();

  const [consumption, trend, close, totals] = await Promise.all([
    computeConsumptionForMonth(yearMonth),
    getConsumptionTrend(6),
    prisma.monthlyCloseStatus.findUnique({ where: { yearMonth } }),
    prisma.$transaction([
      prisma.item.count({ where: { isActive: true } }),
      prisma.location.count({ where: { isActive: true } }),
    ]),
  ]);

  const [itemCount, locationCount] = totals;
  const alerts = consumption.filter((c) => c.isBelowAlert);
  const totalConsumed = consumption.reduce(
    (sum, c) => sum + Math.max(0, c.consumedQty),
    0,
  );

  const trendData = trend.map((t) => ({
    label: t.yearMonth.slice(5).replace(/^0/, "") + "月",
    yearMonth: t.yearMonth,
    total: t.total,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="ダッシュボード"
        description={`${formatYearMonth(yearMonth)}（${close?.closedAt ? "確定済み" : "未確定"}）`}
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard
          icon={<Boxes className="h-5 w-5" />}
          label="商品数"
          value={itemCount.toString()}
          href="/admin/items"
        />
        <SummaryCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="拠点数"
          value={locationCount.toString()}
          href="/admin/locations"
        />
        <SummaryCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="今月の消費合計"
          value={totalConsumed.toLocaleString()}
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="アラート"
          value={alerts.length.toString()}
          highlight={alerts.length > 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            在庫アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              現在、閾値を下回る商品はありません。
            </p>
          ) : (
            <ul className="divide-y">
              {alerts.map((a) => (
                <li
                  key={a.itemId}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-medium">{a.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      閾値 {a.alertThreshold} {a.baseUnit} ・ 現在{" "}
                      <span className="font-semibold text-destructive">
                        {a.closingQty}
                      </span>{" "}
                      {a.baseUnit}
                    </p>
                  </div>
                  <Badge variant="destructive">要補充</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">消費トレンド（直近6ヶ月）</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">商品別 当月消費</CardTitle>
          </CardHeader>
          <CardContent>
            {consumption.length === 0 ? (
              <EmptyState title="データがありません" />
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-1 font-medium">商品</th>
                      <th className="py-1 text-right font-medium">期首</th>
                      <th className="py-1 text-right font-medium">入荷</th>
                      <th className="py-1 text-right font-medium">期末</th>
                      <th className="py-1 text-right font-medium">消費</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumption.map((c) => (
                      <tr
                        key={c.itemId}
                        className={`border-b ${c.isBelowAlert ? "bg-destructive/5" : ""}`}
                      >
                        <td className="py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{c.itemName}</span>
                            {c.isBelowAlert && (
                              <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {c.baseUnit}
                          </span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {c.openingQty.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          +{c.arrivalsQty.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {c.closingQty.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-right font-semibold tabular-nums">
                          {c.consumedQty.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <PackagePlus className="h-5 w-5 text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            次の作業を選んでください
          </p>
          <Link
            href="/arrivals"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            入荷を登録
          </Link>
          <Link
            href="/stocktake"
            className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium"
          >
            棚卸しへ
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <Card
      className={
        highlight ? "border-destructive/30 bg-destructive/5" : undefined
      }
    >
      <CardContent className="flex items-center gap-2 p-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-md ${
            highlight ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }
  return content;
}
