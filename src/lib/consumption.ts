import { prisma } from "./prisma";
import { prevYearMonth } from "./utils";

export type ConsumptionResult = {
  itemId: string;
  itemName: string;
  baseUnit: string;
  openingQty: number;
  arrivalsQty: number;
  closingQty: number;
  consumedQty: number;
  alertEnabled: boolean;
  alertThreshold: number | null;
  isBelowAlert: boolean;
};

export async function computeConsumptionForMonth(
  hotelId: string,
  yearMonth: string,
): Promise<ConsumptionResult[]> {
  const previous = prevYearMonth(yearMonth);
  const items = await prisma.item.findMany({
    where: { hotelId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const [openingSnapshots, closingSnapshots, monthArrivals] = await Promise.all([
    prisma.inventorySnapshot.groupBy({
      by: ["itemId"],
      where: { hotelId, yearMonth: previous },
      _sum: { confirmedQty: true },
    }),
    prisma.inventorySnapshot.groupBy({
      by: ["itemId"],
      where: { hotelId, yearMonth: yearMonth },
      _sum: { confirmedQty: true },
    }),
    prisma.stockLog.groupBy({
      by: ["itemId"],
      where: {
        hotelId,
        type: "ARRIVAL",
        occurredAt: {
          gte: monthStart(yearMonth),
          lt: monthStart(nextMonth(yearMonth)),
        },
      },
      _sum: { quantityBase: true },
    }),
  ]);

  const openingMap = new Map<string, number>(
    openingSnapshots.map((s) => [s.itemId, s._sum.confirmedQty ?? 0]),
  );
  const closingMap = new Map<string, number>(
    closingSnapshots.map((s) => [s.itemId, s._sum.confirmedQty ?? 0]),
  );
  const arrivalMap = new Map<string, number>(
    monthArrivals.map((s) => [s.itemId, s._sum.quantityBase ?? 0]),
  );

  return items.map<ConsumptionResult>((item) => {
    const opening = openingMap.get(item.id) ?? 0;
    const arrivals = arrivalMap.get(item.id) ?? 0;
    const closing = closingMap.get(item.id) ?? 0;
    const consumed = opening + arrivals - closing;
    const isBelowAlert =
      item.alertEnabled &&
      typeof item.alertThreshold === "number" &&
      closing < item.alertThreshold;
    return {
      itemId: item.id,
      itemName: item.name,
      baseUnit: item.baseUnit,
      openingQty: opening,
      arrivalsQty: arrivals,
      closingQty: closing,
      consumedQty: consumed,
      alertEnabled: item.alertEnabled,
      alertThreshold: item.alertThreshold,
      isBelowAlert,
    };
  });
}

export async function getConsumptionTrend(hotelId: string, months: number) {
  const list: { yearMonth: string }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({
      yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  const results = await Promise.all(
    list.map(async (l) => {
      const data = await computeConsumptionForMonth(hotelId, l.yearMonth);
      const total = data.reduce((acc, d) => acc + Math.max(0, d.consumedQty), 0);
      return { yearMonth: l.yearMonth, total, byItem: data };
    }),
  );
  return results;
}

function monthStart(yearMonth: string): Date {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function nextMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
