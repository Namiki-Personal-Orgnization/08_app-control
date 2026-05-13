"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState("staff");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "ログイン失敗",
          description: data.error ?? "認証情報を確認してください",
        });
        return;
      }
      const from = params.get("from");
      if (data.role === "admin") {
        if (from && from !== "/" && from.startsWith("/hotels/")) {
          router.push(from);
        } else {
          router.push("/select-hotel");
        }
      } else {
        router.push("/select-operator");
      }
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "通信エラー",
        description: "再度お試しください",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">アカウントID</Label>
        <Input
          id="userId"
          name="userId"
          autoComplete="username"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="staff または admin"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ログイン"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        現場用: <code className="rounded bg-muted px-1 py-0.5">staff</code> /
        管理用: <code className="rounded bg-muted px-1 py-0.5">admin</code>
      </p>
    </form>
  );
}
