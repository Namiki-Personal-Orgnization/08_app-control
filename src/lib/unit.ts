import { z } from "zod";

export const unitRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().int().positive(),
});

export type UnitRate = z.infer<typeof unitRateSchema>;

export const unitRatesSchema = z.array(unitRateSchema);

export function parseUnitRates(value: unknown): UnitRate[] {
  const parsed = unitRatesSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (typeof value === "string") {
    try {
      const j = JSON.parse(value);
      const re = unitRatesSchema.safeParse(j);
      if (re.success) return re.data;
    } catch {
      // ignore
    }
  }
  return [];
}

export type RawInputs = Record<string, number>;

export function toBase(
  rawInputs: RawInputs,
  baseUnit: string,
  unitRates: UnitRate[],
): number {
  let total = 0;
  for (const [unitName, qty] of Object.entries(rawInputs)) {
    if (!qty || qty < 0) continue;
    if (unitName === baseUnit) {
      total += qty;
      continue;
    }
    const rate = unitRates.find((u) => u.name === unitName)?.rate;
    if (rate) {
      total += qty * rate;
    }
  }
  return total;
}

export function formatBaseWithBreakdown(
  base: number,
  baseUnit: string,
  unitRates: UnitRate[],
): string {
  if (base === 0) return `0 ${baseUnit}`;
  const sorted = [...unitRates].sort((a, b) => b.rate - a.rate);
  let remaining = base;
  const parts: string[] = [];
  for (const u of sorted) {
    const q = Math.floor(remaining / u.rate);
    if (q > 0) {
      parts.push(`${q}${u.name}`);
      remaining -= q * u.rate;
    }
  }
  if (remaining > 0 || parts.length === 0) {
    parts.push(`${remaining}${baseUnit}`);
  }
  return `${parts.join(" ")} (合計 ${base} ${baseUnit})`;
}
