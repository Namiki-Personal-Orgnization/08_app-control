import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatYearMonth } from "@/lib/utils";
import { ReopenMonthButton } from "../../stocktake/month-actions";

export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  const [recentLogs, closes] = await Promise.all([
    prisma.stockLog.findMany({
      orderBy: { occurredAt: "desc" },
      take: 50,
      include: { item: true, location: true },
    }),
    prisma.monthlyCloseStatus.findMany({
      orderBy: { yearMonth: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="管理"
        description="月次確定の解除や、最新の操作ログを確認できます。"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">月次確定状況</CardTitle>
        </CardHeader>
        <CardContent>
          {closes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだ確定済みの月はありません。
            </p>
          ) : (
            <ul className="divide-y">
              {closes.map((c) => (
                <li
                  key={c.yearMonth}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-medium">{formatYearMonth(c.yearMonth)}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.closedAt
                        ? `${formatDateTime(c.closedAt)} に ${c.closedBy ?? "?"} が確定`
                        : "未確定"}
                    </p>
                  </div>
                  {c.closedAt ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">確定済み</Badge>
                      <ReopenMonthButton yearMonth={c.yearMonth} />
                    </div>
                  ) : (
                    <Badge variant="secondary">未確定</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最新の操作ログ（50件）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1 font-medium">日時</th>
                  <th className="py-1 font-medium">種別</th>
                  <th className="py-1 font-medium">商品</th>
                  <th className="py-1 font-medium">場所</th>
                  <th className="py-1 text-right font-medium">数量</th>
                  <th className="py-1 font-medium">担当</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-1.5 text-xs text-muted-foreground">
                      {formatDateTime(l.occurredAt)}
                    </td>
                    <td className="py-1.5">
                      {l.type === "ARRIVAL" ? (
                        <Badge variant="default" className="text-[10px]">入荷</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">棚卸</Badge>
                      )}
                    </td>
                    <td className="py-1.5">{l.item.name}</td>
                    <td className="py-1.5 text-xs">
                      {l.location.floor} {l.location.roomName}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {l.type === "ARRIVAL" ? "+" : ""}
                      {l.quantityBase} {l.item.baseUnit}
                    </td>
                    <td className="py-1.5 text-xs">{l.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
