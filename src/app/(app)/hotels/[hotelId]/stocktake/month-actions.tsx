"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { closeMonthAction, reopenMonthAction } from "./actions";

export function CloseMonthButton({
  hotelId,
  yearMonth,
  disabled,
}: {
  hotelId: string;
  yearMonth: string;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handle() {
    if (!confirm(`${yearMonth} の棚卸しを確定します。よろしいですか？`)) return;
    setPending(true);
    const res = await closeMonthAction({ hotelId, yearMonth });
    setPending(false);
    if (res.error) {
      toast({ variant: "destructive", title: "確定できません", description: res.error });
    } else {
      toast({ title: res.message ?? "確定しました" });
      router.refresh();
    }
  }

  return (
    <Button
      onClick={handle}
      disabled={disabled || pending}
      size="lg"
      variant="success"
    >
      <Lock className="h-4 w-4" />
      {pending ? "確定中..." : "棚卸しを確定"}
    </Button>
  );
}

export function ReopenMonthButton({
  hotelId,
  yearMonth,
}: {
  hotelId: string;
  yearMonth: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handle() {
    if (!confirm(`${yearMonth} の確定を解除します。よろしいですか？`)) return;
    setPending(true);
    const res = await reopenMonthAction({ hotelId, yearMonth });
    setPending(false);
    if (res.error) {
      toast({ variant: "destructive", title: "解除失敗", description: res.error });
    } else {
      toast({ title: "確定を解除しました" });
      router.refresh();
    }
  }

  return (
    <Button onClick={handle} disabled={pending} variant="outline">
      <Unlock className="h-4 w-4" />
      {pending ? "処理中..." : "確定を解除"}
    </Button>
  );
}
