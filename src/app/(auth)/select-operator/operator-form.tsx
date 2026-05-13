"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const RECENT_KEY = "inventory:recent_operators";

export function OperatorForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, 8));
      }
    } catch {
      // ignore
    }
  }, []);

  async function submit(operator: string) {
    if (!operator.trim()) {
      toast({ variant: "destructive", title: "担当者名を入力してください" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator: operator.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "保存できませんでした",
          description: data.error ?? "再度お試しください",
        });
        return;
      }
      try {
        const next = [operator.trim(), ...recent.filter((r) => r !== operator.trim())].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      router.push("/select-hotel");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {recent.length > 0 && (
        <div className="space-y-2">
          <Label>最近の担当者</Label>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <Button
                key={r}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => submit(r)}
                disabled={loading}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(name);
        }}
        className="space-y-3"
      >
        <div className="space-y-2">
          <Label htmlFor="operator">担当者名（自由入力）</Label>
          <Input
            id="operator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 丹羽"
            maxLength={30}
            autoFocus
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "作業を開始"}
        </Button>
      </form>
    </div>
  );
}
